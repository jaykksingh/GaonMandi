## Work package
WP-__ · <title>

## What changed
-

## Acceptance criteria
<!-- Copy the work package's acceptance list. Tick only what you verified, and cite the test name or output for each. -->
- [ ]

## Checks
- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] `pnpm test:rls` (if any table or policy changed)
- [ ] `pnpm contracts:gen --check` (if contracts changed)
- [ ] Mobile e2e flow run (if a mobile flow changed)

## Product rules
- [ ] Money in integer paise · weight in integer grams · timestamps in UTC
- [ ] Rules come from `packages/rules` only · golden fixture unchanged
- [ ] Private tables have forced RLS + a cross-user test
- [ ] No money movement · no exact seller location or phone number in responses (except the call endpoint) · no PII in logs · no secrets
- [ ] UI uses tokens and `packages/i18n` strings only

## Reviews
- spec review: <!-- verdict -->
- security review: <!-- verdict or n/a -->
- UI fidelity review: <!-- verdict or n/a -->

## Cross-package changes
<!-- Files changed outside this work package's owned paths, and why. -->
None

## Unverified or skipped
None

## Gate
<!-- G1/G2/G3/G4 or none -->
