import json
import pytest
from openjarvis.tools.freds_orchestration_tools import (
    FredsQueryInventoryTool,
    FredsProposePlanTool,
    FredsDispatchTaskTool,
    _ORCHESTRATED_TASKS,
)


def test_freds_query_inventory():
    tool = FredsQueryInventoryTool()
    res = tool.execute(unit_id="test-unit")
    assert res.success is True
    data = json.loads(res.content)
    assert len(data["agents"]) >= 6
    agent_ids = [a["agent_id"] for a in data["agents"]]
    assert "architect" in agent_ids
    assert "developer" in agent_ids
    assert "tester" in agent_ids


def test_freds_propose_and_dispatch_idempotent():
    plan_tool = FredsProposePlanTool()
    res_plan = plan_tool.execute(
        operation_id="op-e2e-1",
        budget_max_usd=2.5,
        steps=[
            {"title": "Design schema", "agent_id": "architect", "command": "/agent architect design"},
            {"title": "Implement code", "agent_id": "developer", "command": "/agent developer implement"},
        ],
    )
    assert res_plan.success is True
    plan_data = json.loads(res_plan.content)
    assert plan_data["total_steps"] == 2
    tasks = plan_data["planned_tasks"]
    assert len(tasks) == 2

    task_1 = tasks[0]
    dispatch_tool = FredsDispatchTaskTool()

    # First dispatch
    res_disp1 = dispatch_tool.execute(
        task_id=task_1["task_id"],
        idempotency_key=task_1["idempotency_key"],
    )
    assert res_disp1.success is True
    disp_data1 = json.loads(res_disp1.content)
    assert disp_data1["status"] == "dispatched"

    # Second dispatch with same idempotency key must be idempotent
    res_disp2 = dispatch_tool.execute(
        task_id=task_1["task_id"],
        idempotency_key=task_1["idempotency_key"],
    )
    assert res_disp2.success is True
    disp_data2 = json.loads(res_disp2.content)
    assert disp_data2["status"] == "dispatched"
    assert "Idempotent hit" in disp_data2["message"]


def test_cancelled_task_dispatch_rejected():
    plan_tool = FredsProposePlanTool()
    res_plan = plan_tool.execute(
        operation_id="op-cancelled-test",
        budget_max_usd=1.0,
        steps=[{"title": "Risky operation", "agent_id": "developer", "command": "deploy"}],
    )
    plan_data = json.loads(res_plan.content)
    task_id = plan_data["planned_tasks"][0]["task_id"]

    # Mark cancelled
    _ORCHESTRATED_TASKS[task_id].cancellation_requested = True

    dispatch_tool = FredsDispatchTaskTool()
    res = dispatch_tool.execute(task_id=task_id, idempotency_key="idemp-canc")
    assert res.success is False
    assert "cancelled" in res.content
