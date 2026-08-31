import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Trophy,
  BookOpen,
  Wallet,
  User,
  Droplets,
  Settings,
  Copy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useCommandMenuStore, type CommandMenuAction } from '../store/useCommandMenuStore';

interface RouteItem {
  kind: 'route';
  label: string;
  to: string;
  icon: LucideIcon;
}

interface ActionItem {
  kind: 'action';
  id: string;
  label: string;
  keywords?: string[];
  icon: LucideIcon;
  run: () => void;
}

type PaletteItem = RouteItem | ActionItem;

const routes: RouteItem[] = [
  { kind: 'route', label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { kind: 'route', label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
  { kind: 'route', label: 'Learn', to: '/learn', icon: BookOpen },
  { kind: 'route', label: 'Connect', to: '/connect', icon: Wallet },
  { kind: 'route', label: 'Profile', to: '/profile', icon: User },
  { kind: 'route', label: 'Pools', to: '/pools', icon: Droplets },
  { kind: 'route', label: 'Settings', to: '/settings', icon: Settings },
];

async function copyDashboardUrl() {
  const url = `${window.location.origin}/dashboard`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Clipboard API can be unavailable in non-secure contexts; fall back to a
    // textarea-based copy guarded against execCommand being removed.
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/** Always-available power-user actions, independent of the current page. */
const builtInActions: ActionItem[] = [
  {
    kind: 'action',
    id: 'copy-dashboard-url',
    label: 'Copy dashboard link',
    keywords: ['copy', 'share', 'url', 'link'],
    icon: Copy,
    run: () => void copyDashboardUrl(),
  },
];

/**
 * Simple fuzzy ranker shared by routes and actions. Returns a score (higher is
 * better) for exact, prefix, substring and subsequence matches, or `null` when
 * the query does not match the label or any of its keywords.
 */
function matchScore(query: string, label: string, keywords: string[] = []): number | null {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const candidates = [label, ...keywords].map((candidate) => candidate.toLowerCase());
  let best: number | null = null;
  for (const candidate of candidates) {
    if (candidate === q) {
      best = 100;
      break;
    }
    if (candidate.startsWith(q)) {
      best = Math.max(best ?? 0, 90 - candidate.length);
      continue;
    }
    const index = candidate.indexOf(q);
    if (index !== -1) {
      best = Math.max(best ?? 0, 70 - index);
      continue;
    }
    let queryIndex = 0;
    for (let i = 0; i < candidate.length && queryIndex < q.length; i += 1) {
      if (candidate[i] === q[queryIndex]) queryIndex += 1;
    }
    if (queryIndex === q.length) best = Math.max(best ?? 0, 40 + q.length);
  }
  return best;
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]';

const kbd = 'rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Store the actions map (stable reference) and derive the array in a memo so
  // the palette does not re-render in a loop on every zustand sniff.
  const actions = useCommandMenuStore((s) => s.actions);

  const items = useMemo(() => {
    const actionList: ActionItem[] = Object.values<CommandMenuAction>(actions).map((action) => ({
      kind: 'action',
      id: action.id,
      label: action.label,
      keywords: action.keywords,
      icon: action.icon ?? Zap,
      run: action.run,
    }));
    const all = [...routes, ...builtInActions, ...actionList];
    return all
      .map((item) => ({
        item,
        score: matchScore(query, item.label, item.kind === 'action' ? item.keywords : []),
      }))
      .filter((entry): entry is { item: PaletteItem; score: number } => entry.score !== null)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [query, actions]);

  const safeSelectedIndex = items.length === 0 ? 0 : Math.min(selectedIndex, items.length - 1);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  useFocusTrap(dialogRef, {
    active: isOpen,
    onEscape: close,
  });

  // Global Cmd/Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, open, close]);

  // Reset selected index when the query changes
  useEffect(() => {
    setSelectedIndex(0);
    const reset = window.setTimeout(() => setSelectedIndex(0), 0);
    return () => window.clearTimeout(reset);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen) return;
    const option = listRef.current?.querySelectorAll('[role="option"]');
    option?.[safeSelectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [safeSelectedIndex, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        setSelectedIndex((i) => (i + 1) % items.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[safeSelectedIndex];
      if (item) {
        handleSelect(item);
      }
    }
  };

  const handleSelect = (item: PaletteItem) => {
    if (item.kind === 'route') {
      navigate(item.to);
    } else {
      item.run();
    }
    close();
  };

  return (
    <>
      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Palette */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className={clsx(
              'relative w-full max-w-md rounded-xl border border-[#BEC7FE]/15 bg-[#111827] shadow-2xl',
              'animate-in fade-in zoom-in-95 duration-150',
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="w-5 h-5 text-gray-500 shrink-0" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Jump to…"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls="command-palette-listbox"
                aria-activedescendant={
                  items[safeSelectedIndex] ? `command-palette-option-${safeSelectedIndex}` : undefined
                }
              />
              <kbd className={`hidden sm:inline-block ${kbd} text-gray-500`}>ESC</kbd>
            </div>

            {/* Command list */}
            <div
              id="command-palette-listbox"
              ref={listRef}
              role="listbox"
              aria-label="Commands"
              className="max-h-64 overflow-y-auto p-1.5"
            >
              {items.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  No routes or actions match "{query}"
                </p>
              )}
              {items.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === safeSelectedIndex;
                const isCurrent = item.kind === 'route' && location.pathname === item.to;
                return (
                  <button
                    key={item.kind === 'route' ? item.to : `action-${item.id}`}
                    id={`command-palette-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-[#2C4BFD]/20 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white',
                      isCurrent && 'ring-1 ring-[#2C4BFD]/30',
                      focusRing,
                    )}
                  >
                    <Icon className={clsx('w-4 h-4 shrink-0', isSelected ? 'text-[#BEC7FE]' : 'text-gray-500')} aria-hidden />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.kind === 'route' && isCurrent && (
                      <span className="rounded-full bg-[#2C4BFD]/20 px-2 py-0.5 text-[10px] font-semibold text-[#BEC7FE]">
                        current
                      </span>
                    )}
                    {item.kind === 'action' && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                        action
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2">
              <span className="text-[10px] text-gray-500">
                <kbd className={kbd}>↑↓</kbd> navigate
                {' '}
                <kbd className={kbd}>↵</kbd> select
                {' '}
                <kbd className={kbd}>Esc</kbd> close
                {' '}
                <kbd className={kbd}>Ctrl K</kbd> toggle
              </span>
              <span className="hidden text-[10px] text-gray-600 sm:inline">
                {items.length} {items.length === 1 ? 'command' : 'commands'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}