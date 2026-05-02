import { describe, expect, it } from "vitest";
import {
  applyDeduction,
  amountDuePaise,
  computeFineGoldG,
  computeOldGoldExchange,
  exchangeValuePaiseFromNetAndRate,
} from "./oldGoldExchange";

describe("computeFineGoldG", () => {
  it("uses karat/24 when no assay", () => {
    expect(computeFineGoldG({ weightG: 10, karat: 22, testedPurityPercent: null })).toBeCloseTo((10 * 22) / 24, 10);
  });

  it("uses assay % when provided", () => {
    expect(computeFineGoldG({ weightG: 10, karat: 22, testedPurityPercent: 91.2 })).toBeCloseTo(9.12, 10);
  });
});

describe("deduction and value", () => {
  it("matches example: 10g 22K, 2% deduction, ₹6000/g", () => {
    const fine = computeFineGoldG({ weightG: 10, karat: 22, testedPurityPercent: null });
    expect(fine).toBeCloseTo(9.1666666667, 6);
    const net = applyDeduction(fine, 2);
    expect(net).toBeCloseTo(8.9833333333, 4);
    const paise = exchangeValuePaiseFromNetAndRate(net, 6000);
    expect(paise).toBe(5_390_000);
  });

  it("computeOldGoldExchange bundles result", () => {
    const r = computeOldGoldExchange({
      weightG: 10,
      karat: 22,
      testedPurityPercent: null,
      rateRupeesPerGram: 6000,
      deductionPercent: 2,
    });
    expect(r.exchangeValuePaise).toBe(5_390_000);
  });
});

describe("amountDuePaise", () => {
  it("caps at zero", () => {
    expect(amountDuePaise(1000_00, 2000_00)).toBe(0);
  });
  it("subtracts credit", () => {
    expect(amountDuePaise(100_00, 30_00)).toBe(70_00);
  });
});
