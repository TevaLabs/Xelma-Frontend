import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "../lib/utils";
import type { Asset } from "../types/asset";
import { ASSETS, ASSET_META } from "../constants/assets";

interface AssetTabsProps {
  /** Optional callback when asset changes */
  onAssetChange?: (asset: Asset) => void;
  className?: string;
}

export function AssetTabs({ onAssetChange, className }: AssetTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeAsset = (searchParams.get("asset") as Asset) || "XLM";

  // Normalize invalid asset values to XLM
  const normalizedAsset = ASSETS.includes(activeAsset) ? activeAsset : "XLM";

  const tabListRef = useRef<HTMLDivElement>(null);

  // Keep a ref for the callback to avoid stale closure issues
  const onAssetChangeRef = useRef(onAssetChange);
  useEffect(() => {
    onAssetChangeRef.current = onAssetChange;
  }, [onAssetChange]);

  const setAsset = useCallback(
    (asset: Asset) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("asset", asset);
          return next;
        },
        { replace: true },
      );
      onAssetChangeRef.current?.(asset);
    },
    [setSearchParams],
  );

  // Normalize on mount if needed
  useEffect(() => {
    if (activeAsset !== normalizedAsset) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("asset", normalizedAsset);
          return next;
        },
        { replace: true },
      );
    }
  }, [activeAsset, normalizedAsset, setSearchParams]);

  // Focus management for keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;

    switch (e.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % ASSETS.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + ASSETS.length) % ASSETS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = ASSETS.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const targetAsset = ASSETS[nextIndex];
    setAsset(targetAsset);

    // Focus the new tab button
    const tabButtons = tabListRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    tabButtons?.[nextIndex]?.focus();
  };

  return (
    <div
      className={cn("w-full", className)}
      role="region"
      aria-label="Select trading asset"
    >
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Available assets"
        className="inline-flex rounded-xl bg-[#111827]/80 p-1.5 backdrop-blur-sm border border-white/10"
      >
        {ASSETS.map((asset, index) => {
          const isActive = normalizedAsset === asset;
          const meta = ASSET_META[asset];

          return (
            <button
              key={asset}
              role="tab"
              id={`asset-tab-${asset}`}
              aria-selected={isActive}
              aria-controls={`asset-panel-${asset}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setAsset(asset)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]",
                isActive
                  ? "bg-gradient-to-r from-[#2C4BFD] to-[#1E3FD4] text-white shadow-lg shadow-[#2C4BFD]/25"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              )}
            >
              {/* Active indicator glow */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-lg opacity-20 blur-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, #2C4BFD 0%, #06B6D4 100%)",
                  }}
                  aria-hidden="true"
                />
              )}

              <span
                className={cn(
                  "relative z-10 text-base leading-none",
                  isActive ? "text-white" : meta.color,
                )}
                aria-hidden="true"
              >
                {meta.icon}
              </span>

              <span className="relative z-10">
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="sm:hidden">{asset}</span>
              </span>

              {isActive && (
                <span
                  className="relative z-10 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold leading-none text-white/90"
                  aria-label="Selected"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AssetTabs;
