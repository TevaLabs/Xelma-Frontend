import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import CommandPalette from './CommandPalette';

/** Renders the current router path so Enter-navigation can be asserted. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPalette() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <CommandPalette />
      <LocationProbe />
    </MemoryRouter>,
  );
}

const openWithShortcut = () =>
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

const selectedOption = () =>
  screen.getAllByRole('option').find((option) => option.getAttribute('aria-selected') === 'true');

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
    expect(options).toHaveLength(6);
    expect(selectedOption()).toBe(options[0]);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    expect(selectedOption()).toBe(options[1]);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowUp' });
    expect(selectedOption()).toBe(options[0]);

    // Wraps to the last route when moving up from the first.
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowUp' });
    expect(selectedOption()).toBe(options[options.length - 1]);

    // Wraps back to the first route when moving down from the last.
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
    expect(screen.getAllByRole('option')).toHaveLength(6);
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
    expect(screen.getByText('No routes match "zzzz"')).toBeInTheDocument();
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
