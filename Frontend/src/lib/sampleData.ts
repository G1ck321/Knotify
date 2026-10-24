// Shared fictional demo data for the "Use sample account" test flow
// (PR #5 test plan). Both values are the single obviously-fake placeholder
// `0123456789` — NOT real people:
// it is 10 digits, so it does not even match the PII scanner's 11-digit
// `0[0-9]{10}` phone pattern.
// Centralized here so PII/secret scanners have one documented location to
// allowlist (no scanner config exists in this repo; add the allowlist entry
// in the external tool's config pointing at this file). Safe to commit —
// never replace these with a real phone number.
//

/** Fictional sample phone number (demo data only, not a real person). */
export const SAMPLE_PHONE = '0123456789';

/** Fictional sample parent/guardian phone number (demo data only). */
export const SAMPLE_PARENTS_PHONE = '0123456789';
