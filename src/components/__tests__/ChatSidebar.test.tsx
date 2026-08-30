import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatSidebar } from '../ChatSidebar';
import { socketService } from '../../lib/socket';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { useRoundStore } from '../../store/useRoundStore';
import type { Round } from '../../lib/api-client';

vi.mock('../../lib/socket', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinChat: vi.fn(),
    leaveChat: vi.fn(),
    onChatMessage: vi.fn(() => () => {}),
    sendChat: vi.fn(),
    isConnected: vi.fn(() => true),
  },
}));

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(() => ({
    status: 'connected',
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: false,
  })),
}));

// Drive a Zustand state change through React's commit + effect flush using
// the async form of `act` so React 19 does not log "An update to ChatSidebar
// inside a test was not wrapped in act(...)" warnings.
async function setActiveRound(round: Round | null) {
  await act(async () => {
    useRoundStore.setState({ activeRound: round });
  });
}

describe('ChatSidebar — round-scoped chat channel (#185)', () => {
  const initialActiveRound = useRoundStore.getState().activeRound;

  beforeEach(() => {
    vi.clearAllMocks();
    (socketService.onChatMessage as ReturnType<typeof vi.fn>).mockReturnValue(() => {});
    useRoundStore.setState({ activeRound: null });
  });

  afterEach(() => {
    useRoundStore.setState({ activeRound: initialActiveRound });
  });

  it('joins the fallback "general" channel when there is no active round', () => {
    render(<ChatSidebar />);

    expect(socketService.connect).toHaveBeenCalled();
    expect(socketService.joinChat).toHaveBeenCalledWith('general');
    expect(socketService.leaveChat).not.toHaveBeenCalled();
  });

  it('joins "round:<id>" when an active round with a numeric id is set', async () => {
    await setActiveRound({ id: 42 } as Round);

    render(<ChatSidebar />);

    expect(socketService.joinChat).toHaveBeenCalledWith('round:42');
  });

  it('joins "round:<id>" when an active round with a string id is set', async () => {
    await setActiveRound({ id: 'round-abc' } as Round);

    render(<ChatSidebar />);

    expect(socketService.joinChat).toHaveBeenCalledWith('round:round-abc');
  });

  it('leaves the previous channel and rejoins when active round changes', async () => {
    await setActiveRound({ id: 'r1' } as Round);
    render(<ChatSidebar />);
    expect(socketService.joinChat).toHaveBeenCalledWith('round:r1');

    await setActiveRound({ id: 'r2' } as Round);

    expect(socketService.leaveChat).toHaveBeenCalledWith('round:r1');
    expect(socketService.joinChat).toHaveBeenCalledWith('round:r2');
  });

  it('falls back to "general" when the active round is cleared', async () => {
    await setActiveRound({ id: 'r1' } as Round);
    render(<ChatSidebar />);
    expect(socketService.joinChat).toHaveBeenCalledWith('round:r1');

    await setActiveRound(null);

    expect(socketService.leaveChat).toHaveBeenCalledWith('round:r1');
    expect(socketService.joinChat).toHaveBeenCalledWith('general');
  });

  it('leaves the current channel on unmount', async () => {
    await setActiveRound({ id: 'gone' } as Round);
    const { unmount } = render(<ChatSidebar />);
    expect(socketService.joinChat).toHaveBeenCalledWith('round:gone');

    unmount();

    expect(socketService.leaveChat).toHaveBeenCalledWith('round:gone');
  });

  it('still renders the chat input UI while the channel subscription effect runs', () => {
    render(<ChatSidebar />);

    // Sanity check that the UI is fully mounted — the message input is what
    // we primarily care about because it depends on the same effect chain we
    // are testing.
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
  });
});

describe('ChatSidebar — offline guard and character limit', () => {
  afterEach(() => {
    vi.mocked(useConnectionStatus).mockReturnValue({
      status: 'connected',
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
    });
  });

  it('shows a clear offline indicator and disables input/send when disconnected', () => {
    vi.mocked(useConnectionStatus).mockReturnValue({
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    render(<ChatSidebar />);

    expect(screen.getByText(/chat is offline/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Message input')).toBeDisabled();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('does not show the offline indicator while connected', () => {
    render(<ChatSidebar />);
    expect(screen.queryByText(/chat is offline/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Message input')).not.toBeDisabled();
  });

  it('disables send and shows a warning once the message exceeds the character limit', () => {
    render(<ChatSidebar />);

    const textarea = screen.getByLabelText('Message input');
    const tooLong = 'a'.repeat(501);
    fireEvent.change(textarea, { target: { value: tooLong } });

    expect(screen.getByText(/message too long/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('keeps send enabled at exactly the character limit', () => {
    render(<ChatSidebar />);

    const textarea = screen.getByLabelText('Message input');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(500) } });

    expect(screen.queryByText(/message too long/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).not.toBeDisabled();
  });
});

describe('ChatSidebar — mobile sheet focus order', () => {
  it('moves focus into the sheet when opened on mobile', async () => {
    render(<ChatSidebar />);

    const toggle = screen.getByLabelText('Toggle chat sidebar');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('Message input'));
    });
  });

  it('restores focus to the toggle button when closed via Escape', async () => {
    render(<ChatSidebar />);

    const toggle = screen.getByLabelText('Toggle chat sidebar');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('Message input'));
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(document.activeElement).toBe(toggle);
    });
  });

  it('marks the sheet as a modal dialog only while open on mobile', () => {
    render(<ChatSidebar />);

    const toggle = screen.getByLabelText('Toggle chat sidebar');
    expect(screen.getByLabelText('Live chat')).not.toHaveAttribute('aria-modal', 'true');

    fireEvent.click(toggle);

    expect(screen.getByLabelText('Live chat')).toHaveAttribute('aria-modal', 'true');
  });
});

describe('ChatSidebar — empty-state illustration (#446)', () => {
  afterEach(() => {
    vi.mocked(useConnectionStatus).mockReturnValue({
      status: 'connected',
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
    });
  });

  it('shows a non-emoji SVG illustration (not just the plain message icon) when offline with no messages', () => {
    vi.mocked(useConnectionStatus).mockReturnValue({
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    render(<ChatSidebar />);

    const messagesRegion = screen.getByLabelText('Message input').closest('aside')!;
    const svgs = messagesRegion.querySelectorAll('svg[aria-hidden="true"]');
    // At least one aria-hidden decorative SVG illustration is present (not text/emoji).
    expect(svgs.length).toBeGreaterThan(0);
    expect(screen.getByText(/no connection/i)).toBeInTheDocument();
    expect(screen.getByText(/reconnect to see and send messages/i)).toBeInTheDocument();
  });

  it('shows the plain empty-state copy (not the offline illustration) when connected with no messages', () => {
    render(<ChatSidebar />);

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/no connection/i)).not.toBeInTheDocument();
  });

  it('never renders an emoji character as the empty-state icon', () => {
    vi.mocked(useConnectionStatus).mockReturnValue({
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    render(<ChatSidebar />);

    const emptyStateTitle = screen.getByText(/no connection/i);
    const emojiPattern = /\p{Extended_Pictographic}/u;
    expect(emojiPattern.test(emptyStateTitle.parentElement?.textContent ?? '')).toBe(false);
  });
});
