import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, LayoutDashboard, Trophy, BookOpen, Wallet, User, Droplets, Settings, Link2, Radio } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Dispatched on `window` to ask the Dashboard to open its on-chain event
 * log drawer. The palette is mounted at the app root, outside the Dashboard
 * tree, so it cannot flip the drawer's local state directly. The Dashboard
 * listens for this event and opens the drawer when it fires.
 */
export const OPEN_EVENT_LOG_EVENT = 'xelma:open-event-log';

interface RouteItem {
  kind: 'route';
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ActionItem {
  kind: 'action';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

type PaletteItem = RouteItem | ActionItem;

const routes: Omit<RouteItem, 'kind'>[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
  { label: 'Learn', to: '/learn', icon: BookOpen },
  { label: 'Connect', to: '/connect', icon: Wallet },
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Pools', to: '/pools', icon: Droplets },
  { label: 'Settings', to: '/settings', icon: Settings },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

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

  const handleCopyPageUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard', { id: 'copy-page-url' });
    } catch {
      toast.error('Could not copy link', { id: 'copy-page-url' });
    }
  }, []);

  const handleOpenEventLog = useCallback(() => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
    // Dispatch after a tick so the Dashboard has mounted and registered its
    // listener when we navigated here from another page.
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(OPEN_EVENT_LOG_EVENT));
    }, 0);
  }, [location.pathname, navigate]);

  const items: PaletteItem[] = [
    ...routes.map((r) => ({ ...r, kind: 'route' as const })),
    { kind: 'action' as const, label: 'Copy page URL', icon: Link2, run: handleCopyPageUrl },
    { kind: 'action' as const, label: 'Open event log', icon: Radio, run: handleOpenEventLog },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );
  const safeSelectedIndex = filtered.length === 0 ? 0 : Math.min(selectedIndex, filtered.length - 1);
  const filteredRoutes = filtered.filter((item): item is RouteItem => item.kind === 'route');
  const filteredActions = filtered.filter((item): item is ActionItem => item.kind === 'action');

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

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
    const reset = window.setTimeout(() => setSelectedIndex(0), 0);
    return () => window.clearTimeout(reset);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen) return;
    const items = listRef.current?.querySelectorAll('[role="option"]');
    items?.[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelect = (item: PaletteItem) => {
    if (item.kind === 'route') {
      navigate(item.to);
    } else {
      item.run();
    }
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length > 0) {
        setSelectedIndex((i) => (i + 1) % filtered.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length > 0) {
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[safeSelectedIndex]) {
        handleSelect(filtered[safeSelectedIndex]);
      }
    }
  };

  const renderGroup = (groupLabel: string, groupItems: PaletteItem[]) => {
    if (groupItems.length === 0) return null;
    return (
      <div key={groupLabel} role="group" aria-label={groupLabel}>
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {groupLabel}
        </p>
        {groupItems.map((item) => {
          const index = filtered.indexOf(item);
          const Icon = item.icon;
          const isSelected = index === safeSelectedIndex;
          const isCurrent = item.kind === 'route' && location.pathname === item.to;
          return (
            <button
              key={item.kind === 'route' ? item.to : item.label}
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
              {isCurrent && (
                <span className="rounded-full bg-[#2C4BFD]/20 px-2 py-0.5 text-[10px] font-semibold text-[#BEC7FE]">
                  current
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
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
                  filtered[safeSelectedIndex] ? `command-palette-option-${safeSelectedIndex}` : undefined
                }
              />
              <kbd className="hidden sm:inline-block rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                ESC
              </kbd>
            </div>

            {/* Item list */}
            <div
              id="command-palette-listbox"
              ref={listRef}
              role="listbox"
              aria-label="Commands"
              className="max-h-64 overflow-y-auto p-1.5"
            >
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  No results match "{query}"
                </p>
              )}
              {renderGroup('Routes', filteredRoutes)}
              {renderGroup('Quick actions', filteredActions)}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2">
              <span className="text-[10px] text-gray-500">
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]">↑↓</kbd> navigate
                {' '}
                <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px]">↵</kbd> select
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
