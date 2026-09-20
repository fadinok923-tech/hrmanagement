export const VISA_TYPES = ["COMPANY VISA", "SAUDI NATIONAL", "EXTERNAL VISA"] as const;

// Keep existing custom values until the user explicitly replaces them.
export function normalizeVisaType(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return VISA_TYPES.find((type) => type === trimmed.toUpperCase()) ?? trimmed;
}

export function normalizeEmployeeChoice(value: string | null | undefined): string | null {
  return value?.trim().toLowerCase() || null;
}
