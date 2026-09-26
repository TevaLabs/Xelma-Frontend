import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import '../i18n';
import Tournament from './Tournament';

describe('Tournament page', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the branded shell and roadmap', () => {
    render(<Tournament />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /your next prediction/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'A season worth showing up for' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Season format' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Rewards & prizes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Eligibility' })).toBeInTheDocument();
  });

  it('saves a valid email locally and confirms signup', () => {
    render(<Tournament />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: 'predictor@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join the waitlist/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/predictor@example.com/);
    expect(window.localStorage.getItem('xelma:tournament-waitlist')).toBe(
      JSON.stringify(['predictor@example.com']),
    );
  });

  it('does not add the same email twice, ignoring letter case', () => {
    window.localStorage.setItem('xelma:tournament-waitlist', JSON.stringify(['player@example.com']));
    render(<Tournament />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: 'PLAYER@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join the waitlist/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/already on the waitlist/i);
    expect(window.localStorage.getItem('xelma:tournament-waitlist')).toBe(
      JSON.stringify(['player@example.com']),
    );
  });
});