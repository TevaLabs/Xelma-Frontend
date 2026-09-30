import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommandPalette from './CommandPalette';
import { useDashboardUiStore } from '../store/useDashboardUiStore';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const clipboardWriteText = vi.fn().mockResolvedValue(undefined);

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function openPalette() {
  fireEvent.keyDown(document, { key: 'k', metaKey: true });
}

function renderPalette(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CommandPalette />
    </MemoryRouter>,
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    clipboardWriteText.mockClear();
    useDashboardUiStore.setState({ isChatOpen: false, isEventLogOpen: false });
    Object.assign(navigator, {
      clipboard: { writeText: clipboardWriteText },
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('opens with Cmd/Ctrl+K and closes with Escape', () => {
    renderPalette();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    openPalette();
    expect(screen.getByRole('dialog', { name: /command palette/i })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists all routes including Settings, and filters by query', () => {
    renderPalette();
    openPalette();

    expect(screen.getByRole('option', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /dashboard current/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Settings' } });
    expect(screen.getByRole('option', { name: /settings/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /dashboard current/i })).not.toBeInTheDocument();
  });

  it('navigates to /settings when the Settings entry is selected', () => {
    renderPalette();
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /settings/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
    // Palette closes after selection.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports arrow-key navigation and Enter to select a route', () => {
    renderPalette();
    openPalette();

    const combobox = screen.getByRole('combobox');
    // Dashboard is index 0; press down until Settings (last route) is reached.
    for (let i = 0; i < 6; i += 1) {
      fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    }
    fireEvent.keyDown(combobox, { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('lists quick actions distinct from routes', () => {
    renderPalette();
    openPalette();

    expect(screen.getByRole('option', { name: /open event log/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /toggle chat/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /copy dashboard url/i })).toBeInTheDocument();
  });

  it('"Open event log" sets isEventLogOpen in the shared dashboard UI store', () => {
    renderPalette();
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /open event log/i }));

    expect(useDashboardUiStore.getState().isEventLogOpen).toBe(true);
  });

  it('"Toggle chat" flips isChatOpen in the shared dashboard UI store', () => {
    renderPalette();
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /toggle chat/i }));

    expect(useDashboardUiStore.getState().isChatOpen).toBe(true);
  });

  it('"Copy dashboard URL" writes the dashboard URL to the clipboard', async () => {
    renderPalette();
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /copy dashboard url/i }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(clipboardWriteText).toHaveBeenCalledWith(`${window.location.origin}/dashboard`);
  });

  it('fires a quick action via keyboard navigation (Enter), not just click', () => {
    renderPalette();
    openPalette();

    const combobox = screen.getByRole('combobox');
    fireEvent.change(combobox, { target: { value: 'Toggle chat' } });
    fireEvent.keyDown(combobox, { key: 'Enter' });

    expect(useDashboardUiStore.getState().isChatOpen).toBe(true);
  });

  it('closes the palette after a quick action fires', () => {
    renderPalette();
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /toggle chat/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a "no results" message when the query matches nothing', () => {
    renderPalette();
    openPalette();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzzz' } });

    expect(screen.getByText(/no results match/i)).toBeInTheDocument();
  });
});
