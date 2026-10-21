import { describe, expect, it } from "vitest";
import { isPro, monthStartInIndia, nextResetLabel } from "./rules";

const now = new Date("2026-10-21T19:00:00Z"); // 22 Oct 00:30 IST

describe("isPro", () => {
  it("is false with no subscription", () => expect(isPro(null, now)).toBe(false));
  it("is true when active or past due", () => {
    expect(isPro({ status: "active", current_period_end: null }, now)).toBe(true);
    expect(isPro({ status: "past_due", current_period_end: null }, now)).toBe(true);
  });
  it("keeps Pro until the end of a cancelled, paid period", () => {
    expect(isPro({ status: "cancelled", current_period_end: "2026-11-01T00:00:00Z" }, now)).toBe(true);
    expect(isPro({ status: "cancelled", current_period_end: "2026-10-01T00:00:00Z" }, now)).toBe(false);
  });
  it("is false when pending, on hold or failed", () => {
    for (const status of ["pending", "on_hold", "failed", "paused"]) {
      expect(isPro({ status, current_period_end: "2027-01-01T00:00:00Z" }, now)).toBe(false);
    }
  });
});

describe("monthStartInIndia", () => {
  it("is midnight on the 1st in India", () => {
    expect(monthStartInIndia(now).toISOString()).toBe("2026-09-30T18:30:00.000Z");
  });
  it("uses the India date, not UTC, near midnight", () => {
    // 31 Oct 20:00 UTC is already 1 Nov in India.
    expect(monthStartInIndia(new Date("2026-10-31T20:00:00Z")).toISOString()).toBe("2026-10-31T18:30:00.000Z");
  });
  it("names the next reset date", () => {
    expect(nextResetLabel(now)).toBe("1 November");
  });
});
