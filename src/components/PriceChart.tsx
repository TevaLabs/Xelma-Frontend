import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  LineSeries,
  CandlestickSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type UTCTimestamp,
} from "lightweight-charts";
import { priceApi, type PricePoint } from "../lib/api-client";
import { mergePricePoints, toCandlestickData } from "./PriceChart.helpers";
import { mockPriceData } from "../data/mockData";
import type { Asset } from "../types/asset";
import { socketService } from "../lib/socket";
import { LoadingState, ErrorState } from "./ui/StatusStates";
import { PanelHeader } from "./ui/PanelHeader";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { ConnectionStatus } from "./ConnectionStatus";

interface PriceChartProps {
  height?: number;
asset?: Asset;
  entryPrice?: number | null;
  onPriceUpdate?: (price: number) => void;
}

type PriceUpdatePayload = {
  time?: number | string;
  timestamp?: number | string;
  value?: number | string;
  price?: number | string;
  data?: unknown;
  payload?: unknown;
  prices?: unknown;
  history?: unknown;
};

function toPricePoint(value: unknown): PricePoint | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const rawTime = record.time ?? record.timestamp;
  const rawPrice = record.value ?? record.price;
  const time = typeof rawTime === "string" ? Number(rawTime) : rawTime;
  const price = typeof rawPrice === "string" ? Number(rawPrice) : rawPrice;

  if (!Number.isFinite(time) || !Number.isFinite(price)) return null;
  const normalizedTime = (time as number) > 9999999999 ? Math.floor((time as number) / 1000) : Math.floor(time as number);
  return { time: normalizedTime, value: price as number };
}

function extractPricePoints(payload: unknown): PricePoint[] {
  if (Array.isArray(payload)) {
    return payload.map(toPricePoint).filter((point): point is PricePoint => point !== null);
  }

  if (!payload || typeof payload !== "object") return [];
  const event = payload as PriceUpdatePayload;
  const nested = event.data ?? event.payload ?? event.prices ?? event.history;

  if (nested) return extractPricePoints(nested);
  const point = toPricePoint(event);
  return point ? [point] : [];
}

function buildPriceLabels(points: PricePoint[]): number[] {
  if (points.length === 0) return [];

  const prices = points.map((point) => point.value);
  const latest = prices[prices.length - 1];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || Math.max(latest * 0.002, 0.000001);
  const steps = 5;
  const stepSize = range / steps;

  const labels: number[] = [];
  for (let i = 0; i <= steps; i += 1) {
    labels.push(max - i * stepSize);
  }

  const nearestIndex = labels.reduce((best, label, index) => {
    const bestDistance = Math.abs(labels[best] - latest);
    const currentDistance = Math.abs(label - latest);
    return currentDistance < bestDistance ? index : best;
  }, 0);

  labels[nearestIndex] = latest;

  return Array.from(new Set(labels.map((value) => Number(value.toFixed(6))))).sort((a, b) => b - a);
}

type ChartMode = "line" | "candlestick";

const CHART_MODE_STORAGE_KEY = "xelma-price-chart-mode";

function getStoredChartMode(): ChartMode {
  try {
    const stored = localStorage.getItem(CHART_MODE_STORAGE_KEY);
    if (stored === "candlestick" || stored === "line") return stored;
  } catch {
    // localStorage unavailable
  }
  return "line";
}

function persistChartMode(mode: ChartMode): void {
  try {
    localStorage.setItem(CHART_MODE_STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable
  }
}

const ASSET_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  XLM: "#FFFFFF",
};

const ASSET_BG: Record<string, string> = {
  BTC: "linear-gradient(135deg, #3a2410, #1a120a)",
  ETH: "linear-gradient(135deg, #1e2240, #0a0d1a)",
  XLM: "linear-gradient(135deg, #1e3a5f, #0a1929)",
};

