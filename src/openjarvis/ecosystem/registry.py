"""Registry canônico de correlação (F360-02) — espelho de ecosystem-registry.ts.

IDs estáveis; nunca unir por label aproximado. agentId desconhecido fica
em 'Não mapeadas' no frontend — não é descartado nem aproximado aqui.
"""

# serviceId → (label, repoId|None, orbit group)
SERVICES: dict[str, dict] = {
    "freds-core": {"label": "Freds Core", "repo": "backend-monorepo", "orbit": "execution"},
    "friendly": {"label": "Friendly (Claw)", "repo": "code-assistant-friendly", "orbit": "execution"},
    "openjarvis": {"label": "OpenJarvis", "repo": "openjarvis-runtime", "orbit": "infra"},
    "gateway": {"label": "Freds Gateway", "repo": "freds-gateway", "orbit": "infra"},
    "sessions": {"label": "DevMode Sessions", "repo": "devmode-sessions", "orbit": "infra"},
    "sentinel": {"label": "Sentinel", "repo": "architecture-guides", "orbit": "infra"},
    "gestor": {"label": "Meu Gestor", "repo": "meu-sistema-gestor", "orbit": "domain"},
    "dorama": {"label": "Dorama Studio", "repo": "drama-platform", "orbit": "domain"},
}

# agentId canônico (ou slug '{unit}:{slug}') → serviceId
AGENT_SERVICES: dict[str, str] = {
    "agno-chatbot": "freds-core",
    "atendimento": "freds-core",
    "chatbot": "freds-core",
    "orchestrator": "freds-core",
    "deepagent": "freds-core",
    "dev": "friendly",
    "developer": "friendly",
    "frontend-dev": "friendly",
    "backend-dev": "friendly",
    "claw": "friendly",
    "qa": "friendly",
    "tester": "friendly",
    "reviewer": "friendly",
    "code-reviewer": "friendly",
    "test-writer": "friendly",
    "architect": "friendly",
    "ux": "friendly",
    "manager": "friendly",
    "sales-specialist": "friendly",
}

# repoId (Graphify) → serviceId, para mapear findings de auditoria
REPO_SERVICES: dict[str, str] = {v["repo"]: k for k, v in SERVICES.items() if v["repo"]}


def service_for_agent(agent_id: str) -> str | None:
    slug = agent_id.split(":", 1)[-1] if ":" in agent_id else agent_id
    return AGENT_SERVICES.get(slug) or AGENT_SERVICES.get(agent_id)


def service_for_repo(repo_id: str) -> str | None:
    return REPO_SERVICES.get(repo_id)
