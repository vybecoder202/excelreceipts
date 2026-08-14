const DECIMAL_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;

export function parseMinorUnits(value: string, fractionDigits = 2): bigint {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) {
    throw new RangeError("Fraction digits must be an integer between 0 and 6.");
  }

  const normalized = value.trim();
  const match = DECIMAL_PATTERN.exec(normalized);
  if (!match) throw new Error("Money value must be a plain decimal number.");

  const [, sign, whole = "0", fraction = ""] = match;
  if (fraction.length > fractionDigits) {
    throw new Error(`Money value has more than ${fractionDigits} decimal places.`);
  }

  const scale = 10n ** BigInt(fractionDigits);
  const magnitude = BigInt(whole) * scale + BigInt(fraction.padEnd(fractionDigits, "0") || "0");

  return sign === "-" ? -magnitude : magnitude;
}

export function formatMinorUnits(value: bigint, fractionDigits = 2): string {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) {
    throw new RangeError("Fraction digits must be an integer between 0 and 6.");
  }

  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const scale = 10n ** BigInt(fractionDigits);
  const whole = magnitude / scale;
  const fraction = magnitude % scale;
  const sign = negative ? "-" : "";

  if (fractionDigits === 0) return `${sign}${whole}`;
  return `${sign}${whole}.${fraction.toString().padStart(fractionDigits, "0")}`;
}
