import { describe, expect, it } from "vitest";
import { divRound, formatINR, formatQty, rupeesToPaise, toMilli } from "./money";

describe("formatINR (Indian digit grouping)", () => {
  it.each([
    [0, "₹0.00"],
    [5, "₹0.05"],
    [100, "₹1.00"],
    [99999, "₹999.99"],
    [100000, "₹1,000.00"],
    [8262712, "₹82,627.12"],
    [10000000, "₹1,00,000.00"],
    [18100000, "₹1,81,000.00"],
    [1234567890, "₹1,23,45,678.90"],
    [-50000, "-₹500.00"],
  ])("%i paise → %s", (paise, expected) => {
    expect(formatINR(paise)).toBe(expected);
  });

  it("can omit the symbol", () => {
    expect(formatINR(18100000, { symbol: false })).toBe("1,81,000.00");
  });
});

describe("rupeesToPaise", () => {
  it.each([
    ["19.50", 1950],
    ["17.2", 1720],
    ["1,81,000", 18100000],
    ["₹ 6,000/-", 600000],
    ["Rs. 18", 1800],
    ["0.05", 5],
  ])("%s → %i", (input, expected) => {
    expect(rupeesToPaise(input)).toBe(expected);
  });

  it("handles numbers without float drift", () => {
    expect(rupeesToPaise(17.2)).toBe(1720);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
  });

  it.each(["", "abc", "1.234", "12..5"])("rejects %j", (input) => {
    expect(() => rupeesToPaise(input)).toThrow();
  });
});

describe("rounding and quantities", () => {
  it("rounds half up", () => {
    expect(divRound(5n, 2n)).toBe(3n);
    expect(divRound(4n, 3n)).toBe(1n);
    expect(divRound(-5n, 2n)).toBe(-3n);
  });
  it("converts quantities to milli-units", () => {
    expect(toMilli(12.5)).toBe(12500);
    expect(toMilli(0.001)).toBe(1);
    expect(() => toMilli(0.0001)).toThrow();
  });
  it("formats quantities", () => {
    expect(formatQty(10000000)).toBe("10,000");
    expect(formatQty(12500)).toBe("12.5");
    expect(formatQty(1250000000)).toBe("12,50,000");
  });
});
