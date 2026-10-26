import pytest
from openjarvis.intelligence.multiprovider_policy import (
    MultiProviderPolicy,
    CandidateModel,
    SelectionMode,
    DataResidency,
)


def sample_candidates():
    return [
        CandidateModel(
            model_id="claude-3-7-sonnet",
            provider="anthropic",
            account_alias="team-main",
            context_capacity=200000,
            is_local=False,
            is_authenticated=True,
            estimated_cost_per_1k=0.015,
            success_rate=0.98,
            rework_rate=0.02,
            average_latency_ms=900,
            supports_tools=True,
        ),
        CandidateModel(
            model_id="qwen3:8b",
            provider="ollama",
            account_alias="local-device",
            context_capacity=32768,
            is_local=True,
            is_authenticated=True,
            estimated_cost_per_1k=0.0,
            success_rate=0.91,
            rework_rate=0.08,
            average_latency_ms=400,
            supports_tools=True,
        ),
        CandidateModel(
            model_id="unauth-model",
            provider="some-cloud",
            account_alias="unknown",
            context_capacity=128000,
            is_local=False,
            is_authenticated=False,
            estimated_cost_per_1k=0.001,
            supports_tools=True,
        ),
    ]


def test_automatic_selection_picks_best_candidate():
    policy = MultiProviderPolicy()
    decision = policy.evaluate_selection(
        mode=SelectionMode.AUTOMATIC,
        task_type="coding",
        prompt_tokens=2000,
        available_candidates=sample_candidates(),
    )
    assert decision.selected_model == "claude-3-7-sonnet"
    assert decision.selected_provider == "anthropic"
    assert decision.requires_approval is False
    assert decision.blocked_by_cancel is False
    assert len(decision.considered_alternatives) == 3


def test_local_only_data_residency_filters_cloud_models():
    policy = MultiProviderPolicy()
    decision = policy.evaluate_selection(
        mode=SelectionMode.AUTOMATIC,
        task_type="local_analysis",
        prompt_tokens=1000,
        data_residency=DataResidency.LOCAL_ONLY,
        available_candidates=sample_candidates(),
    )
    assert decision.selected_model == "qwen3:8b"
    assert decision.selected_provider == "ollama"
    cloud_eval = next(a for a in decision.considered_alternatives if a.model_id == "claude-3-7-sonnet")
    assert cloud_eval.passed_filters is False
    assert "local_only" in cloud_eval.disqualification_reason


def test_budget_exceeded_disqualifies():
    policy = MultiProviderPolicy()
    # 200k tokens at $0.015/1k = $3.00, exceeding $0.50 budget
    decision = policy.evaluate_selection(
        mode=SelectionMode.AUTOMATIC,
        task_type="batch_job",
        prompt_tokens=200000,
        budget_max_usd=0.50,
        available_candidates=sample_candidates(),
    )
    assert decision.selected_model == "none"
    assert decision.requires_approval is True


def test_cancelled_task_never_falls_back():
    policy = MultiProviderPolicy()
    decision = policy.evaluate_selection(
        mode=SelectionMode.AUTOMATIC,
        task_type="interrupted_job",
        prompt_tokens=1000,
        available_candidates=sample_candidates(),
        is_cancelled=True,
    )
    assert decision.blocked_by_cancel is True
    assert decision.selected_model == ""
    assert "cancelada" in decision.routing_reason.lower()


def test_recommended_mode_requires_approval():
    policy = MultiProviderPolicy()
    decision = policy.evaluate_selection(
        mode=SelectionMode.RECOMMENDED,
        task_type="refactor",
        prompt_tokens=1500,
        available_candidates=sample_candidates(),
    )
    assert decision.selected_model == "claude-3-7-sonnet"
    assert decision.requires_approval is True
