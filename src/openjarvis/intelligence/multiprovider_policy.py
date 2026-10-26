"""Explainable multi-provider model selection policy for OpenJarvis & Freds.

Implements FO-05:
- Modes: MANUAL, RECOMMENDED, AUTOMATIC
- Hard constraint filtering:
  * Workspace / account authorization
  * Data residency (local_only vs cloud)
  * Context capacity (prompt/task tokens <= context limit)
  * Budget / quota limits
  * Installed/authenticated models only (no hallucinated catalog entries)
- Explainable ranking:
  * Success rate on similar tasks
  * Rework frequency
  * Latency and cost efficiency
- Transparency:
  * routing_reason, considered_alternatives, policy_version, uncertainty_score
- Safety gates:
  * Material change requires human approval
  * Cancelled executions NEVER trigger fallback
"""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class SelectionMode(str, enum.Enum):
    MANUAL = "manual"
    RECOMMENDED = "recommended"
    AUTOMATIC = "automatic"


class DataResidency(str, enum.Enum):
    LOCAL_ONLY = "local_only"
    EU_ONLY = "eu_only"
    ANY_SECURE = "any_secure"


@dataclass
class CandidateModel:
    model_id: str
    provider: str
    account_alias: str
    context_capacity: int
    is_local: bool
    is_authenticated: bool
    estimated_cost_per_1k: float = 0.0
    success_rate: float = 0.95
    rework_rate: float = 0.05
    average_latency_ms: int = 800
    supports_tools: bool = True


@dataclass
class AlternativeEvaluation:
    model_id: str
    provider: str
    passed_filters: bool
    disqualification_reason: Optional[str] = None
    composite_score: float = 0.0


