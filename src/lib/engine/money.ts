/**
 * Money and quantity helpers.
 *
 * All money is held as integer paise (₹1 = 100 paise). Quantities are held as
 * integer "milli-units" (1 unit = 1000) so that 12.5 kg or a price per 0.5 m
 * stay exact. Division always happens once, at the end, using BigInt with
 * round-half-up — never with floating point.
 */

export type Paise = number;
/** Quantity × 1000, always an integer. */
export type Milli = number;

export const QTY_SCALE = 1000;

/** Integer division of non-negative or negative BigInts, rounding half away from zero. */
export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Division by zero");
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = (n * 2n + d) / (2n * d);
  return negative ? -q : q;
}

/** Integer division rounding up (ceiling), for positive values. */
export function divCeil(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n || numerator < 0n) throw new Error("divCeil expects non-negative numerator and positive denominator");
  return (numerator + denominator - 1n) / denominator;
}

export function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error("Amount too large to represent safely");
  }
  return Number(value);
}

/** Convert a quantity like 12.5 to milli-units (12500). Rejects more than 3 decimals. */
export function toMilli(qty: number): Milli {
  if (!Number.isFinite(qty)) throw new Error("Quantity must be a finite number");
  const scaled = qty * QTY_SCALE;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > 1e-6) {
    throw new Error(`Quantity ${qty} has more than 3 decimal places`);
  }
  return rounded;
}

export function hasAtMost3Decimals(qty: number): boolean {
  try {
    toMilli(qty);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse a rupee amount typed by a person ("19.50", "1,81,000", "₹ 6,000/-")
 * into paise. Uses string arithmetic, so no floating-point drift.
 */
export function rupeesToPaise(input: string | number): Paise {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) throw new Error("Amount must be a finite number");
    return rupeesToPaise(input.toFixed(2));
  }
  const cleaned = input
    .replace(/₹|rs\.?|inr|\/-|\s|,/gi, "")
    .trim();
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) throw new Error(`"${input}" is not a valid rupee amount`);
  const [, sign, whole, frac = ""] = match;
  const paise = BigInt(whole) * 100n + BigInt(frac.padEnd(2, "0"));
  return toSafeNumber(sign ? -paise : paise);
}

/** Group digits the Indian way: 1234567 → "12,34,567". */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
}

/** 18100000 paise → "₹1,81,000.00". */
export function formatINR(paise: Paise | bigint, opts: { symbol?: boolean } = {}): string {
  const { symbol = true } = opts;
  const value = typeof paise === "bigint" ? paise : BigInt(Math.round(paise));
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const rupees = abs / 100n;
  const rem = abs % 100n;
  const body = `${groupIndian(rupees.toString())}.${rem.toString().padStart(2, "0")}`;
  return `${negative ? "-" : ""}${symbol ? "₹" : ""}${body}`;
}

/** 10000000 milli → "10,000"; 12500 milli → "12.5". */
export function formatQty(milli: Milli): string {
  const negative = milli < 0;
  const abs = Math.abs(milli);
  const whole = Math.floor(abs / QTY_SCALE);
  const frac = abs % QTY_SCALE;
  const fracStr = frac ? `.${frac.toString().padStart(3, "0").replace(/0+$/, "")}` : "";
  return `${negative ? "-" : ""}${groupIndian(whole.toString())}${fracStr}`;
}
