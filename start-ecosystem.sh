#!/usr/bin/env bash
# ==============================================================================
# Systentando Ecosystem & OpenJarvis Orchestrator Startup Script
# Inicia e gerencia:
#   1. OpenJarvis Backend API Server (Porta 8000)
#   2. OpenJarvis Frontend UI / Escritório dos Agentes (Porta 5173)
#   3. Code Assistant Friendly / Agentes Especialistas (Go Bot)
#   4. Atalhos rápidos para o "Oráculo" (Deep Research e Morning Digest)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
PID_DIR="$LOGS_DIR/pids"

mkdir -p "$LOGS_DIR" "$PID_DIR"

# Caminhos dos componentes
PYTHON_BIN="$SCRIPT_DIR/.venv/bin/python3"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
FRIENDLY_DIR="$WORKSPACE_ROOT/code-assistant-friendly"

# Cores para terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper para checar se porta está em uso
is_port_in_use() {
  local port="$1"
  lsof -i ":$port" >/dev/null 2>&1
}

# Helper para obter PID de uma porta
get_pid_on_port() {
  local port="$1"
  lsof -ti ":$port" | head -n 1 || true
}

# ------------------------------------------------------------------------------
# Funções de Inicialização
# ------------------------------------------------------------------------------

start_backend() {
  echo -e "${CYAN}▶ Iniciando OpenJarvis Backend (Porta 8000)...${NC}"
  if is_port_in_use 8000; then
    echo -e "  ${YELLOW}⚠ Porta 8000 já está em uso (PID: $(get_pid_on_port 8000)). Mantendo ativo.${NC}"
  else
    cd "$SCRIPT_DIR"
    nohup "$PYTHON_BIN" -m openjarvis.cli serve --host 127.0.0.1 --port 8000 > "$LOGS_DIR/backend.log" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_DIR/backend.pid"
    
    # Aguarda inicialização
    echo -n "  Aguardando backend responder"
    for i in {1..20}; do
      if curl -s http://127.0.0.1:8000/health | grep -q '"status":"ok"'; then
        echo -e " ${GREEN}✓ Conectado! (PID $pid)${NC}"
        return 0
      fi
      echo -n "."
      sleep 0.5
    done
    echo -e " ${RED}✗ Timeout ao iniciar backend. Verifique $LOGS_DIR/backend.log${NC}"
  fi
}

start_frontend() {
  echo -e "${CYAN}▶ Iniciando OpenJarvis Frontend (Porta 5173)...${NC}"
  if is_port_in_use 5173; then
    echo -e "  ${YELLOW}⚠ Porta 5173 já está em uso (PID: $(get_pid_on_port 5173)). Mantendo ativo.${NC}"
  else
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_DIR/frontend.pid"

    echo -n "  Aguardando frontend responder"
    for i in {1..20}; do
      if is_port_in_use 5173; then
        echo -e " ${GREEN}✓ Conectado! (PID $pid)${NC}"
        return 0
      fi
      echo -n "."
      sleep 0.5
    done
    echo -e " ${RED}✗ Timeout ao iniciar frontend. Verifique $LOGS_DIR/frontend.log${NC}"
  fi
}

start_friendly() {
  echo -e "${CYAN}▶ Verificando Assistente Local e Agentes Especialistas (Go)...${NC}"
  if pgrep -f "assistant-bot" >/dev/null 2>&1; then
    local pid
    pid=$(pgrep -f "assistant-bot" | head -n 1)
    echo -e "  ${GREEN}✓ Agentes locais já estão em execução (PID: $pid).${NC}"
  else
    if [ -d "$FRIENDLY_DIR" ]; then
      cd "$FRIENDLY_DIR"
      nohup env APP_ENV=production go run ./cmd/assistant-bot/ > "$LOGS_DIR/friendly.log" 2>&1 &
      local pid=$!
      echo "$pid" > "$PID_DIR/friendly.pid"
      echo -e "  ${GREEN}✓ Agentes especialistas iniciados em background (PID $pid).${NC}"
    else
      echo -e "  ${YELLOW}⚠ Diretório $FRIENDLY_DIR não encontrado. Pulando agentes Go.${NC}"
    fi
  fi
}

# ------------------------------------------------------------------------------
# Comandos Principais
# ------------------------------------------------------------------------------

start_all() {
  echo -e "${BLUE}================================================================${NC}"
  echo -e "${BLUE}      Iniciando Ecossistema Systentando + OpenJarvis Suite      ${NC}"
  echo -e "${BLUE}================================================================${NC}"
  
  start_backend
  start_frontend
  start_friendly

  echo ""
  echo -e "${GREEN}================================================================${NC}"
  echo -e "${GREEN}  ✓ Ecossistema pronto e operacional!${NC}"
  echo -e "${GREEN}================================================================${NC}"
  echo -e "  🏢 ${CYAN}Escritório dos Agentes:${NC} http://localhost:5173/office"
  echo -e "  💬 ${CYAN}Chat / Oráculo Visual:${NC}  http://localhost:5173/"
  echo -e "  🔌 ${CYAN}API Server Backend:${NC}     http://127.0.0.1:8000"
  echo -e "  📄 ${CYAN}Logs em:${NC}                $LOGS_DIR/"
  echo ""
  echo -e "  💡 Para abrir diretamente no navegador, execute:"
  echo -e "     ${YELLOW}open http://localhost:5173/office${NC}"
  echo -e "${GREEN}================================================================${NC}"
}