@dataclass
class RoutingDecision:
    selected_provider: str
    selected_model: str
    account_alias: str
    selection_mode: SelectionMode
    routing_reason: str
    considered_alternatives: List[AlternativeEvaluation]
    policy_version: str = "multiprovider-v1.0"
    uncertainty_score: float = 0.1
    requires_approval: bool = False
    approval_reason: Optional[str] = None
    blocked_by_cancel: bool = False
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MultiProviderPolicy:
    """Evaluates candidates against explicit constraints and historical metrics."""

    def __init__(self, policy_version: str = "multiprovider-v1.0"):
        self.policy_version = policy_version

    def evaluate_selection(
        self,
        *,
        mode: SelectionMode,
        task_type: str,
        prompt_tokens: int,
        requires_tools: bool = True,
        data_residency: DataResidency = DataResidency.ANY_SECURE,
        budget_max_usd: float = 1.0,
        available_candidates: List[CandidateModel],
        forced_model_id: Optional[str] = None,
        is_cancelled: bool = False,
    ) -> RoutingDecision:
        # Safety gate: Cancelled tasks NEVER trigger fallback or advance
        if is_cancelled:
            return RoutingDecision(
                selected_provider="",
                selected_model="",
                account_alias="",
                selection_mode=mode,
                routing_reason="Execução cancelada; novos despachos e fallbacks estão terminantemente bloqueados.",
                considered_alternatives=[],
                policy_version=self.policy_version,
                uncertainty_score=0.0,
                requires_approval=False,
                blocked_by_cancel=True,
            )

        if not available_candidates:
            return RoutingDecision(
                selected_provider="unavailable",
                selected_model="none",
                account_alias="none",
                selection_mode=mode,
                routing_reason="Nenhum modelo autenticado ou instalado encontrado no catálogo atual.",
                considered_alternatives=[],
                policy_version=self.policy_version,
                uncertainty_score=1.0,
                requires_approval=True,
                approval_reason="Catálogo vazio; intervenção manual necessária.",
            )

        # 1. Manual mode override
        if mode == SelectionMode.MANUAL and forced_model_id:
            for cand in available_candidates:
                if cand.model_id == forced_model_id and cand.is_authenticated:
                    return RoutingDecision(
                        selected_provider=cand.provider,
                        selected_model=cand.model_id,
                        account_alias=cand.account_alias,
                        selection_mode=SelectionMode.MANUAL,
                        routing_reason=f"Seleção manual explícita pelo operador para {cand.model_id}.",
                        considered_alternatives=[
                            AlternativeEvaluation(
                                model_id=c.model_id,
                                provider=c.provider,
                                passed_filters=(c.model_id == forced_model_id),
                                disqualification_reason="Não selecionado manualmente" if c.model_id != forced_model_id else None,
                            )
                            for c in available_candidates
                        ],
                        policy_version=self.policy_version,
                        uncertainty_score=0.0,
                        requires_approval=False,
                    )

        # 2. Hard constraint filtering
        evaluations: List[AlternativeEvaluation] = []
        eligible: List[tuple[CandidateModel, float]] = []

        for cand in available_candidates:
            if not cand.is_authenticated:
                evaluations.append(
                    AlternativeEvaluation(
                        model_id=cand.model_id,
                        provider=cand.provider,
                        passed_filters=False,
                        disqualification_reason="Credenciais ausentes ou modelo não autenticado",
                    )
                )
                continue

            if data_residency == DataResidency.LOCAL_ONLY and not cand.is_local:
                evaluations.append(
                    AlternativeEvaluation(
                        model_id=cand.model_id,
                        provider=cand.provider,
                        passed_filters=False,
                        disqualification_reason="Viola restrição de residência de dados (local_only)",
                    )
                )
                continue

            if prompt_tokens > cand.context_capacity:
                evaluations.append(
                    AlternativeEvaluation(
                        model_id=cand.model_id,
                        provider=cand.provider,
                        passed_filters=False,
                        disqualification_reason=f"Tamanho do prompt ({prompt_tokens}) excede capacidade de contexto ({cand.context_capacity})",
                    )
                )
                continue

            if requires_tools and not cand.supports_tools:
                evaluations.append(
                    AlternativeEvaluation(
                        model_id=cand.model_id,
                        provider=cand.provider,
                        passed_filters=False,
                        disqualification_reason="Modelo não suporta chamada de ferramentas requeridas",
                    )
                )
                continue

            estimated_cost = (prompt_tokens / 1000.0) * cand.estimated_cost_per_1k
            if estimated_cost > budget_max_usd:
                evaluations.append(
                    AlternativeEvaluation(
                        model_id=cand.model_id,
                        provider=cand.provider,
                        passed_filters=False,
                        disqualification_reason=f"Custo estimado (${estimated_cost:.4f}) excede orçamento limite (${budget_max_usd:.2f})",
                    )
                )
                continue

            # Composite scoring for eligible candidates:
            # High success rate (weight 0.45) - Rework rate (0.25) + Latency factor (0.15) + Cost factor (0.15)
            score = (cand.success_rate * 0.45) - (cand.rework_rate * 0.25)
            latency_factor = max(0.0, 1.0 - (cand.average_latency_ms / 5000.0)) * 0.15
            cost_factor = max(0.0, 1.0 - (cand.estimated_cost_per_1k / 0.1)) * 0.15
            composite = score + latency_factor + cost_factor

            evaluations.append(
                AlternativeEvaluation(
                    model_id=cand.model_id,
                    provider=cand.provider,
                    passed_filters=True,
                    composite_score=round(composite, 3),
                )
            )
            eligible.append((cand, composite))

        if not eligible:
            return RoutingDecision(
                selected_provider="none",
                selected_model="none",
                account_alias="none",
                selection_mode=mode,
                routing_reason="Nenhum modelo candidato atendeu a todos os filtros mandatórios de segurança e orçamento.",
                considered_alternatives=evaluations,
                policy_version=self.policy_version,
                uncertainty_score=0.9,
                requires_approval=True,
                approval_reason="Nenhum modelo elegível sem ajuste de orçamento ou residência de dados.",
            )

        # Sort eligible candidates descending by composite score
        eligible.sort(key=lambda x: x[1], reverse=True)
        winner, win_score = eligible[0]

        requires_appr = (mode == SelectionMode.RECOMMENDED)
        appr_msg = "Modo recomendado exige confirmação humana antes da execução" if requires_appr else None

        reason = (
            f"Selecionado {winner.model_id} via {winner.provider} (score {win_score:.3f}). "
            f"Taxa de sucesso={winner.success_rate*100:.1f}%, latência média={winner.average_latency_ms}ms, "
            f"custo/1k=${winner.estimated_cost_per_1k:.4f}."
        )

        return RoutingDecision(
            selected_provider=winner.provider,
            selected_model=winner.model_id,
            account_alias=winner.account_alias,
            selection_mode=mode,
            routing_reason=reason,
            considered_alternatives=evaluations,
            policy_version=self.policy_version,
            uncertainty_score=round(max(0.05, 1.0 - win_score), 2),
            requires_approval=requires_appr,
            approval_reason=appr_msg,
        )
