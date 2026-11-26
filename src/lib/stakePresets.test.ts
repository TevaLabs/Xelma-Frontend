import { describe, expect, it } from "vitest";
import { STAKE_PRESETS, fromStroops, isClamped, presetAmount, spendable, toStroops } from "./stakePresets";

const preset = (id: string) => STAKE_PRESETS.find((p) => p.id === id)!;

describe("stake presets", () => {
  it("fills fixed presets when the balance covers them", () => {
    expect(presetAmount(preset("p50"), "200")).toBe("50");
  });

  it("clamps fixed presets to the balance", () => {
    expect(presetAmount(preset("p100"), "42.5")).toBe("42.5");
    expect(isClamped(preset("p100"), "42.5")).toBe(true);
    expect(isClamped(preset("p10"), "42.5")).toBe(false);
  });

  it("MAX is the full spendable balance, minus any reserve", () => {
    expect(presetAmount(preset("max"), "100")).toBe("100");
    expect(presetAmount(preset("max"), "100", "1.5")).toBe("98.5");
  });

  it("never goes negative", () => {
    expect(spendable("1", "5")).toBe(0n);
    expect(presetAmount(preset("max"), "0.5", "1")).toBe("0");
  });

  it("handles invalid or missing balances as zero", () => {
    expect(toStroops("abc")).toBe(0n);
    expect(toStroops(null)).toBe(0n);
    expect(presetAmount(preset("p10"), null)).toBe("0");
  });

  it("stays exact for huge balances", () => {
    expect(fromStroops(toStroops("900000000.1234567"))).toBe("900000000.1234567");
  });
});
