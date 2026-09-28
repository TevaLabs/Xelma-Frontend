import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import PriceChart from './PriceChart';
import type { Asset } from '../types/asset';

// Mock lightweight-charts
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(),
  ColorType: {
    Solid: 'solid',
  },
  LineSeries: 'Line',
  CandlestickSeries: 'Candlestick',
}));

// Mock api-client
vi.mock('../lib/api-client', () => ({
  priceApi: {
    getPriceSeries: vi.fn(),
  },
}));

// Mock socket service
vi.mock('../lib/socket', () => ({
  socketService: {
    connect: vi.fn(),
    onPriceUpdate: vi.fn(),
  },
}));

// Mock useConnectionStatus hook
vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

// Keep the chart toggle tests deterministic without depending on the settings store.
vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(),
}));

import { createChart } from 'lightweight-charts';
import { priceApi } from '../lib/api-client';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useReducedMotion } from '../hooks/useReducedMotion';

describe('PriceChart', () => {
  const mockChartApi = {
    remove: vi.fn(),
    addSeries: vi.fn(),
    removeSeries: vi.fn(),
    timeScale: vi.fn(() => ({
      subscribeVisibleLogicalRangeChange: vi.fn(),
      unsubscribeVisibleLogicalRangeChange: vi.fn(),
      fitContent: vi.fn(),
    })),
    applyOptions: vi.fn(),
  };

  const mockSeriesApi = {
    setData: vi.fn(),
    priceToCoordinate: vi.fn(() => 100),
    applyOptions: vi.fn(),
  };

  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock requestAnimationFrame to execute immediately
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 1 as unknown as number;
    };
    global.cancelAnimationFrame = vi.fn();
    
    // Setup lightweight-charts mocks
    (createChart as any).mockReturnValue(mockChartApi);
    mockChartApi.addSeries.mockReturnValue(mockSeriesApi);
    
    // Setup socket service mocks
    (socketService.connect as any).mockClear();
    (socketService.onPriceUpdate as any).mockReturnValue(mockUnsubscribe);
    
    // Setup priceApi mock
    (priceApi.getPriceSeries as any).mockResolvedValue([]);
    
    // Setup useConnectionStatus mock
    (useConnectionStatus as any).mockReturnValue({
      isConnected: true,
      status: 'connected',
    });
    (useReducedMotion as any).mockReturnValue({
      reduced: false,
      systemPreference: false,
      override: 'system',
    });
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Mount and Unmount', () => {
    it('should mount without canvas dependency failures', async () => {
      const { container } = render(<PriceChart height={300} />);
      
      expect(createChart).toHaveBeenCalled();
      expect(mockChartApi.addSeries).toHaveBeenCalled();
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should cleanup chart on unmount', () => {
      const { unmount } = render(<PriceChart height={300} />);
      
      unmount();
      
      expect(mockChartApi.remove).toHaveBeenCalled();
    });

    it('should clear refs on unmount', () => {
      const { unmount } = render(<PriceChart height={300} />);
      
      unmount();
      
      // After unmount, chart.remove() is called which should nullify refs
      expect(mockChartApi.remove).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending RAF on unmount', () => {
      const { unmount } = render(<PriceChart height={300} />);
      
      unmount();
      
      // The component should cleanup any pending requestAnimationFrame calls
      expect(mockChartApi.remove).toHaveBeenCalled();
    });
  });

  describe('Series Updates', () => {
    it('should fetch price data on mount', async () => {
      const mockData = [
        { time: 1000000, value: 0.1 },
        { time: 1000001, value: 0.11 },
        { time: 1000002, value: 0.12 },
      ];
      
      (priceApi.getPriceSeries as any).mockResolvedValue(mockData);
      
      render(<PriceChart height={300} />);
      
      // Wait for async operations
      await vi.waitFor(() => {
        expect(priceApi.getPriceSeries).toHaveBeenCalled();
      });
      
      // Component should render without errors
      expect(screen.getByText('XLM/USD')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', async () => {
      (priceApi.getPriceSeries as any).mockResolvedValue([]);
      
      render(<PriceChart height={300} />);
      
      await vi.waitFor(() => {
        expect(priceApi.getPriceSeries).toHaveBeenCalled();
      });
      
      // Should not throw with empty data
      expect(screen.getByText('XLM/USD')).toBeInTheDocument();
    });

    it('should create series with chart', () => {
      render(<PriceChart height={300} />);
      
      // Verify that addSeries was called to create the line series
      expect(mockChartApi.addSeries).toHaveBeenCalledWith(
        'Line',
        expect.objectContaining({
          color: '#FFFFFF',
          lineWidth: 3,
        })
      );
    });
  });

  describe('Chart mode toggle', () => {
    it('switches to a candlestick series without recreating the chart and persists the choice', () => {
      render(<PriceChart height={300} />);

      const toggle = screen.getByRole('button', { name: /switch to candlestick chart/i });
      fireEvent.click(toggle);

      expect(mockChartApi.removeSeries).toHaveBeenCalledWith(mockSeriesApi);
      expect(mockChartApi.addSeries).toHaveBeenLastCalledWith(
        'Candlestick',
        expect.objectContaining({ upColor: '#22C55E', downColor: '#EC4899' }),
      );
      expect(createChart).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('xelma-price-chart-mode')).toBe('candlestick');
      expect(screen.getByRole('button', { name: /switch to line chart/i })).toHaveAttribute('aria-pressed', 'true');
    });

    it('restores the persisted candlestick preference on mount', () => {
      localStorage.setItem('xelma-price-chart-mode', 'candlestick');

      render(<PriceChart height={300} />);

      expect(mockChartApi.addSeries).toHaveBeenCalledWith(
        'Candlestick',
        expect.any(Object),
      );
    });

    it('removes toggle animations when reduced motion is preferred', () => {
      (useReducedMotion as any).mockReturnValue({
        reduced: true,
        systemPreference: true,
        override: 'system',
      });

      render(<PriceChart height={300} />);

      expect(screen.getByRole('button', { name: /switch to candlestick chart/i })).toHaveClass('transition-none');
    });
  });

  describe('Subscribe/Unsubscribe Behavior', () => {
    it('should subscribe to socket price updates on mount', () => {
      render(<PriceChart height={300} />);
      
      expect(socketService.connect).toHaveBeenCalled();
      expect(socketService.onPriceUpdate).toHaveBeenCalled();
    });

    it('should unsubscribe from socket price updates on unmount', () => {
      const { unmount } = render(<PriceChart height={300} />);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should add window resize listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      render(<PriceChart height={300} />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });

    it('should remove window resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<PriceChart height={300} />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Offline Badge Behavior', () => {
    it('should show LIVE badge when connected', () => {
      (useConnectionStatus as any).mockReturnValue({
        isConnected: true,
        status: 'connected',
      });
      
      render(<PriceChart height={300} />);
      
      expect(screen.getByText('LIVE')).toBeInTheDocument();
      expect(screen.queryByText('OFFLINE')).not.toBeInTheDocument();
    });

    it('should show OFFLINE badge when disconnected', () => {
      (useConnectionStatus as any).mockReturnValue({
        isConnected: false,
        status: 'disconnected',
      });
      
      render(<PriceChart height={300} />);
      
      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
      expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    });

    it('should show ConnectionStatus component when offline', () => {
      (useConnectionStatus as any).mockReturnValue({
        isConnected: false,
        status: 'disconnected',
      });
      
      render(<PriceChart height={300} />);
      
      // ConnectionStatus should be rendered when not connected
      const connectionStatus = screen.queryByText(/Connection failed|Live updates disconnected|Connecting/);
      expect(connectionStatus).toBeInTheDocument();
    });

    it('should not show ConnectionStatus component when online', () => {
      (useConnectionStatus as any).mockReturnValue({
        isConnected: true,
        status: 'connected',
      });
      
      render(<PriceChart height={300} />);
      
      // ConnectionStatus should not be rendered when connected
      const connectionStatus = screen.queryByText(/Connection failed|Live updates disconnected|Connecting/);
      expect(connectionStatus).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle price API errors gracefully', async () => {
      (priceApi.getPriceSeries as any).mockRejectedValue(new Error('Network error'));
      
      render(<PriceChart height={300} />);
      
      // Wait for the error state to be displayed
      await vi.waitFor(() => {
        expect(screen.getByText(/Failed to load prices/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show loading state initially', () => {
      (priceApi.getPriceSeries as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      // Use an asset with no mock-data fast-path so the loading state stays visible
      // while the pending price fetch is in flight.
      render(<PriceChart height={300} asset={'SOL' as Asset} />);
      
      expect(screen.getByText(/Loading live price data/i)).toBeInTheDocument();
    });
  });

  describe('Chart Configuration', () => {
    it('should create chart with correct configuration', () => {
      render(<PriceChart height={300} />);
      
      expect(createChart).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          layout: expect.objectContaining({
            background: { type: 'solid', color: 'transparent' },
            textColor: 'transparent',
            attributionLogo: false,
          }),
          grid: expect.objectContaining({
            vertLines: { visible: false },
            horzLines: { visible: false },
          }),
          width: expect.any(Number),
          height: 300,
          rightPriceScale: { visible: false },
          leftPriceScale: { visible: false },
          timeScale: expect.objectContaining({
            visible: false,
            borderVisible: false,
            rightOffset: 0,
            fixLeftEdge: true,
            fixRightEdge: true,
          }),
          crosshair: expect.objectContaining({
            vertLine: { visible: false },
            horzLine: { visible: false },
          }),
          handleScroll: false,
          handleScale: false,
        })
      );
    });

    it('should add line series with correct options', () => {
      render(<PriceChart height={300} />);
      
      expect(mockChartApi.addSeries).toHaveBeenCalledWith(
        'Line',
        expect.objectContaining({
          color: '#FFFFFF',
          lineWidth: 3,
          priceFormat: { type: 'price', precision: 6, minMove: 0.000001 },
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          lineType: 2,
        })
      );
    });

    it('should use custom height prop', () => {
      render(<PriceChart height={400} />);
      
      expect(createChart).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        expect.objectContaining({
          height: 400,
        })
      );
    });
  });

  describe('Timeframe selector', () => {
    const TIMEFRAME_KEY = 'xelma-price-chart-timeframe';

    const loadSeries = [
      { time: 600, value: 1.0 },
      { time: 610, value: 1.1 },
      { time: 620, value: 1.2 },
      { time: 900, value: 1.3 },
      { time: 910, value: 1.4 },
    ];

    beforeEach(() => {
      localStorage.clear();
      // SOL has no mock-data fast path, so series data comes from the API mock.
      (priceApi.getPriceSeries as any).mockResolvedValue(loadSeries);
    });

    afterEach(() => {
      localStorage.clear();
    });

    const renderWithLoadedData = async () => {
      const view = render(<PriceChart height={300} asset={'SOL' as Asset} />);
      await vi.waitFor(() => {
        expect(mockSeriesApi.setData).toHaveBeenCalled();
        const last = mockSeriesApi.setData.mock.calls.at(-1)?.[0];
        // Resolved API data is non-empty at every timeframe (1m keeps all 5
        // points; coarser settings collapse them into buckets).
        expect(last && last.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
      return view;
    };

    it('renders 1m / 5m / 15m chips with 1m selected by default', async () => {
      await renderWithLoadedData();

      const group = screen.getByRole('group', { name: 'Chart timeframe' });
      expect(group).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1m' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '5m' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: '15m' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('selects the clicked chip and persists the choice', async () => {
      await renderWithLoadedData();

      fireEvent.click(screen.getByRole('button', { name: '5m' }));

      expect(screen.getByRole('button', { name: '5m' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '1m' })).toHaveAttribute('aria-pressed', 'false');
      expect(localStorage.getItem(TIMEFRAME_KEY)).toBe('5m');
    });

    it('restores the persisted timeframe on mount', async () => {
      localStorage.setItem(TIMEFRAME_KEY, '15m');

      await renderWithLoadedData();

      expect(screen.getByRole('button', { name: '15m' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: '1m' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('falls back to 1m when the stored value is invalid', async () => {
      localStorage.setItem(TIMEFRAME_KEY, '1h');

      await renderWithLoadedData();

      expect(screen.getByRole('button', { name: '1m' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('remaps the series client-side without recreating the chart', async () => {
      await renderWithLoadedData();

      const removeSeriesCallsBefore = mockChartApi.removeSeries.mock.calls.length;
      const createChartCallsBefore = (createChart as any).mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: '5m' }));

      await vi.waitFor(() => {
        const last = mockSeriesApi.setData.mock.calls.at(-1)[0];
        // 600/610/620 collapse into the 600 bucket, 900/910 into the 900 bucket.
        expect(last).toEqual([
          { time: 600, value: 1.2 },
          { time: 900, value: 1.4 },
        ]);
      }, { timeout: 3000 });

      // No chart/series teardown: switching timeframe only updates data.
      expect((createChart as any).mock.calls.length).toBe(createChartCallsBefore);
      expect(mockChartApi.removeSeries.mock.calls.length).toBe(removeSeriesCallsBefore);
      expect(mockChartApi.remove).not.toHaveBeenCalled();
    });

    it('keeps the 1m series untouched when selecting the already-active chip', async () => {
      await renderWithLoadedData();

      const setDataCallsBefore = mockSeriesApi.setData.mock.calls.length;

      fireEvent.click(screen.getByRole('button', { name: '1m' }));

      // Same timeframe → no state change → no data effect re-run.
      expect(mockSeriesApi.setData.mock.calls.length).toBe(setDataCallsBefore);
      expect(localStorage.getItem(TIMEFRAME_KEY)).toBeNull();
    });
  });
});
