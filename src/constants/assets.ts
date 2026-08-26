import type { Asset } from "../types/asset";

export const ASSETS: Asset[] = ["BTC", "ETH", "XLM"];

export const ASSET_META: Record<Asset, { label: string; icon: string; color: string }> = {
  BTC: { label: "Bitcoin", icon: "₿", color: "text-amber-400" },
  ETH: { label: "Ethereum", icon: "Ξ", color: "text-indigo-400" },
  XLM: { label: "Stellar", icon: "✦", color: "text-cyan-400" },
};
