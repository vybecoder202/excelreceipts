const SCALE = 100n;

export function parseMoneyToMinorUnits(value: string | number | undefined): bigint {
  if (value === undefined || value === "") {
    return 0n;
  }

  const normalized = String(value).replace(/[^\d.-]/g, "");
  if (!normalized || normalized === "-" || normalized === ".") {
    return 0n;
  }

  const sign = normalized.startsWith("-") ? -1n : 1n;
  const unsigned = normalized.replace("-", "");
  const [wholePart, decimalPart = ""] = unsigned.split(".");
  const whole = BigInt(wholePart || "0") * SCALE;
  const decimal = BigInt((decimalPart + "00").slice(0, 2));
  return sign * (whole + decimal);
}

export function formatMinorUnits(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const whole = absolute / SCALE;
  const cents = absolute % SCALE;
  return `${sign}${whole}.${String(cents).padStart(2, "0")}`;
}