// ── Last-tick price flash ──
// The chart area briefly flashes green/red when the latest price ticks up/down.
// The overlay only animates opacity (compositor-friendly) and the color is set
// imperatively, so a high-tick-rate feed never triggers React re-renders.
const FLASH_DURATION_MS = 400;
// Minimum gap between flashes so a high-frequency feed pulses instead of strobing.
const FLASH_MIN_INTERVAL_MS = 300;
const FLASH_UP_BG = "rgba(34, 197, 94, 0.45)";
const FLASH_DOWN_BG = "rgba(239, 68, 68, 0.45)";
const FLASH_UP_GLOW = "rgba(34, 197, 94, 0.95)";
const FLASH_DOWN_GLOW = "rgba(239, 68, 68, 0.95)";

const PriceChart = ({ height = 300, asset = "XLM", entryPrice, onPriceUpdate }: PriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null>(null);
  const [data, setData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>(getStoredChartMode);

  // y-coordinate of the last data point for the badge
  const [badgeY, setBadgeY] = useState<number | null>(null);
  // y-coordinate of the entry-price marker line label
  const [entryY, setEntryY] = useState<number | null>(null);
  // y-coordinates for each price label
  const [labelYs, setLabelYs] = useState<number[]>([]);

  // Accessibility: Screen reader announcements
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncedRef = useRef<{ price: number, time: number } | null>(null);

  const { reduced: prefersReducedMotion } = useReducedMotion();

  // Last-tick price flash refs — imperative DOM animation, no state churn per tick.
  const flashOverlayRef = useRef<HTMLDivElement>(null);
  const flashBadgeRef = useRef<HTMLDivElement>(null);
  const lastPriceRef = useRef<number | null>(null);
  const lastFlashAtRef = useRef(0);

  // Asset-aware styling (hoisted for use in effects below)
  const lineColor = ASSET_COLORS[asset] ?? "#FFFFFF";

  // Refs for performance optimization
  const dataRef = useRef<PricePoint[]>([]);
  const updatePositionsRef = useRef<(() => void) | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);
  const socketUpdateTimeoutRef = useRef<number | null>(null);
  const pendingDataRef = useRef<PricePoint[]>([]);

  // Entry-price marker refs
  const entryPriceLineRef = useRef<IPriceLine | null>(null);
  const entryPriceRef = useRef<number | null>(null);
  // Keep the latest onPriceUpdate callback in a ref so effects never read a stale one
  const onPriceUpdateRef = useRef<PriceChartProps["onPriceUpdate"]>(onPriceUpdate);
  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  // Keep dataRef in sync with data
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Memoize priceLabels with stable dependency
  const priceLabels = useMemo(() => buildPriceLabels(data), [data]);
  const latestPrice = data[data.length - 1]?.value ?? 0;
  const firstPrice = data[0]?.value ?? latestPrice;
  const priceChange = latestPrice - firstPrice;
  const priceChangePercent = firstPrice !== 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  const hasData = data.length > 0;

  useEffect(() => {
    if (!latestPrice || !hasData) return;
    const now = Date.now();
    const last = lastAnnouncedRef.current;
    
    const THROTTLE_MS = 5000; // 5 seconds
    const MATERIAL_PCT = 0.001; // 0.1% change is material

    let shouldAnnounce = false;
    let directionText = "";

    if (!last) {
      shouldAnnounce = true;
    } else {
      const timePassed = (now - last.time) >= THROTTLE_MS;
      const pctChange = Math.abs((latestPrice - last.price) / last.price);
      
      if (timePassed || pctChange >= MATERIAL_PCT) {
        if (latestPrice !== last.price) {
          shouldAnnounce = true;
          directionText = latestPrice > last.price ? "increased to" : "decreased to";
        }
      }
    }

    if (shouldAnnounce) {
      setAnnouncement(`${asset} price ${directionText ? directionText : 'is'} $${latestPrice.toFixed(4)}`);
      lastAnnouncedRef.current = { price: latestPrice, time: now };
    }
  }, [latestPrice, asset, hasData]);

  /**
   * Briefly flash the chart area and the latest-price badge when the last price
   * ticks up (green) or down (red). Runs imperatively on the DOM via the Web
   * Animations API so per-tick updates never re-render React, and it is skipped
   * entirely for users who prefer reduced motion.
   */
  const triggerFlash = useCallback((direction: "up" | "down") => {
    const overlay = flashOverlayRef.current;
    if (overlay && typeof overlay.animate === "function") {
      overlay.dataset.direction = direction;
      overlay.style.background = direction === "up" ? FLASH_UP_BG : FLASH_DOWN_BG;
      overlay.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: FLASH_DURATION_MS, easing: "ease-out", fill: "forwards" },
      );
    }

    const badge = flashBadgeRef.current;
    if (badge && typeof badge.animate === "function") {
      const glow = direction === "up" ? FLASH_UP_GLOW : FLASH_DOWN_GLOW;
      badge.animate(
        [
          { boxShadow: `0 0 0 3px ${glow}, 0 0 14px ${glow}` },
          { boxShadow: "0 0 0 0 rgba(0,0,0,0)" },
        ],
        { duration: FLASH_DURATION_MS, easing: "ease-out" },
      );
    }
  }, []);

  // Watch the latest price and flash when it ticks up/down.
  useEffect(() => {
    if (!hasData || !Number.isFinite(latestPrice) || latestPrice <= 0) return;

    const previous = lastPriceRef.current;
    lastPriceRef.current = latestPrice;

    // First data point or an unchanged price → nothing to flash.
    if (previous === null || previous === latestPrice) return;

    if (prefersReducedMotion) return;

    // Coalesce bursts so a high-tick-rate feed flashes briefly instead of constantly.
    const now = Date.now();
    if (now - lastFlashAtRef.current < FLASH_MIN_INTERVAL_MS) return;
    lastFlashAtRef.current = now;

    triggerFlash(latestPrice > previous ? "up" : "down");
  }, [latestPrice, hasData, prefersReducedMotion, triggerFlash]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent", // hide built-in labels
        fontFamily: "inherit",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      width: container.clientWidth,
      height: height,
      rightPriceScale: {
        visible: false, // hide the built-in price scale entirely
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // Create initial series based on stored preference
    if (chartMode === "line") {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#FFFFFF",
        lineWidth: 3,
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        lineType: 2, // LineType.Curved
      });
      seriesRef.current = lineSeries;
    } else {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#22C55E",
        downColor: "#EC4899",
        borderUpColor: "#22C55E",
        borderDownColor: "#EC4899",
        wickUpColor: "#22C55E",
        wickDownColor: "#EC4899",
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
      });
      seriesRef.current = candlestickSeries;
    }
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      // The chart disposes its own price lines; just drop the stale ref.
      entryPriceLineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Ref for chartMode to use in effects without adding as dependency
  const chartModeRef = useRef(chartMode);
  useEffect(() => {
    chartModeRef.current = chartMode;
  }, [chartMode]);

  // Handle chart mode switching — replace series without recreating the chart
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const currentData = dataRef.current;

    // Cancel any pending data-update RAF to avoid race with stale formatting
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    // Remove existing series
    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    // Add new series based on current mode
    if (chartMode === "line") {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#FFFFFF",
        lineWidth: 3,
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        lineType: 2, // LineType.Curved
      });
      seriesRef.current = lineSeries;

      if (currentData.length > 0) {
        const chartData = currentData.map((point) => ({
          time: point.time as UTCTimestamp,
          value: point.value,
        }));
        lineSeries.setData(chartData);
      }
    } else {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#22C55E",
        downColor: "#EC4899",
        borderUpColor: "#22C55E",
        borderDownColor: "#EC4899",
        wickUpColor: "#22C55E",
        wickDownColor: "#EC4899",
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
      });
      seriesRef.current = candlestickSeries;

      if (currentData.length > 0) {
        const candlestickData = toCandlestickData(currentData);
        candlestickSeries.setData(candlestickData);
      }
    }

    chart.timeScale().fitContent();

    // Update positions after series switch
    requestAnimationFrame(() => {
      if (updatePositionsRef.current) {
        updatePositionsRef.current();
      }
    });
  }, [chartMode]);  

  // Stable updatePositions function using ref to avoid subscription cycles
  const updatePositions = useCallback(() => {
    if (!seriesRef.current) return;
    const currentData = dataRef.current;
    const lastPoint = currentData[currentData.length - 1];
    if (!lastPoint) {
      setBadgeY(null);
      setLabelYs([]);
      setEntryY(null);
      return;
    }

    const y = seriesRef.current.priceToCoordinate(lastPoint.value);
    setBadgeY(y ?? null);

    // Position the entry-price marker label, mirroring the badge logic.
    if (entryPriceRef.current != null && Number.isFinite(entryPriceRef.current) && seriesRef.current) {
      const entryCoord = seriesRef.current.priceToCoordinate(entryPriceRef.current);
      setEntryY(entryCoord ?? null);
    } else {
      setEntryY(null);
    }

    const currentPriceLabels = buildPriceLabels(currentData);
    const ys = currentPriceLabels.map((price) => seriesRef.current!.priceToCoordinate(price) ?? -9999);
    setLabelYs(ys);
  }, []);

  // Store updatePositions in ref for stable reference
  useEffect(() => {
    updatePositionsRef.current = updatePositions;
  }, [updatePositions]);

  // Batched chart data update with requestAnimationFrame
  useEffect(() => {
    if (!seriesRef.current) return;

    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (!seriesRef.current) return;

      const currentMode = chartModeRef.current;
      const chartData = currentMode === "line"
        ? data.map((point) => ({
            time: point.time as UTCTimestamp,
            value: point.value,
          }))
        : toCandlestickData(data);

      seriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();

      // Notify the parent of the latest live price.
      const latest = data[data.length - 1]?.value;
      if (Number.isFinite(latest) && onPriceUpdateRef.current) {
        onPriceUpdateRef.current(latest as number);
      }

      if (updatePositionsRef.current) {
        updatePositionsRef.current();
      }
      
      rafIdRef.current = null;
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [data]);

  // Draw / redraw the entry-price marker line whenever the entryPrice prop changes.
  useEffect(() => {
    // Keep the ref in sync so updatePositions can read the current value.
    entryPriceRef.current = entryPrice ?? null;

    // Remove any existing line first. seriesRef.current may already be null
    // (e.g. the chart unmounted while a marker was set), so guard the removal.
    if (entryPriceLineRef.current) {
      try {
        seriesRef.current?.removePriceLine(entryPriceLineRef.current);
      } catch {
        // Series already disposed; nothing to remove.
      }
      entryPriceLineRef.current = null;
    }

    const series = seriesRef.current;
    if (series && entryPrice != null && Number.isFinite(entryPrice)) {
      entryPriceLineRef.current = series.createPriceLine({
        price: entryPrice,
        color: "#FACC15",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: "",
      });
    }

    // Reposition the marker label immediately.
    updatePositionsRef.current?.();
  }, [entryPrice]);

  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    // Debounced resize handler
    const handleResize = () => {
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = window.setTimeout(() => {
        if (!chartRef.current || !chartContainerRef.current) return;
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
        if (updatePositionsRef.current) {
          requestAnimationFrame(updatePositionsRef.current);
        }
        resizeTimeoutRef.current = null;
      }, 100); // 100ms debounce
    };

    // Use ref-based callback for stable subscription
    const stableUpdatePositions = () => {
      if (updatePositionsRef.current) {
        updatePositionsRef.current();
      }
    };

    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(stableUpdatePositions);
    window.addEventListener("resize", handleResize);

    return () => {
      chartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(stableUpdatePositions);
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current !== null) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  const loadInitialPrices = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const prices = await priceApi.getPriceSeries();
      setData(prices);
      setLastUpdatedAt(new Date());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load price data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload data when asset changes — reset and load mock/API data
  useEffect(() => {
    const timer = setTimeout(() => {
      setData([]);
      setIsLoading(true);
      setLoadError(null);

      // Use mock data directly for instant visual feedback per asset
      const mockData = mockPriceData[asset];
      if (mockData && mockData.length > 0) {
        setData(mockData);
        setLastUpdatedAt(new Date());
        setIsLoading(false);
      }

      // Also attempt to fetch live data from API
      void loadInitialPrices();
    }, 0);
    return () => clearTimeout(timer);
  }, [asset, loadInitialPrices]);

  // Update chart line color when asset changes
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({ color: lineColor });
  }, [lineColor]);

  useEffect(() => {
    // Connect to socket only once when component mounts
    socketService.connect();
    
    const unsubscribe = socketService.onPriceUpdate((payload: unknown) => {
      const incomingPoints = extractPricePoints(payload);
      if (incomingPoints.length === 0) return;

      // Throttle socket updates to prevent excessive setData calls
      pendingDataRef.current = [...pendingDataRef.current, ...incomingPoints];

      if (socketUpdateTimeoutRef.current !== null) {
        return; // Already pending, just accumulate data
      }

      socketUpdateTimeoutRef.current = window.setTimeout(() => {
        const pending = pendingDataRef.current;
        pendingDataRef.current = [];
        socketUpdateTimeoutRef.current = null;

        const merged = mergePricePoints(dataRef.current, pending);
        if (merged === dataRef.current) return;

        setData(merged);
        setLoadError(null);
        setLastUpdatedAt(new Date());
      }, 50); // 50ms throttle - batch rapid updates
    });

    return () => {
      unsubscribe();
      if (socketUpdateTimeoutRef.current !== null) {
        clearTimeout(socketUpdateTimeoutRef.current);
      }
      // Note: Don't disconnect socket here as other components may be using it
    };
  }, []); // Empty dependency array ensures this runs only once

  const toggleChartMode = useCallback(() => {
    setChartMode((prev) => {
      const next: ChartMode = prev === "line" ? "candlestick" : "line";
      persistChartMode(next);
      return next;
    });
  }, []);

  const { isConnected } = useConnectionStatus();

  const bgGradient = ASSET_BG[asset] ?? ASSET_BG.XLM;
  const borderColor = asset === "BTC" ? "#F7931A" : asset === "ETH" ? "#627EEA" : "#1e3a5f";

  return (
    <div className="w-full h-full flex flex-col">
      <PanelHeader
        className="mb-4 px-2"
        icon={
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: bgGradient }}
          >
            <span className="text-white text-xs font-bold">{asset}</span>
          </div>
        }
        title={`${asset}/USD`}
        status={isConnected ? { label: "LIVE", variant: "success" } : { label: "OFFLINE", variant: "default" }}
        action={
          <div className="flex items-center gap-3">
            {/* Chart mode toggle */}
            <button
              type="button"
              onClick={toggleChartMode}
              className="relative flex items-center rounded-full bg-[#1e3a5f]/60 p-0.5 text-xs font-medium transition-colors hover:bg-[#1e3a5f]/80"
              title={chartMode === "line" ? "Switch to candlestick chart" : "Switch to line chart"}
              aria-label={chartMode === "line" ? "Switch to candlestick chart" : "Switch to line chart"}
            >
              <span
                className={`px-2.5 py-1 rounded-full transition-all duration-200 ${chartMode === "line" ? "bg-white text-[#0a1929] shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline-block mr-1">
                  <path d="M1 13L4 8L7 10L10 3L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Line
              </span>
              <span
                className={`px-2.5 py-1 rounded-full transition-all duration-200 ${chartMode === "candlestick" ? "bg-white text-[#0a1929] shadow-sm" : "text-white/70 hover:text-white"}`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline-block mr-1">
                  <rect x="2" y="5" width="3" height="7" rx="0.5" fill="currentColor"/>
                  <line x1="3.5" y1="3" x2="3.5" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="3.5" y1="12" x2="3.5" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  <rect x="7" y="2" width="3" height="6" rx="0.5" fill="currentColor"/>
                  <line x1="8.5" y1="1" x2="8.5" y2="2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="8.5" y1="8" x2="8.5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  <rect x="12" y="4" width="3" height="8" rx="0.5" fill="currentColor"/>
                  <line x1="13.5" y1="2" x2="13.5" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="13.5" y1="12" x2="13.5" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                Candle
              </span>
            </button>
            {!isConnected && <ConnectionStatus />}
            <span className={`text-sm font-semibold tabular-nums ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        }
      />

      {/* Chart area wrapper with padded border */}
      <div className="relative w-full flex-1 rounded-2xl border-[3px]" style={{ minHeight: height, borderColor, background: bgGradient }}>

        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner">
          {/* Montañas (imagen de fondo) */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/chart-bg.png')",
              backgroundPosition: "center 38%",
            }}
          />
          {/* Overlay azul marino suave para que se vean más las montañas */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(30, 58, 95, 0.45) 0%, rgba(19, 39, 79, 0.5) 50%, rgba(10, 25, 41, 0.55) 100%)",
            }}
          />
          {/* Price-tick flash overlay — flashes green/red briefly when the last price moves */}
          <div
            ref={flashOverlayRef}
            data-testid="price-flash"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 rounded-xl"
            style={{ opacity: 0 }}
          />
          {/* Chart — leaves space on the right so line terminates exactly at the badge */}
          <div 
            ref={chartContainerRef} 
            className="absolute inset-y-0 left-0 right-[105px]" 
            role="img" 
            aria-label={`${asset} Price Chart`} 
          />

          {/* Custom price labels on the right */}
          <div className="pointer-events-none absolute top-0 right-0 h-full w-[105px] flex flex-col">
            {priceLabels.map((price, i) => {
              const y = labelYs[i];
              if (y === undefined || y < 0 || y > height) return null;
              const isBadgePrice = Math.abs(price - latestPrice) < 0.000001;
              return (
                <div
                  key={`${price}-${i}`}
                  className="absolute right-2 tabular-nums whitespace-nowrap"
                  style={{
                    top: y,
                    transform: "translateY(-50%)",
                    fontSize: "11px",
                    color: isBadgePrice ? "#fff" : "rgba(255,255,255,0.9)",
                    fontWeight: isBadgePrice ? "700" : "500",
                  }}
                >
                  {price.toFixed(6)}
                </div>
              );
            })}
          </div>

          {/* Price dot and badge at the last point exactly on the boundary */}
          {badgeY !== null && hasData && (
            <div
              className="pointer-events-none absolute z-20 flex items-center transition-all duration-300"
              style={{
                right: "4px",
                width: "101px",
                top: badgeY,
                transform: "translateY(calc(-50% + 3px)) scale(0.96)",
                transformOrigin: "left center",
              }}
            >
              {/* Connecting dot exactly at the chart's right edge */}
              <div
                className="w-2.5 h-2.5 bg-white rounded-full absolute shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{ left: "-5px" }}
              />
              {/* The badge box */}
              <div
                ref={flashBadgeRef}
                className="font-bold text-xs px-2 py-1 rounded shadow-sm tabular-nums whitespace-nowrap relative"
                style={{
                  background: "rgba(255,255,255,0.98)",
                  color: "#0a1929",
                  marginLeft: "8px",
                }}
              >
                ${latestPrice.toFixed(6)}
              </div>
            </div>
          )}

          {/* Entry-price marker label, aligned with the dashed price line */}
          {entryY !== null && entryPrice != null && (
            <div
              className="pointer-events-none absolute z-10 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold whitespace-nowrap"
              style={{
                left: "8px",
                top: entryY,
                transform: "translateY(-50%)",
                background: "rgba(250,204,21,0.95)",
                color: "#0a1929",
              }}
            >
              Entry ${entryPrice.toFixed(6)}
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center bg-[#0a1929]/90 backdrop-blur-sm rounded-xl">
              <LoadingState
                message="Loading live price data..."
                variant="skeleton"
                skeletonLines={5}
                dark={true}
                className="max-w-md w-full"
              />
            </div>
          )}
          {loadError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center rounded-xl">
              <ErrorState
                message={loadError}
                onRetry={loadInitialPrices}
                variant="dark"
                title="Failed to load prices"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 px-2 text-xs text-gray-400 dark:text-gray-500">
        <span>Last update: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "Waiting for live data"}</span>
        <span>Live market feed</span>
      </div>

      {/* Visually hidden aria-live region for price announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  );
};

export default PriceChart;
