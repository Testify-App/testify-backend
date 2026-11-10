// Admin contact-detail rules shared by staff invites/edits and the self-service profile.
// Kept pure so scripts can reuse them.

export const INVALID_PHONE_MESSAGE = 'Enter a valid phone number.';
export const PHONE_IN_USE_MESSAGE = 'Phone number already in use.';

/**
 * International numbers: an optional leading +, then 7 to 15 digits. Spaces, dashes, dots and
 * brackets are ignored. Returns the stored form ("+2348012345678" or "08012345678"), or null
 * when the input is not a valid phone number.
 */
export const normalisePhoneNumber = (input: string): string | null => {
  const value = `${input}`.trim();
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;
  const compact = value.replace(/[\s().-]/g, '');
  const digits = compact.replace(/^\+/, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return compact;
};

/**
 * Title-cases a person's name: trims, collapses inner whitespace, lowercases, then capitalises
 * the first letter of each word and of each part after a hyphen or apostrophe.
 * "ADA o'brien-okafor" -> "Ada O'Brien-Okafor".
 */
export const titleCaseName = (input: string): string => `${input}`
  .trim()
  .replace(/\s+/g, ' ')
  .toLowerCase()
  .replace(/(^|[\s\-'’])(\p{L})/gu, (_match, boundary: string, letter: string) => boundary + letter.toUpperCase());

export type PhoneInput = string | null | undefined;

/**
 * Resolves an optional phone field from a request body.
 * - undefined -> { provided: false } (leave unchanged / none)
 * - '' / null / whitespace -> { provided: true, value: null } (clear)
 * - otherwise -> normalised value, or { error } when invalid
 */
export const resolvePhoneInput = (
  input: PhoneInput,
): { provided: boolean; value: string | null; error?: string } => {
  if (input === undefined) return { provided: false, value: null };
  if (input === null || `${input}`.trim() === '') return { provided: true, value: null };
  const normalised = normalisePhoneNumber(input);
  if (!normalised) return { provided: true, value: null, error: INVALID_PHONE_MESSAGE };
  return { provided: true, value: normalised };
};

// $1 = normalised phone, $2 = admin id to exclude (or null). Deleted admins are ignored.
export const FIND_ADMIN_BY_PHONE_QUERY = `
  SELECT id FROM admins
  WHERE deleted_at IS NULL
    AND id IS DISTINCT FROM $2
    AND phone_number = $1
  LIMIT 1;
`;

// Postgres unique_violation on the admins phone column.
export const isPhoneUniqueViolation = (error: any): boolean => (
  error?.code === '23505' && `${error?.constraint ?? ''}`.includes('phone_number')
);
