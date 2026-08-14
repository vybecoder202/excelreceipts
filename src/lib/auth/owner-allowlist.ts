export function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function parseOwnerEmailAllowlist(value: string | null | undefined) {
  if (!value) return [];

  return [...new Set(value.split(/[;,\n]/).map(normalizeEmail).filter(Boolean))];
}

export function isOwnerEmailAllowlisted(
  email: string | null | undefined,
  configuredAllowlist: string | null | undefined,
) {
  const normalizedEmail = normalizeEmail(email);
  return (
    normalizedEmail.length > 0 &&
    parseOwnerEmailAllowlist(configuredAllowlist).includes(normalizedEmail)
  );
}
