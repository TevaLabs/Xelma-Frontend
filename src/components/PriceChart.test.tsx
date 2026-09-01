import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import PriceChart from './PriceChart';

// Mock lightweight-charts
vi.mock('lightweight-charts', () => ({
  createChart: vi.fn(),
  ColorType: {
    Solid: 'solid',
  },
  LineSeries: 'Line',
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

// Deterministic seed data — the component also loads mockPriceData on mount, so
// keep the mock series identical to the API series to avoid an artificial
// mock→API price transition flashing on initial load.
vi.mock('../data/mockData', () => ({
  mockPriceData: {
    XLM: [
      { time: 1, value: 100 },
      { time: 2, value: 101 },
    ],
  },
}));

import { createChart } from 'lightweight-charts';
import { priceApi } from '../lib/api-client';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useSettingsStore } from '../store/useSettingsStore';

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

  // Captured socket price-update handler so tests can push live ticks.
  let priceUpdateHandler: ((payload: unknown) => void) | undefined;

  const initialSeries = [
    { time: 1, value: 100 },
    { time: 2, value: 101 },
  ];

  /** Render the chart with initial data loaded and wait for it to settle. */
  async function renderLoadedChart() {
    (priceApi.getPriceSeries as any).mockResolvedValue(initialSeries);
    render(<PriceChart height={300} />);
    await vi.waitFor(() => {
      expect(priceApi.getPriceSeries).toHaveBeenCalled();
    });
    await vi.waitFor(() => {
      expect(screen.getByText('$101.000000')).toBeInTheDocument();
    });
  }

  /** Push a live price tick through the (mocked) socket and flush the throttle. */
  async function pushLiveTick(payload: unknown) {
    await act(async () => {
      priceUpdateHandler?.(payload);
      // The socket handler batches updates through a 50ms throttle timer.
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    priceUpdateHandler = undefined;
    useSettingsStore.setState({ motionPreference: 'system' });
    
    // Mock requestAnimationFrame to execute immediately
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 1 as unknown as number;
    };
    global.cancelAnimationFrame = vi.fn();
    
    // jsdom has no Web Animations API — stub it so flash calls are observable.
    Element.prototype.animate = vi.fn() as any;
    
    // Setup lightweight-charts mocks
    (createChart as any).mockReturnValue(mockChartApi);
    mockChartApi.addSeries.mockReturnValue(mockSeriesApi);
    
    // Setup socket service mocks
    (socketService.connect as any).mockClear();
    (socketService.onPriceUpdate as any).mockImplementation((handler: (payload: unknown) => void) => {
      priceUpdateHandler = handler;
      return mockUnsubscribe;
    });
    
    // Setup priceApi mock
    (priceApi.getPriceSeries as any).mockResolvedValue([]);
    
    // Setup useConnectionStatus mock
    (useConnectionStatus as any).mockReturnValue({
      isConnected: true,
      status: 'connected',
    });
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
      
      render(<PriceChart height={300} />);
      
      expect(screen.getByText(/Loading live price data/i)).toBeInTheDocument();
    });
  });

  describe('Last-tick Price Flash', () => {
    it('does not flash on initial load', async () => {
      await renderLoadedChart();

      expect(Element.prototype.animate).not.toHaveBeenCalled();
    });

    it('flashes green when the last price ticks up', async () => {
      await renderLoadedChart();

      await pushLiveTick({ time: 3, value: 102 });

      const flash = screen.getByTestId('price-flash');
      expect(flash.dataset.direction).toBe('up');
      expect(flash.style.background).toBe('rgba(34, 197, 94, 0.45)');
      expect(Element.prototype.animate).toHaveBeenCalled();
    });

    it('flashes red when the last price ticks down', async () => {
      await renderLoadedChart();

      await pushLiveTick({ time: 3, value: 100.5 });

      const flash = screen.getByTestId('price-flash');
      expect(flash.dataset.direction).toBe('down');
      expect(flash.style.background).toBe('rgba(239, 68, 68, 0.45)');
      expect(Element.prototype.animate).toHaveBeenCalled();
    });

    it('does not flash when the latest price is unchanged', async () => {
      await renderLoadedChart();

      await pushLiveTick({ time: 3, value: 101 });

      const flash = screen.getByTestId('price-flash');
      expect(flash.dataset.direction).toBeUndefined();
      expect(Element.prototype.animate).not.toHaveBeenCalled();
    });

    it('does not flash when reduced motion is preferred', async () => {
      useSettingsStore.setState({ motionPreference: 'reduce' });
      await renderLoadedChart();

      await pushLiveTick({ time: 3, value: 102 });

      const flash = screen.getByTestId('price-flash');
      expect(flash.dataset.direction).toBeUndefined();
      expect(Element.prototype.animate).not.toHaveBeenCalled();
    });

    it('coalesces rapid ticks so a high-frequency feed does not strobe', async () => {
      await renderLoadedChart();

      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
      try {
        await pushLiveTick({ time: 3, value: 102 });
        // One flash = overlay + badge animations.
        expect(Element.prototype.animate).toHaveBeenCalledTimes(2);

        // Second tick arrives 50ms later — inside the flash cooldown → skipped.
        nowSpy.mockReturnValue(1_000_050);
        await pushLiveTick({ time: 4, value: 103 });

        expect(Element.prototype.animate).toHaveBeenCalledTimes(2);
      } finally {
        nowSpy.mockRestore();
      }
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
});
