import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/supabase/config";
import { gstinState } from "@/lib/gst";
import { fieldErrors, friendlyAuthError, loginSchema, profileSchema, signupSchema } from "./schemas";

const goodSignup = {
  full_name: "Raghav Saxena",
  email: "  Raghav@GharGoods.example ",
  company_name: "Ghar Goods Pvt. Ltd.",
  password: "longenough",
  agree: "on",
};

const goodProfile = {
  company_name: "Ghar Goods Pvt. Ltd.",
  gst_registered: true,
  gstin: "06aapfs4721k1zu",
  business_type: "D2C brand",
  city: "Gurugram",
  usually_buys: ["Packaging"],
  cost_of_funds_pct: "12",
  default_priority: "balanced",
};

describe("sign-up validation", () => {
  it("accepts a valid sign-up and normalises the email", () => {
    const r = signupSchema.safeParse(goodSignup);
    expect(r.success && r.data.email).toBe("raghav@ghargoods.example");
  });
  it("rejects short passwords, bad email, missing terms", () => {
    const r = signupSchema.safeParse({ ...goodSignup, password: "short", email: "nope", agree: undefined });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrors(r.error)).sort()).toEqual(["agree", "email", "password"]);
  });
  it("login needs both fields", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("company profile validation", () => {
  it("normalises GSTIN and derives the state code", () => {
    const r = profileSchema.safeParse(goodProfile);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.gstin).toBe("06AAPFS4721K1ZU");
      expect(r.data.state_code).toBe("06");
      expect(r.data.cost_of_funds_pct).toBe(12);
    }
  });
  it("rejects a malformed GSTIN for a registered business", () => {
    const r = profileSchema.safeParse({ ...goodProfile, gstin: "06ABC" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).gstin).toContain("15 characters");
  });
  it("drops the GSTIN when not registered", () => {
    const r = profileSchema.safeParse({ ...goodProfile, gst_registered: false });
    expect(r.success && r.data.gstin).toBe(null);
  });
  it("rejects an out-of-range cost of funds", () => {
    expect(profileSchema.safeParse({ ...goodProfile, cost_of_funds_pct: "90" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...goodProfile, cost_of_funds_pct: "abc" }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("finds the state for a GSTIN", () => {
    expect(gstinState("07BHKPR2219M1ZX")).toBe("Delhi");
    expect(gstinState("99BHKPR2219M1ZX")).toBe(null);
  });
  it("only allows same-site redirects", () => {
    expect(safeNext("/onboarding")).toBe("/onboarding");
    expect(safeNext("https://evil.example")).toBe("/dashboard");
    expect(safeNext("//evil.example")).toBe("/dashboard");
    expect(safeNext("/\\evil.example")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
  it("explains auth errors plainly", () => {
    expect(friendlyAuthError("Invalid login credentials")).toContain("don't match");
    expect(friendlyAuthError("Email rate limit exceeded")).toContain("Too many");
  });
});
