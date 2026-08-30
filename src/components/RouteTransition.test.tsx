import { useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import RouteTransition from './RouteTransition';
import { useSettingsStore } from '../store/useSettingsStore';
import { ENTER } from '../utils/motion';

function Probe({ label, onMount, onUnmount }: { label: string; onMount: () => void; onUnmount: () => void }) {
  useEffect(() => {
    onMount();
    return () => onUnmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div>{label}</div>;
}

describe('RouteTransition', () => {
  afterEach(() => {
    useSettingsStore.getState().setMotionPreference('system');
  });

  it('renders its children', () => {
    render(
      <MemoryRouter initialEntries={['/a']}>
        <RouteTransition>
          <p>page content</p>
        </RouteTransition>
      </MemoryRouter>,
    );

    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('applies the shared ENTER animation classes by default', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/a']}>
        <RouteTransition>
          <p>page content</p>
        </RouteTransition>
      </MemoryRouter>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass(...ENTER.split(' '));
  });

  it('omits the animation classes when reduced motion is preferred', () => {
    useSettingsStore.getState().setMotionPreference('reduce');

    const { container } = render(
      <MemoryRouter initialEntries={['/a']}>
        <RouteTransition>
          <p>page content</p>
        </RouteTransition>
      </MemoryRouter>,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).not.toHaveAttribute('class');
  });

  it('remounts (replaying the entrance) when the route changes', () => {
    const onMount = vi.fn();
    const onUnmount = vi.fn();

    render(
      <MemoryRouter initialEntries={['/a']}>
        <Link to="/b">Go to B</Link>
        <Routes>
          <Route
            path="/a"
            element={
              <RouteTransition>
                <Probe label="page a" onMount={onMount} onUnmount={onUnmount} />
              </RouteTransition>
            }
          />
          <Route
            path="/b"
            element={
              <RouteTransition>
                <Probe label="page b" onMount={onMount} onUnmount={onUnmount} />
              </RouteTransition>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(onMount).toHaveBeenCalledTimes(1);
    expect(onUnmount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('link', { name: 'Go to B' }));

    expect(onUnmount).toHaveBeenCalledTimes(1);
    expect(onMount).toHaveBeenCalledTimes(2);
    expect(screen.getByText('page b')).toBeInTheDocument();
  });

  it('does not add any wrapper sizing that could shift layout', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/a']}>
        <RouteTransition>
          <p>page content</p>
        </RouteTransition>
      </MemoryRouter>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('');
    expect(wrapper.style.height).toBe('');
  });
});
