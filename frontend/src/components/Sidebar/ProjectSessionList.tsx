import { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAppStore, DEFAULT_PROJECT_ID } from '../../lib/store';
import type { Project, Conversation } from '../../types';

interface Props {
  searchQuery: string;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(timestamp).toLocaleDateString();
}

export function ProjectSessionList({ searchQuery }: Props) {
  const navigate = useNavigate();

  // Store state
  const projects = useAppStore((s) => s.projects);
  const conversations = useAppStore((s) => s.conversations);
  const activeId = useAppStore((s) => s.activeId);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const streamingConversationId = useAppStore((s) =>
    s.streamState.isStreaming ? s.streamState.conversationId : null,
  );

  // Store actions
  const selectConversation = useAppStore((s) => s.selectConversation);
  const createConversation = useAppStore((s) => s.createConversation);
  const renameConversation = useAppStore((s) => s.renameConversation);
  const deleteConversation = useAppStore((s) => s.deleteConversation);
  const createProject = useAppStore((s) => s.createProject);
  const renameProject = useAppStore((s) => s.renameProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const toggleProjectCollapse = useAppStore((s) => s.toggleProjectCollapse);
  const setActiveProjectId = useAppStore((s) => s.setActiveProjectId);

  // Local UI state for inline editing
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState('');

  const newProjectInputRef = useRef<HTMLInputElement>(null);
  const editProjectInputRef = useRef<HTMLInputElement>(null);
  const editSessionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingProject) {
      newProjectInputRef.current?.focus();
    }
  }, [isCreatingProject]);

  useEffect(() => {
    if (editingProjectId) {
      editProjectInputRef.current?.focus();
    }
  }, [editingProjectId]);

  useEffect(() => {
    if (editingSessionId) {
      editSessionInputRef.current?.focus();
    }
  }, [editingSessionId]);

  // Group conversations by project
  const convsByProject = conversations.reduce<Record<string, Conversation[]>>(
    (acc, conv) => {
      const pid = conv.projectId || DEFAULT_PROJECT_ID;
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(conv);
      return acc;
    },
    {},
  );

  // Filter projects & conversations based on search
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = project.name.toLowerCase().includes(query);
    const sessions = convsByProject[project.id] || [];
    const hasMatchingSession = sessions.some((c) =>
      c.title.toLowerCase().includes(query),
    );
    return nameMatch || hasMatchingSession;
  });

  const handleCreateProjectSubmit = () => {
    const trimmed = newProjectName.trim();
    if (trimmed) {
      const newId = createProject(trimmed);
      createConversation(selectedModel, newId);
      navigate('/');
    }
    setNewProjectName('');
    setIsCreatingProject(false);
  };

  const handleRenameProjectSubmit = (projectId: string) => {
    const trimmed = editingProjectName.trim();
    if (trimmed) {
      renameProject(projectId, trimmed);
    }
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleRenameSessionSubmit = (sessionId: string) => {
    const trimmed = editingSessionTitle.trim();
    if (trimmed) {
      renameConversation(sessionId, trimmed);
    }
    setEditingSessionId(null);
    setEditingSessionTitle('');
  };

  const handleNewSessionInProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setActiveProjectId(projectId);
    createConversation(selectedModel, projectId);
    navigate('/');
  };

  return (
    <div className="flex flex-col gap-1 py-1">
      {/* Header with New Project trigger */}
      <div className="flex items-center justify-between px-2 mb-1.5">
        <span
          className="text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Folder size={12} style={{ color: 'var(--color-accent)' }} />
          Projetos & Sessões
        </span>
        <button
          onClick={() => {
            setIsCreatingProject(true);
            setNewProjectName('');
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent)';
            e.currentTarget.style.borderColor = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
          title="Criar novo projeto com sessões agrupadas"
        >
          <Plus size={11} />
          <span>Projeto</span>
        </button>
      </div>

      {/* Inline Create Project Form */}
      {isCreatingProject && (
        <div
          className="mx-2 mb-2 p-2 rounded-lg border flex items-center gap-1.5 shadow-sm"
          style={{
            background: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-accent)',
          }}
        >
          <Folder size={14} style={{ color: 'var(--color-accent)' }} />
          <input
            ref={newProjectInputRef}
            type="text"
            placeholder="Nome do projeto..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateProjectSubmit();
              if (e.key === 'Escape') setIsCreatingProject(false);
            }}
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--color-text)' }}
          />
          <button
            onClick={handleCreateProjectSubmit}
            className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
            title="Salvar projeto"
          >
            <Check size={13} />
          </button>
          <button
            onClick={() => setIsCreatingProject(false)}
            className="p-1 rounded text-zinc-400 hover:bg-zinc-500/10 cursor-pointer"
            title="Cancelar"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div
          className="px-3 py-6 text-center text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado'}
        </div>
      ) : (
        filteredProjects.map((project) => {
          const projectSessions = convsByProject[project.id] || [];
          const isCollapsed = project.isCollapsed ?? false;
          const isProjectActive =
            activeProjectId === project.id ||
            projectSessions.some((s) => s.id === activeId);

          const displayedSessions = searchQuery
            ? projectSessions.filter((c) =>
                c.title.toLowerCase().includes(searchQuery.toLowerCase()),
              )
            : projectSessions;

          return (
            <div
              key={project.id}
              className="group/project flex flex-col rounded-lg transition-colors overflow-hidden"
              style={{
                background: isProjectActive
                  ? 'color-mix(in srgb, var(--color-bg-secondary) 50%, transparent)'
                  : 'transparent',
              }}
            >
              {/* Project Header Row */}
              <div
                onClick={() => toggleProjectCollapse(project.id)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-bg-secondary)]"
              >
                {/* Chevron */}
                <button
                  type="button"
                  className="p-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-transform cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight size={13} />
                  ) : (
                    <ChevronDown size={13} />
                  )}
                </button>

                {/* Folder Icon */}
                {isCollapsed ? (
                  <Folder
                    size={14}
                    style={{ color: project.color || 'var(--color-accent)' }}
                  />
                ) : (
                  <FolderOpen
                    size={14}
                    style={{ color: project.color || 'var(--color-accent)' }}
                  />
                )}

                {/* Project Title or Inline Rename */}
                {editingProjectId === project.id ? (
                  <div
                    className="flex-1 flex items-center gap-1 min-w-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={editProjectInputRef}
                      type="text"
                      value={editingProjectName}
                      onChange={(e) => setEditingProjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          handleRenameProjectSubmit(project.id);
                        if (e.key === 'Escape') setEditingProjectId(null);
                      }}
                      className="flex-1 px-1.5 py-0.5 text-xs rounded bg-[var(--color-bg-tertiary)] border border-[var(--color-accent)] outline-none"
                      style={{ color: 'var(--color-text)' }}
                    />
                    <button
                      onClick={() => handleRenameProjectSubmit(project.id)}
                      className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => setEditingProjectId(null)}
                      className="p-1 rounded text-zinc-400 hover:bg-zinc-500/10 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span
                      className="text-xs font-medium truncate"
                      style={{
                        color: isProjectActive
                          ? 'var(--color-text)'
                          : 'var(--color-text-secondary)',
                      }}
                      title={project.name}
                    >
                      {project.name}
                    </span>

                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded-full font-mono ml-1"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {projectSessions.length}
                    </span>
                  </div>
                )}

                {/* Direct Action Buttons without 3-dots menu! */}
                {editingProjectId !== project.id && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/project:opacity-100 transition-opacity">
                    {/* + Nova Session in this Project */}
                    <button
                      onClick={(e) => handleNewSessionInProject(e, project.id)}
                      className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="Nova sessão neste projeto (1-clique)"
                    >
                      <Plus size={13} />
                    </button>

                    {/* Edit Project Name */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProjectId(project.id);
                        setEditingProjectName(project.name);
                      }}
                      className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title="Renomear projeto"
                    >
                      <Edit2 size={12} />
                    </button>

                    {/* Delete Project (if not default) */}
                    {project.id !== DEFAULT_PROJECT_ID && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Excluir o projeto "${project.name}"? As sessões serão movidas para Geral.`,
                            )
                          ) {
                            deleteProject(project.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer text-zinc-400 hover:text-red-400"
                        title="Excluir projeto"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Collapsed/Expanded Sessions Content */}
              {!isCollapsed && (
                <div className="flex flex-col gap-0.5 pl-5 pr-1 py-1 border-l border-white/5 ml-3 my-0.5">
                  {displayedSessions.length === 0 ? (
                    <div
                      className="px-2 py-2 text-[11px] italic"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      Nenhuma sessão vinculada.{' '}
                      <button
                        onClick={(e) => handleNewSessionInProject(e, project.id)}
                        className="underline hover:text-[var(--color-accent)] cursor-pointer"
                      >
                        + Criar agora
                      </button>
                    </div>
                  ) : (
                    displayedSessions.map((conv) => {
                      const isActive = conv.id === activeId;
                      const isStreaming = conv.id === streamingConversationId;

                      return (
                        <div
                          key={conv.id}
                          className="group/session relative flex items-center rounded-md cursor-pointer transition-colors"
                          style={{
                            background: isActive
                              ? 'var(--color-bg-tertiary)'
                              : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive)
                              e.currentTarget.style.background =
                                'var(--color-bg-secondary)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive)
                              e.currentTarget.style.background =
                                'transparent';
                          }}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <span
                              className="absolute left-0 top-1 bottom-1 w-[2px] rounded-full"
                              style={{
                                background:
                                  project.color || 'var(--color-accent)',
                                boxShadow: `0 0 6px ${project.color || 'var(--color-accent)'}`,
                              }}
                            />
                          )}

                          {editingSessionId === conv.id ? (
                            <div className="flex-1 flex items-center gap-1 p-1 min-w-0">
                              <input
                                ref={editSessionInputRef}
                                type="text"
                                value={editingSessionTitle}
                                onChange={(e) =>
                                  setEditingSessionTitle(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter')
                                    handleRenameSessionSubmit(conv.id);
                                  if (e.key === 'Escape')
                                    setEditingSessionId(null);
                                }}
                                className="flex-1 px-1.5 py-0.5 text-xs rounded bg-[var(--color-bg-secondary)] border border-[var(--color-accent)] outline-none"
                                style={{ color: 'var(--color-text)' }}
                              />
                              <button
                                onClick={() =>
                                  handleRenameSessionSubmit(conv.id)
                                }
                                className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                onClick={() => setEditingSessionId(null)}
                                className="p-1 rounded text-zinc-400 hover:bg-zinc-500/10 cursor-pointer"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveProjectId(project.id);
                                selectConversation(conv.id);
                                navigate('/');
                              }}
                              className="flex-1 text-left px-2 py-1.5 min-w-0 cursor-pointer flex flex-col"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MessageSquare
                                  size={12}
                                  className="shrink-0"
                                  style={{
                                    color: isActive
                                      ? 'var(--color-accent)'
                                      : 'var(--color-text-tertiary)',
                                  }}
                                />
                                <span
                                  className="text-xs truncate flex-1"
                                  style={{
                                    color: isActive
                                      ? 'var(--color-text)'
                                      : 'var(--color-text-secondary)',
                                    fontWeight: isActive ? 500 : 400,
                                  }}
                                  title={conv.title}
                                >
                                  {conv.title}
                                </span>
                              </div>
                              <span
                                className="text-[10px] pl-4 mt-0.5"
                                style={{ color: 'var(--color-text-tertiary)' }}
                              >
                                {formatRelativeTime(conv.updatedAt)}
                              </span>
                            </button>
                          )}

                          {/* Session Actions: Direct Rename and Delete on hover! */}
                          {editingSessionId !== conv.id && (
                            <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover/session:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(conv.id);
                                  setEditingSessionTitle(conv.title);
                                }}
                                className="p-1 rounded hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer text-zinc-400 hover:text-zinc-200"
                                title="Renomear sessão"
                              >
                                <Edit2 size={11} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conv.id);
                                }}
                                disabled={isStreaming}
                                className="p-1 rounded hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer text-zinc-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  isStreaming
                                    ? 'Aguarde a finalização do stream'
                                    : 'Excluir sessão'
                                }
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
