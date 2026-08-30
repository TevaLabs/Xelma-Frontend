import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Tournament from './Tournament';

describe('Tournament', () => {
  it('renders the branded tournament shell and roadmap cards', () => {
    render(
      <MemoryRouter>
        <Tournament />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /xelma tournament/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /seasons/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /prizes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /eligibility/i })).toBeInTheDocument();
  });

  it('links players back to the dashboard', () => {
    render(
      <MemoryRouter>
        <Tournament />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard');
  });

  it('accepts a local waitlist entry', () => {
    render(
      <MemoryRouter>
        <Tournament />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email or stellar wallet address/i), {
      target: { value: 'GC4Y5TESTADDRESS' },
    });
    fireEvent.click(screen.getByRole('button', { name: /notify me/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/you are on the tournament waitlist/i);
  });
});
