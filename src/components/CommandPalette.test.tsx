import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette, { OPEN_EVENT_LOG_EVENT } from './CommandPalette';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const toastSuccess = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

/** Renders the current router path so Enter-navigation can be asserted. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPalette(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CommandPalette />
      <LocationProbe />
    </MemoryRouter>,
  );
}

const openWithShortcut = () =>
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

function openPalette() {
  openWithShortcut();
  expect(screen.getByRole('combobox')).toBeInTheDocument();
}

const selectedOption = () =>
  screen.getAllByRole('option').find((option) => option.getAttribute('aria-selected') === 'true');

const writeTextMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  writeTextMock.mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText: writeTextMock } });
});

describe('CommandPalette keyboard navigation (#940)', () => {
  it('opens with Ctrl+K and focuses the search input', async () => {
    renderPalette();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    openWithShortcut();

    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    const input = screen.getByRole('combobox');
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('toggles closed when Ctrl+K is pressed again', () => {
    renderPalette();
    openWithShortcut();
    openWithShortcut();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves selection with arrow keys and wraps at both ends', () => {
    renderPalette();
    openWithShortcut();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(9);
    expect(selectedOption()).toBe(options[0]);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(selectedOption()).toBe(options[1]);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowUp' });
    expect(selectedOption()).toBe(options[0]);

    // Wraps to the last item when moving up from the first.
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowUp' });
    expect(selectedOption()).toBe(options[options.length - 1]);

    // Wraps back to the first item when moving down from the last.
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(selectedOption()).toBe(options[0]);
  });

  it('navigates to the selected route on Enter and closes the palette', () => {
    renderPalette();
    openWithShortcut();

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(selectedOption()).toHaveTextContent('Leaderboard');

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });

    expect(screen.getByTestId('location')).toHaveTextContent('/leaderboard');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape, restoring the Ctrl+K trigger for a fresh empty query', async () => {
    renderPalette();
    openWithShortcut();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pool' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    openWithShortcut();
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getAllByRole('option')).toHaveLength(9);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox')));
  });

  it('filters results and navigates to the filtered route on Enter', () => {
    renderPalette();
    openWithShortcut();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pool' } });
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Pools');

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });

    expect(screen.getByTestId('location')).toHaveTextContent('/pools');
  });

  it('handles a non-matching query without navigating or throwing', () => {
    renderPalette();
    openWithShortcut();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzz' } });
    expect(screen.getByText('No results match "zzzz"')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);

    const input = screen.getByRole('combobox');
    expect(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'Enter' });
    }).not.toThrow();

    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('CommandPalette settings and quick actions (#941)', () => {
  it('lists Settings under Routes and both quick actions under Quick actions', () => {
    renderPalette();
    openPalette();

    expect(screen.getByRole('option', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /copy page url/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /open event log/i })).toBeInTheDocument();
    expect(screen.getByText('Routes')).toBeInTheDocument();
    expect(screen.getByText('Quick actions')).toBeInTheDocument();
  });

  it('filters by query across routes and actions', () => {
    renderPalette();
    openPalette();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'settings' } });

    expect(screen.getByRole('option', { name: /settings/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /copy page url/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /open event log/i })).not.toBeInTheDocument();
  });

  it('navigates to /settings when the Settings route is clicked', () => {
    renderPalette('/dashboard');
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /settings/i }));

    expect(screen.getByTestId('location')).toHaveTextContent('/settings');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('navigates to /settings on Enter with Settings highlighted', () => {
    renderPalette('/dashboard');
    openPalette();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'settings' } });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });

    expect(screen.getByTestId('location')).toHaveTextContent('/settings');
  });

  it('copies the current page URL to the clipboard', async () => {
    renderPalette();
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /copy page url/i }));

    await waitFor(() =>
      expect(writeTextMock).toHaveBeenCalledWith(window.location.href),
    );
    expect(toastSuccess).toHaveBeenCalledWith('Link copied to clipboard', {
      id: 'copy-page-url',
    });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows an error toast when copying fails', async () => {
    writeTextMock.mockRejectedValue(new Error('denied'));
    renderPalette();
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /copy page url/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Could not copy link', {
        id: 'copy-page-url',
      }),
    );
  });

  it('opens the event log: navigates to /dashboard and dispatches the event', async () => {
    const handler = vi.fn();
    window.addEventListener(OPEN_EVENT_LOG_EVENT, handler);
    renderPalette('/leaderboard');
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /open event log/i }));

    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    window.removeEventListener(OPEN_EVENT_LOG_EVENT, handler);
  });

  it('dispatches the event log event without navigating when already on /dashboard', async () => {
    const handler = vi.fn();
    window.addEventListener(OPEN_EVENT_LOG_EVENT, handler);
    renderPalette('/dashboard');
    openPalette();

    fireEvent.click(screen.getByRole('option', { name: /open event log/i }));

    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    window.removeEventListener(OPEN_EVENT_LOG_EVENT, handler);
  });
});
