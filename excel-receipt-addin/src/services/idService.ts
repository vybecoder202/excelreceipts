export function nextHumanId(prefix: string, existingIds: readonly string[], width = 6): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, "i");
  const highest = existingIds.reduce((max, id) => {
    const match = pattern.exec(id.trim());
    if (!match) {
      return max;
    }
    return Math.max(max, Number.parseInt(match[1], 10));
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(width, "0")}`;
}

export function nextDocumentId(existingIds: readonly string[]): string {
  return nextHumanId("DOC", existingIds);
}

export function nextExpenseId(existingIds: readonly string[]): string {
  return nextHumanId("EXP", existingIds);
}
