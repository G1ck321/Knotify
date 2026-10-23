// Shared fictional demo data for the "Use sample account" test flow
// (PR #5 test plan). Both values are sequential-gag placeholders in
// Nigerian 11-digit format — NOT real people:
//   08012345678 — ascending sequence (standard placeholder pattern)
//   08098765432 — descending sequence
// Centralized here so PII/secret scanners have one documented location to
// allowlist (no scanner config exists in this repo; add the allowlist entry
// in the external tool's config pointing at this file). Safe to commit —
// never replace these with a real phone number.
//

/** Fictional sample phone number (demo data only, not a real person). */
export const SAMPLE_PHONE = '08012345678';

/** Fictional sample parent/guardian phone number (demo data only). */
export const SAMPLE_PARENTS_PHONE = '08098765432';
