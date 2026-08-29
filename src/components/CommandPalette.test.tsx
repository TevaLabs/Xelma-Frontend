import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CommandPalette from './CommandPalette';
import { useCommandMenuStore } from '../store/useCommandMenuStore';

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function renderPalette(initialEntry = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>Landing page</div>} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
        <Route path="/settings" element={<div>Settings page</div>} />
        <Route path="/connect" element={<div>Connect page</div>} />
      </Routes>
      <CommandPalette />
    </MemoryRouter>,
  );
}

function openPalette() {
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  return screen.getByRole('dialog');
}

function searchPalette(query: string) {
  const input = screen.getByRole('combobox');
  fireEvent.change(input, { target: { value: query } });
  return input;
}

describe('CommandPalette', () => {
  beforeEach(() => {
    useCommandMenuStore.setState({ actions: {} });
  });

  afterEach(() => {
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    } else {
      // @ts-expect-error deleting a descriptor we may have added in a test
      delete navigator.clipboard;
    }
  });

  describe('opening', () => {
    it('is closed by default and opens via Ctrl+K', async () => {
      renderPalette();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      openPalette();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());
    });

    it('toggles closed when Ctrl+K is pressed again', () => {
      renderPalette();
      openPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes on Escape', () => {
      renderPalette();
      openPalette();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('routes', () => {
    it('makes /settings discoverable and navigates to it', () => {
      renderPalette();
      openPalette();
      searchPalette('settings');

      const option = screen.getByRole('option', { name: 'Settings' });
      expect(option).toBeInTheDocument();

      fireEvent.click(option);
      expect(screen.getByText('Settings page')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('navigates when the highlighted route is selected with Enter', () => {
      renderPalette();
      openPalette();
      // Empty query — the first item is the Dashboard route.
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
      expect(screen.getByText('Dashboard page')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('executes the built-in "Copy dashboard link" action', () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });

      renderPalette();
      openPalette();
      searchPalette('copy');

      fireEvent.click(screen.getByRole('option', { name: /copy dashboard link/i }));
      expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/dashboard`);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('executes actions registered by a page', () => {
      const run = vi.fn();
      const unregister = useCommandMenuStore.getState().registerAction({
        id: 'open-magical-drawer',
        label: 'Open magical drawer',
        keywords: ['drawer'],
        run,
      });

      renderPalette();
      openPalette();
      searchPalette('magical');

      fireEvent.click(screen.getByRole('option', { name: /open magical drawer/i }));
      expect(run).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      unregister();
    });

    it('executes the highlighted action with Enter', () => {
      const run = vi.fn();
      const unregister = useCommandMenuStore.getState().registerAction({
        id: 'ping',
        label: 'Ping terminal',
        run,
      });

      renderPalette();
      openPalette();
      searchPalette('ping');
      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
      expect(run).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      unregister();
    });
  });

  describe('filtering', () => {
    it('fuzzy-matches labels and keywords alongside routes', () => {
      const run = vi.fn();
      useCommandMenuStore.getState().registerAction({
        id: 'open-event-log',
        label: 'Open event log',
        keywords: ['events', 'ledger'],
        run,
      });

      renderPalette();
      openPalette();
      // Subsequence match: "evt" is present in order in "Open event log".
      searchPalette('evt');
      expect(screen.getByRole('option', { name: /open event log/i })).toBeInTheDocument();

      // A route still wins over unrelated actions.
      searchPalette('sett');
      expect(screen.getByRole('option', { name: 'Settings' })).toBeInTheDocument();
    });

    it('shows an empty state when nothing matches', () => {
      renderPalette();
      openPalette();
      searchPalette('zzzzz');
      expect(screen.getByText(/No routes or actions match "zzzzz"/)).toBeInTheDocument();
    });
  });

  describe('keyboard navigation and focus', () => {
    it('moves the selection with arrow keys', () => {
      renderPalette();
      openPalette();

      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const selected = screen
        .getAllByRole('option')
        .filter((option) => option.getAttribute('aria-selected') === 'true');
      expect(selected).toHaveLength(1);
      expect(selected[0]).toHaveTextContent('Leaderboard');
    });

    it('wraps selected index with arrow keys', () => {
      renderPalette();
      openPalette();

      const input = screen.getByRole('combobox');
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const selected = screen
        .getAllByRole('option')
        .filter((option) => option.getAttribute('aria-selected') === 'true');
      expect(selected[0]).toHaveTextContent('Copy dashboard link');
    });

    it('traps focus inside the dialog when tabbing from the last option', () => {
      renderPalette();
      openPalette();

      const dialog = screen.getByRole('dialog');
      const options = screen.getAllByRole('option');
      const lastOption = options[options.length - 1];
      lastOption.focus();

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(dialog).toContainElement(document.activeElement);
    });
  });
});