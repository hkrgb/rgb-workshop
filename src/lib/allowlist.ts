/** Only this Google account may use the vault. */
export const ALLOWED_EMAIL = "info@rgb-workshop.com";

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ALLOWED_EMAIL;
}
