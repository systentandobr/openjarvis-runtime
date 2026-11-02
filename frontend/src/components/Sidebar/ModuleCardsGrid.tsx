import { useNavigate, useLocation } from 'react-router';
import {
  TrendingUp,
  Building2,
  Clapperboard,
  FileText,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { NATIVE_MODULES, type NativeModuleId } from '../../types/modules';

const ICONS = {
  TrendingUp,
  Building2,
  Clapperboard,
  FileText,
};

export function ModuleCardsGrid() {
  const navigate = useNavigate();
  const location = useLocation();

  const modules = Object.values(NATIVE_MODULES);

  return (
    <div className="flex flex-col gap-1.5 px-3 mb-3">
      <div className="flex items-center justify-between px-1">
        <span
          className="text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Boxes size={12} style={{ color: 'var(--color-accent)' }} />
          Módulos Nativos MCP
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
          style={{
            background: 'var(--color-accent-subtle)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-border)',
          }}
        >
          4 ativos
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {modules.map((mod) => {
          const Icon = ICONS[mod.iconName] || Boxes;
          const isActive = location.pathname.startsWith(mod.route);

          return (
            <button
              key={mod.id}
              onClick={() => navigate(mod.route)}
              className="group relative flex flex-col p-2 rounded-xl text-left transition-all duration-200 cursor-pointer overflow-hidden border"
              style={{
                background: isActive
                  ? 'var(--color-bg-tertiary)'
                  : 'var(--color-bg-secondary)',
                borderColor: isActive
                  ? mod.accentColor
                  : 'var(--color-border)',
                boxShadow: isActive ? `0 0 12px ${mod.accentGlow}` : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = mod.accentColor;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${mod.accentGlow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              title={`${mod.title} — ${mod.tagline}`}
            >
              {/* Subtle top indicator bar if active */}
              {isActive && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: mod.accentColor }}
                />
              )}

              <div className="flex items-center justify-between w-full mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: mod.accentGlow,
                    color: mod.accentColor,
                  }}
                >
                  <Icon size={13} />
                </div>
                <span
                  className="text-[9px] font-mono opacity-80"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {mod.agentAvatar}
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold truncate"
                    style={{
                      color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {mod.shortName}
                  </span>
                  <ChevronRight
                    size={11}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: mod.accentColor }}
                  />
                </div>
                <span
                  className="text-[9px] truncate mt-0.5"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {mod.badgeText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
