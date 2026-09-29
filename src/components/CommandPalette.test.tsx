import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette from './CommandPalette';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPalette(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CommandPalette />
    </MemoryRouter>,
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Open and Close Shortcuts', () => {
    it('is not visible by default', () => {
      renderPalette();
      expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    });

    it('opens palette when Ctrl+K is pressed', () => {
      renderPalette();

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const dialog = screen.getByRole('dialog', { name: 'Command palette' });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('opens palette when Cmd+K (metaKey) is pressed', () => {
      renderPalette();

      fireEvent.keyDown(document, { key: 'k', metaKey: true });

      expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    });

    it('toggles closed when Ctrl+K is pressed while open', () => {
      renderPalette();

      // Open
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();

      // Close
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    });

    it('closes when Escape key is pressed', () => {
      renderPalette();

      // Open
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();

      // Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    });

    it('closes when backdrop is clicked', () => {
      renderPalette();

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();

      // Click backdrop (the element with aria-hidden="true" overlay)
      const backdrop = document.querySelector('.bg-black\\/60');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);

      expect(screen.queryByRole('dialog', { name: 'Command palette' })).not.toBeInTheDocument();
    });

    it('focuses the search input upon opening', async () => {
      renderPalette();

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const input = screen.getByRole('combobox', { name: '' });
      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });
  });

  describe('Route List & Filtering', () => {
    it('renders all default routes when opened', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(6);

      const labels = options.map((opt) => opt.textContent);
      expect(labels).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Dashboard'),
          expect.stringContaining('Leaderboard'),
          expect.stringContaining('Learn'),
          expect.stringContaining('Connect'),
          expect.stringContaining('Profile'),
          expect.stringContaining('Pools'),
        ]),
      );
    });

    it('indicates current route based on router location', () => {
      renderPalette('/leaderboard');
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const options = screen.getAllByRole('option');
      const leaderboardOption = options.find((opt) => opt.textContent?.includes('Leaderboard'));
      expect(leaderboardOption).toHaveTextContent('current');
    });

    it('filters routes when user types a query', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'dash' } });

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Dashboard');
    });

    it('displays empty state when no routes match query', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'nonexistent-route' } });

      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(screen.getByText('No routes match "nonexistent-route"')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation & Selection', () => {
    it('navigates with ArrowDown and ArrowUp wrapping around options', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const input = screen.getByRole('combobox');
      const options = screen.getAllByRole('option');

      // First item selected by default
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

      // Arrow down -> moves to second item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
      expect(input).toHaveAttribute('aria-activedescendant', options[1].id);

      // Arrow up -> moves back to first item
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
      expect(options[1]).toHaveAttribute('aria-selected', 'false');

      // Arrow up from first item -> wraps to last item
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      const lastIndex = options.length - 1;
      expect(options[lastIndex]).toHaveAttribute('aria-selected', 'true');
      expect(input).toHaveAttribute('aria-activedescendant', options[lastIndex].id);

      // Arrow down from last item -> wraps to first item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('navigates to selected route on Enter key press and closes palette', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const input = screen.getByRole('combobox');

      // First route is /dashboard
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('filters and navigates to the filtered route via Enter', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'leader' } });

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith('/leaderboard');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('navigates to route on option click and closes palette', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const learnOption = screen.getByText('Learn').closest('button');
      expect(learnOption).toBeInTheDocument();

      fireEvent.click(learnOption!);

      expect(mockNavigate).toHaveBeenCalledWith('/learn');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('updates selected option on mouse hover', () => {
      renderPalette();
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // Mouse enter on third option ('Learn')
      fireEvent.mouseEnter(options[2]);
      expect(options[2]).toHaveAttribute('aria-selected', 'true');
      expect(options[0]).toHaveAttribute('aria-selected', 'false');
    });
  });
});
