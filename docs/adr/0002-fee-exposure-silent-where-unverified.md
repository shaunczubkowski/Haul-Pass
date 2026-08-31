# Fee Exposure is silent for companies whose Fee Threshold is unverified

FillRight covers four rental companies but shipped a single `UHAUL_FEE_THRESHOLD`,
applying U-Haul's published quarter-tank rule to Penske, Budget and Enterprise
renters alike. A Fee Threshold is a term of someone else's contract, not a FillRight
judgement, so we made it per-company data sourced from published terms — and where a
company's threshold has not been verified, no Fee Exposure is calculated and no
warning is shown.

## Considered Options

Falling back to the quarter-tank rule wherever a policy is unknown would keep a
warning on screen for every renter. We rejected it: a warning citing the wrong
company's contract terms is worse than no warning, because it is stated with the same
confidence as a verified one.

## Consequences

Renters of a company with no verified threshold see gallons-to-add and no fee
warning. **This absence is deliberate.** It will look like a bug to anyone who finds
it without this note, and the fix is to verify that company's published policy — not
to reinstate a shared default.

This connects to #88, open since March because Enterprise publishes no per-truck
figures, and gives #111's fleet steward a second class of fact to keep honest.
