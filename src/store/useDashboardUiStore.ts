import { create } from 'zustand';

/**
 * Shared Dashboard UI toggles (community chat, on-chain event log).
 *
 * These previously lived as local `useState` inside `Dashboard`, but the
 * global `CommandPalette` (mounted once in `App.tsx`, outside any page) needs
 * to trigger them too — e.g. "Toggle chat" / "Open event log" quick actions.
 * Pulling them into a small unpersisted store keeps Dashboard and
 * CommandPalette in sync without prop-drilling or a context provider.
 */
interface DashboardUiState {
  isChatOpen: boolean;
  isEventLogOpen: boolean;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  setEventLogOpen: (open: boolean) => void;
  openEventLog: () => void;
}

export const useDashboardUiStore = create<DashboardUiState>()((set) => ({
  isChatOpen: false,
  isEventLogOpen: false,
  setChatOpen: (open) => set({ isChatOpen: open }),
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  setEventLogOpen: (open) => set({ isEventLogOpen: open }),
  openEventLog: () => set({ isEventLogOpen: true }),
}));

export const selectIsChatOpen = (s: DashboardUiState) => s.isChatOpen;
export const selectIsEventLogOpen = (s: DashboardUiState) => s.isEventLogOpen;
