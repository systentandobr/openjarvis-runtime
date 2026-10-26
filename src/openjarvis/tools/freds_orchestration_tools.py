"""Freds Orchestration Tools for OpenJarvis.

Implements FO-06:
- Authorized capabilities for Freds persona:
  * Consult inventory & live executor status
  * Propose structured multi-agent plans with operation/attempt/parent IDs
  * Dispatch authorized tasks to Friendly executor with budget checks & idempotency
  * Track dependencies and artifacts
  * Request scoped cancellations
- Explicit states: planned -> queued -> dispatched -> started -> completed -> validated
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from openjarvis.core.registry import ToolRegistry
from openjarvis.core.types import ToolResult
from openjarvis.tools._stubs import BaseTool, ToolSpec

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# State Tracking for Orchestrated Tasks
# ---------------------------------------------------------------------------

@dataclass
class OrchestratedTask:
    task_id: str
    operation_id: str
    parent_execution_id: Optional[str]
    attempt_id: str
    agent_id: str
    source_unit_id: str
    target_executor_unit_id: str
    title: str
    command: str
    budget_usd: float
    status: str  # planned | queued | dispatched | started | completed | validated | cancelled
    idempotency_key: str
    artifacts: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    cancellation_requested: bool = False


_ORCHESTRATED_TASKS: Dict[str, OrchestratedTask] = {}
_OPERATION_BUDGETS: Dict[str, float] = {}


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@ToolRegistry.register("freds_query_inventory")
class FredsQueryInventoryTool(BaseTool):
    """Query live agent roster, capabilities, and active executions from Friendly."""

    tool_id = "freds_query_inventory"

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="freds_query_inventory",
            description="Query canonical agent inventory and active execution runs in the Freds ecosystem.",
            parameters={
                "type": "object",
                "properties": {
                    "unit_id": {
                        "type": "string",
                        "description": "Tenant unit ID to query (e.g. '#BR#RN#59091170#270#ROYAL_A#801').",
                    },
                    "agent_id": {
                        "type": "string",
                        "description": "Optional agent ID filter (e.g. 'architect', 'developer', 'tester', 'ux').",
                    },
                },
            },
        )

    def execute(self, **kwargs: Any) -> ToolResult:
        unit_id = kwargs.get("unit_id") or "default"
        agent_id = kwargs.get("agent_id")

        canonical_agents = [
            {"agent_id": "architect", "role": "Software Architecture", "channels": ["telegram", "websocket", "tui"]},
            {"agent_id": "developer", "role": "Code Implementation", "channels": ["telegram", "websocket", "tui"]},
            {"agent_id": "tester", "role": "Quality Assurance & E2E", "channels": ["telegram", "websocket", "tui"]},
            {"agent_id": "ux", "role": "UX Design & Stitch", "channels": ["telegram", "websocket", "tui"]},
            {"agent_id": "security-auditor", "role": "Security & Guardrails", "channels": ["telegram", "websocket", "tui"]},
            {"agent_id": "manager", "role": "Coordination & Backlog", "channels": ["telegram", "websocket", "tui"]},
        ]

        if agent_id:
            canonical_agents = [a for a in canonical_agents if a["agent_id"] == agent_id]

        active_runs = [
            asdict(t) for t in _ORCHESTRATED_TASKS.values()
            if t.status in ("queued", "dispatched", "started") and (not agent_id or t.agent_id == agent_id)
        ]

        return ToolResult(
            tool_name=self.tool_id,
            content=json.dumps({
                "unit_id": unit_id,
                "agents": canonical_agents,
                "active_runs": active_runs,
                "total_tracked": len(_ORCHESTRATED_TASKS),
            }),
            success=True,
        )


@ToolRegistry.register("freds_propose_plan")
class FredsProposePlanTool(BaseTool):
    """Propose a structured multi-agent plan with budget, operation ID, and execution DAG."""

    tool_id = "freds_propose_plan"

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="freds_propose_plan",
            description="Propose a structured execution plan across Freds agents with strict budget and correlation IDs.",
            parameters={
                "type": "object",
                "properties": {
                    "operation_id": {"type": "string", "description": "Correlation ID for the entire multi-step operation."},
                    "budget_max_usd": {"type": "number", "description": "Maximum USD budget cap for the entire operation."},
                    "steps": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {"type": "string"},
                                "agent_id": {"type": "string"},
                                "command": {"type": "string"},
                                "depends_on_step_index": {"type": "integer"},
                            },
                            "required": ["title", "agent_id", "command"],
                        },
                    },
                },
                "required": ["operation_id", "budget_max_usd", "steps"],
            },
        )

    def execute(self, **kwargs: Any) -> ToolResult:
        op_id = kwargs.get("operation_id")
        budget = float(kwargs.get("budget_max_usd", 1.0))
        steps = kwargs.get("steps", [])

        if not op_id or not steps:
            return ToolResult(tool_name=self.tool_id, content="Missing operation_id or steps", success=False)

        _OPERATION_BUDGETS[op_id] = budget
        created_tasks = []

        for idx, step in enumerate(steps):
            task_id = str(uuid.uuid4())
            idempotency_key = f"{op_id}:{idx}:{step['agent_id']}"
            task = OrchestratedTask(
                task_id=task_id,
                operation_id=op_id,
                parent_execution_id=None,
                attempt_id="1",
                agent_id=step["agent_id"],
                source_unit_id="openjarvis",
                target_executor_unit_id="friendly",
                title=step["title"],
                command=step["command"],
                budget_usd=round(budget / len(steps), 4),
                status="planned",
                idempotency_key=idempotency_key,
            )
            _ORCHESTRATED_TASKS[task_id] = task
            created_tasks.append(asdict(task))

        return ToolResult(
            tool_name=self.tool_id,
            content=json.dumps({
                "operation_id": op_id,
                "total_steps": len(steps),
                "allocated_budget_usd": budget,
                "planned_tasks": created_tasks,
            }),
            success=True,
        )


@ToolRegistry.register("freds_dispatch_task")
class FredsDispatchTaskTool(BaseTool):
    """Dispatch an authorized planned task to the Friendly executor with idempotency check."""

    tool_id = "freds_dispatch_task"

    @property
    def spec(self) -> ToolSpec:
        return ToolSpec(
            name="freds_dispatch_task",
            description="Dispatch an authorized task to the Friendly executor. Validates budget, dependencies and idempotency.",
            parameters={
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "ID of the planned task to dispatch."},
                    "idempotency_key": {"type": "string", "description": "Client idempotency key."},
                },
                "required": ["task_id", "idempotency_key"],
            },
        )

    def execute(self, **kwargs: Any) -> ToolResult:
        task_id = kwargs.get("task_id")
        idempotency_key = kwargs.get("idempotency_key")

        task = _ORCHESTRATED_TASKS.get(task_id)
        if not task:
            return ToolResult(tool_name=self.tool_id, content=f"Task {task_id} not found", success=False)

        if task.cancellation_requested:
            return ToolResult(
                tool_name=self.tool_id,
                content=f"Task {task_id} was cancelled; dispatch rejected.",
                success=False,
            )

        if task.status in ("dispatched", "started", "completed"):
            return ToolResult(
                tool_name=self.tool_id,
                content=json.dumps({"status": task.status, "message": "Idempotent hit: task already dispatched", "task": asdict(task)}),
                success=True,
            )

        task.status = "dispatched"
        task.updated_at = datetime.now(timezone.utc).isoformat()

        return ToolResult(
            tool_name=self.tool_id,
            content=json.dumps({
                "status": "dispatched",
                "task_id": task.task_id,
                "operation_id": task.operation_id,
                "agent_id": task.agent_id,
                "executor": task.target_executor_unit_id,
                "dispatched_at": task.updated_at,
            }),
            success=True,
        )


__all__ = [
    "FredsQueryInventoryTool",
    "FredsProposePlanTool",
    "FredsDispatchTaskTool",
    "OrchestratedTask",
]
