import { create } from 'zustand';
import type { LucideIcon } from 'lucide-react';

/**
 * A dynamic command that the global CommandPalette can execute. Pages register
 * their own power-user flows here (e.g. opening a drawer or toggling a panel)
 * so they stay discoverable via Cmd/Ctrl+K even though the palette itself is
 * mounted once at the app root, outside the page tree.
 */
export interface CommandMenuAction {
  /** Stable unique id — registering the same id twice replaces it. */
  id: string;
  /** Label shown in the palette and used for fuzzy matching. */
  label: string;
  /** Extra search keywords beyond the label. */
  keywords?: string[];
  /** Optional icon; the palette falls back to a generic bolt icon. */
  icon?: LucideIcon;
  /** Invoked when the action is selected. */
  run: () => void;
}

interface CommandMenuState {
  actions: Record<string, CommandMenuAction>;
  registerAction: (action: CommandMenuAction) => () => void;
}

export const useCommandMenuStore = create<CommandMenuState>((set) => ({
  actions: {},
  registerAction: (action) => {
    set((state) => ({ actions: { ...state.actions, [action.id]: action } }));
    return () => {
      set((state) => {
        const next = { ...state.actions };
        delete next[action.id];
        return { actions: next };
      });
    };
  },
}));