stop_all() {
  echo -e "${YELLOW}▶ Encerrando serviços do ecossistema...${NC}"
  
  # Parar frontend na porta 5173
  local f_pid
  f_pid=$(get_pid_on_port 5173)
  if [ -n "$f_pid" ]; then
    echo -e "  Encerrando Frontend (PID $f_pid)..."
    kill "$f_pid" 2>/dev/null || true
  fi

  # Parar backend na porta 8000
  local b_pid
  b_pid=$(get_pid_on_port 8000)
  if [ -n "$b_pid" ]; then
    echo -e "  Encerrando Backend (PID $b_pid)..."
    kill "$b_pid" 2>/dev/null || true
  fi

  # Parar Friendly bot se foi iniciado pelo script
  if [ -f "$PID_DIR/friendly.pid" ]; then
    local fr_pid
    fr_pid=$(cat "$PID_DIR/friendly.pid")
    if kill -0 "$fr_pid" 2>/dev/null; then
      echo -e "  Encerrando Agentes Friendly (PID $fr_pid)..."
      kill "$fr_pid" 2>/dev/null || true
    fi
    rm -f "$PID_DIR/friendly.pid"
  fi

  rm -f "$PID_DIR"/*.pid
  echo -e "${GREEN}✓ Serviços finalizados.${NC}"
}

status_all() {
  echo -e "${BLUE}=== Status do Ecossistema OpenJarvis & Systentando ===${NC}"
  
  if is_port_in_use 8000; then
    echo -e "  Backend (8000):   ${GREEN}● ONLINE${NC} (PID: $(get_pid_on_port 8000))"
  else
    echo -e "  Backend (8000):   ${RED}○ OFFLINE${NC}"
  fi

  if is_port_in_use 5173; then
    echo -e "  Frontend (5173):  ${GREEN}● ONLINE${NC} (PID: $(get_pid_on_port 5173))"
  else
    echo -e "  Frontend (5173):  ${RED}○ OFFLINE${NC}"
  fi

  if pgrep -f "assistant-bot" >/dev/null 2>&1; then
    local pid
    pid=$(pgrep -f "assistant-bot" | head -n 1)
    echo -e "  Friendly Agents:  ${GREEN}● ONLINE${NC} (PID: $pid)"
  else
    echo -e "  Friendly Agents:  ${RED}○ OFFLINE${NC}"
  fi
}

tail_logs() {
  local target="${1:-all}"
  case "$target" in
    backend)  tail -f "$LOGS_DIR/backend.log" ;;
    frontend) tail -f "$LOGS_DIR/frontend.log" ;;
    friendly) tail -f "$LOGS_DIR/friendly.log" ;;
    all|*)    tail -f "$LOGS_DIR"/*.log ;;
  esac
}

run_oracle() {
  local query="${1:-}"
  if [ -z "$query" ]; then
    echo -e "${YELLOW}Uso: $0 oraculo \"Sua pergunta de pesquisa aqui\"${NC}"
    echo -e "Iniciando modo interativo de Deep Research..."
    cd "$SCRIPT_DIR"
    "$PYTHON_BIN" -m openjarvis.cli research
  else
    echo -e "${CYAN}▶ Consultando o Oráculo de Pesquisa Profunda...${NC}"
    echo -e "${BLUE}Query: $query${NC}"
    cd "$SCRIPT_DIR"
    "$PYTHON_BIN" -m openjarvis.cli ask --research "$query"
  fi
}

run_digest() {
  echo -e "${CYAN}▶ Executando Oráculo Matinal (Morning Digest)...${NC}"
  cd "$SCRIPT_DIR"
  "$PYTHON_BIN" -m openjarvis.cli digest
}

# ------------------------------------------------------------------------------
# Dispatcher de Comandos
# ------------------------------------------------------------------------------

CMD="${1:-start}"

case "$CMD" in
  start|"")
    start_all
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    sleep 1
    start_all
    ;;
  status)
    status_all
    ;;
  logs)
    tail_logs "${2:-all}"
    ;;
  open)
    open http://localhost:5173/office
    ;;
  oraculo|oracle|research)
    shift
    run_oracle "$*"
    ;;
  digest)
    run_digest
    ;;
  help|--help|-h)
    echo -e "${CYAN}Gerenciador do Ecossistema OpenJarvis & Systentando${NC}"
    echo ""
    echo "Comandos disponíveis:"
    echo "  $0 start           - Inicia Backend, Frontend e Agentes (Padrão)"
    echo "  $0 stop            - Encerra todos os serviços em execução"
    echo "  $0 restart         - Reinicia todos os serviços"
    echo "  $0 status          - Exibe o status de portas e processos"
    echo "  $0 open            - Abre o Escritório no navegador padrão"
    echo "  $0 logs [alvo]     - Acompanha os logs (backend, frontend, friendly, all)"
    echo "  $0 oraculo [query] - Executa consulta com o Oráculo de Pesquisa Profunda"
    echo "  $0 digest          - Executa o briefing matinal (Morning Digest)"
    ;;
  *)
    echo -e "${RED}Comando desconhecido: $CMD${NC}"
    echo "Execute '$0 help' para instruções de uso."
    exit 1
    ;;
esac
