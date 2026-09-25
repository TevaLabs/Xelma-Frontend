import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DirectionIcon from './DirectionIcon';

type Vertex = [number, number];

function vertices(container: HTMLElement): Vertex[] {
  const points = container.querySelector('polygon')?.getAttribute('points') ?? '';
  return points.split(' ').map((pair) => pair.split(',').map(Number) as Vertex);
}

// A triangle points up when a single vertex (the apex) is highest and the
// other two (the base) share the lowest y; SVG y grows downwards.
function pointsUp(v: Vertex[]): boolean {
  const ys = v.map(([, y]) => y);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return ys.filter((y) => y === top).length === 1 && ys.filter((y) => y === bottom).length === 2;
}

function pointsDown(v: Vertex[]): boolean {
  const ys = v.map(([, y]) => y);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return ys.filter((y) => y === top).length === 2 && ys.filter((y) => y === bottom).length === 1;
}

describe('DirectionIcon', () => {
  it('draws a triangle that points up for UP', () => {
    const { container } = render(<DirectionIcon direction="UP" />);
    const v = vertices(container);

    expect(v).toHaveLength(3);
    expect(pointsUp(v)).toBe(true);
    expect(pointsDown(v)).toBe(false);
  });

  it('draws a triangle that points down for DOWN', () => {
    const { container } = render(<DirectionIcon direction="DOWN" />);
    const v = vertices(container);

    expect(v).toHaveLength(3);
    expect(pointsDown(v)).toBe(true);
    expect(pointsUp(v)).toBe(false);
  });

  it('is decorative: hidden from assistive tech and not focusable', () => {
    const { container } = render(<DirectionIcon direction="UP" />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('exposes its direction and follows the surrounding text colour', () => {
    const up = render(<DirectionIcon direction="UP" className="h-3 w-3" />).container.querySelector('svg');
    const down = render(<DirectionIcon direction="DOWN" />).container.querySelector('svg');

    expect(up).toHaveAttribute('data-direction', 'up');
    expect(down).toHaveAttribute('data-direction', 'down');
    expect(up).toHaveAttribute('fill', 'currentColor');
    expect(up).toHaveClass('h-3', 'w-3');
  });
});
