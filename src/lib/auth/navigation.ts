export function safeNextPath(value: string | null | undefined, fallback = "/") {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\r\n]/.test(value)
    ? value
    : fallback;
}
