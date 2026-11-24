import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LazyBoundary from './LazyBoundary';

function ChunkChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Failed to fetch dynamically imported module');
  }
  return <div>Lazy Loaded Component</div>;
}

describe('LazyBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const originalLocation = window.location;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: 'http://localhost/learn', reload: vi.fn() },
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('renders children when no chunk loading error occurs', () => {
    render(
      <LazyBoundary>
        <ChunkChild shouldThrow={false} />
      </LazyBoundary>,
    );

    expect(screen.getByText('Lazy Loaded Component')).toBeInTheDocument();
  });

  it('catches chunk loading errors and displays branded recovery UI', () => {
    render(
      <LazyBoundary>
        <ChunkChild shouldThrow={true} />
      </LazyBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /page failed to load/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('logs chunk loading error once upon catching', () => {
    render(
      <LazyBoundary>
        <ChunkChild shouldThrow={true} />
      </LazyBoundary>,
    );

    const lazyErrorCalls = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('[LazyBoundary] chunk load error:'),
    );
    expect(lazyErrorCalls).toHaveLength(1);
  });

  it('remounts children when Retry is clicked', () => {
    let shouldFail = true;
    function DynamicChunk() {
      if (shouldFail) {
        throw new Error('Chunk load failure');
      }
      return <div>Loaded Chunk Successfully</div>;
    }

    const { rerender } = render(
      <LazyBoundary>
        <DynamicChunk />
      </LazyBoundary>,
    );

    expect(screen.getByText(/page failed to load/i)).toBeInTheDocument();

    shouldFail = false;
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    rerender(
      <LazyBoundary>
        <DynamicChunk />
      </LazyBoundary>,
    );

    expect(screen.getByText('Loaded Chunk Successfully')).toBeInTheDocument();
  });

  it('navigates home when Go Home is clicked', () => {
    render(
      <LazyBoundary>
        <ChunkChild shouldThrow={true} />
      </LazyBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /go home/i }));
    expect(window.location.href).toBe('/');
  });

  it('enforces retry limit on multiple chunk load failures', () => {
    render(
      <LazyBoundary>
        <ChunkChild shouldThrow={true} />
      </LazyBoundary>,
    );

    // Initial load failed
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    // 3 retries
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByText(/max retries exceeded \(3\/3\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reload page/i }));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('shifts focus to retry button when error occurs', async () => {
    render(
      <LazyBoundary>
        <ChunkChild shouldThrow={true} />
      </LazyBoundary>,
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /retry/i }));
    });
  });
});
