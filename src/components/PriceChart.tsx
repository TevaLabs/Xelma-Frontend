import React, { useState } from "react";
import {
  ResponsiveContainer,
  YAxis,
  Area,
  AreaChart,
  XAxis,
  Tooltip,
} from "recharts";

interface PriceDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

interface PriceChartProps {
  currentPrice?: number;
  percentChange?: number;
  isPositive?: boolean;
  logoUrl?: string;
}

type TimeRange = "Hour" | "Minutes" | "Today";

// Generate realistic mock data based on time range
const generateMockData = (
  timeRange: TimeRange,
  currentPrice: number,
): PriceDataPoint[] => {
  const now = Date.now();
  const data: PriceDataPoint[] = [];

  let points: number;
  let timeInterval: number; // in milliseconds
  let volatilityFactor: number;

  switch (timeRange) {
    case "Minutes":
      points = 30; // Last 30 minutes
      timeInterval = 60 * 1000; // 1 minute
      volatilityFactor = 0.002; // 0.2% volatility
      break;
    case "Hour":
      points = 60; // Last 60 minutes
      timeInterval = 60 * 1000; // 1 minute
      volatilityFactor = 0.003; // 0.3% volatility
      break;
    case "Today":
      points = 24; // Last 24 hours
      timeInterval = 60 * 60 * 1000; // 1 hour
      volatilityFactor = 0.005; // 0.5% volatility
      break;
    default:
      points = 30;
      timeInterval = 60 * 1000;
      volatilityFactor = 0.002;
  }

  // Generate price movement with trend and volatility
  const startPrice = currentPrice * 0.95; // Start 5% lower
  const priceChange = currentPrice - startPrice;

  for (let i = 0; i < points; i++) {
    const timestamp = now - (points - i - 1) * timeInterval;
    const progress = i / (points - 1);

    // Combine trend with random walk
    const trendPrice = startPrice + priceChange * progress;
    const randomWalk =
      (Math.random() - 0.5) * 2 * volatilityFactor * currentPrice;
    const noise = Math.sin(i * 0.3) * volatilityFactor * currentPrice * 0.5;

    const price = trendPrice + randomWalk + noise;

    // Format time based on range
    let timeLabel: string;
    const date = new Date(timestamp);

    if (timeRange === "Today") {
      timeLabel = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
    } else if (timeRange === "Hour") {
      timeLabel = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } else {
      timeLabel = date.toLocaleTimeString("en-US", {
        minute: "2-digit",
        second: "2-digit",
      });
    }

    data.push({
      time: timeLabel,
      price: Math.max(price, 0), // Ensure positive prices
      timestamp,
    });
  }

  return data;
};

// Custom tooltip component
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: PriceDataPoint;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-500 mb-1">{payload[0].payload.time}</p>
        <p className="text-sm font-semibold text-gray-900">
          ${payload[0].value.toFixed(4)}
        </p>
      </div>
    );
  }
  return null;
};

export default function PriceChart({
  currentPrice = 0.22,
  percentChange = 85,
  isPositive = true,
  logoUrl = "/stellar-logo.png",
}: PriceChartProps) {
  const [activeTab, setActiveTab] = useState<TimeRange>("Minutes");

  // Generate chart data directly from state - no useEffect needed
  const chartData = generateMockData(activeTab, currentPrice);

  const tabs: TimeRange[] = ["Hour", "Minutes", "Today"];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Main Card with rounded border */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {/* Stellar Logo */}
            <img
              src={logoUrl}
              alt="XLM Logo"
              className="w-10 h-10 rounded-full shrink-0"
            />

            {/* Token Info */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-medium text-gray-900">XLM</span>
              <span
                className={`text-sm font-medium flex items-center gap-0.5 ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {/* Arrow indicator */}
                {isPositive ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="mb-0.5"
                  >
                    <path
                      d="M6 2L10 6L8.5 6L6 3.5L3.5 6L2 6L6 2Z"
                      fill="currentColor"
                    />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="mt-0.5"
                  >
                    <path
                      d="M6 10L2 6L3.5 6L6 8.5L8.5 6L10 6L6 10Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
                {percentChange}%
              </span>
            </div>
          </div>

          {/* Time Range Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-1.5 rounded-md text-sm font-normal transition-all ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Current Price - Under the logo */}
        <div className="mb-6">
          <div className="text-6xl font-light text-gray-900 tracking-tight">
            ${currentPrice.toFixed(4)}
          </div>
        </div>

        {/* Chart with light blue fill */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2C4BFD" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2C4BFD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 12 }}
                interval={
                  activeTab === "Today" ? 3 : activeTab === "Hour" ? 9 : 4
                }
              />
              <YAxis hide domain={["dataMin - 0.005", "dataMax + 0.005"]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#2C4BFD"
                strokeWidth={2.5}
                fill="url(#colorPrice)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Footer - With white background */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="font-semibold text-gray-900 whitespace-nowrap text-base">
            Stats:
          </span>
          <p className="text-sm text-gray-600 leading-relaxed">
            XLM has shown significant volatility in recent trading sessions. The
            current {isPositive ? "upward" : "downward"} trend of{" "}
            {percentChange}% reflects {isPositive ? "increased" : "decreased"}{" "}
            market confidence. Price movements remain sensitive to broader
            crypto market sentiment and Stellar network developments.
          </p>
        </div>
      </div>
    </div>
  );
}
