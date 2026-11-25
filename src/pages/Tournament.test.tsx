import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import Tournament from './Tournament';

const WAITLIST_STORAGE_KEY = 'xelma_tournament_waitlist';

describe('<Tournament /> coming soon page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows only the coming-soon roadmap and not-yet-available tournament features', () => {
    render(<Tournament />);

    expect(
      screen.getByRole('heading', { name: 'Tournament mode is on the way' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Upcoming')).toHaveLength(4);
    expect(screen.queryByRole('heading', { name: 'Tournament Formats' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Get notified when tournaments launch' }),
    ).toBeInTheDocument();
  });

  it('stores a normalized email locally and confirms waitlist signup', () => {
    render(<Tournament />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: '  Player@Example.com  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));

    expect(JSON.parse(localStorage.getItem(WAITLIST_STORAGE_KEY) ?? '[]')).toEqual([
      'player@example.com',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('You’re on the tournament waitlist!');
  });

  it('does not duplicate an existing signup and reports local storage failures', () => {
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(['player@example.com']));
    render(<Tournament />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: 'player@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));

    expect(JSON.parse(localStorage.getItem(WAITLIST_STORAGE_KEY) ?? '[]')).toEqual([
      'player@example.com',
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('already on the waitlist');

    localStorage.setItem(WAITLIST_STORAGE_KEY, '{invalid');
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));

    expect(screen.getByRole('alert')).toHaveTextContent('couldn’t save your email on this device');
  });
});
