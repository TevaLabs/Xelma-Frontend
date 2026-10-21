import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NotFound from './NotFound';

describe('NotFound page', () => {
  it('renders the 404 heading inside a main landmark', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
    expect(
      screen.getByRole('heading', { level: 1, name: /this path doesn't exist/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('explains that the route does not exist', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText(/no matching endpoint/i)).toBeInTheDocument();
  });

  it('offers recovery links back to home and to the terminal', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /open terminal/i })).toHaveAttribute('href', '/dashboard');
  });
});
