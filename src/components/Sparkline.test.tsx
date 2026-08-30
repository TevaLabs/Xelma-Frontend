import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import Sparkline from './Sparkline';
import { useSettingsStore } from '../store/useSettingsStore';

describe('Sparkline', () => {
  afterEach(() => {
    useSettingsStore.getState().setMotionPreference('system');
  });

  it('renders nothing for an empty series', () => {
    const { container } = render(<Sparkline points={[]} label="Empty trend" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an accessible svg with the given label', () => {
    render(<Sparkline points={[1, 2, 3]} label="BTC total volume trend: up 200.0% over the period" />);
    expect(
      screen.getByRole('img', { name: 'BTC total volume trend: up 200.0% over the period' }),
    ).toBeInTheDocument();
  });

  it('renders a full polyline with a trailing marker by default', () => {
    const { container } = render(<Sparkline points={[10, 5, 20, 15]} label="trend" />);

    expect(container.querySelector('polyline')).toBeInTheDocument();
    expect(container.querySelector('circle')).toBeInTheDocument();
  });

  it('renders without backend calls even for a single-point series', () => {
    const { container } = render(<Sparkline points={[42]} label="single point trend" />);
    expect(container.querySelector('circle')).toBeInTheDocument();
    expect(container.querySelector('polyline')).toBeInTheDocument();
  });

  it('shows only a static last point and no polyline when reduced motion is preferred', () => {
    useSettingsStore.getState().setMotionPreference('reduce');

    const { container } = render(<Sparkline points={[10, 5, 20, 15]} label="trend" />);

    expect(container.querySelector('polyline')).not.toBeInTheDocument();
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();

    const svg = screen.getByRole('img', { name: 'trend' });
    expect(svg).toHaveAttribute('data-reduced-motion', 'true');
  });
});
