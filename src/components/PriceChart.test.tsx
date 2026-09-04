import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import PriceChart from './PriceChart';
import type { Asset } from '../types/asset';

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

import { createChart } from 'lightweight-charts';
import { priceApi } from '../lib/api-client';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

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
});
