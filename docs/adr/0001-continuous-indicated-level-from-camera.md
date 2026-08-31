# Camera reads return a continuous Indicated Level with confidence

The manual control asks a renter to pick one of nine Gauge Marks, so the obvious
choice for #18 was to have the vision model pick one too, making a Gauge Photo a
drop-in replacement for manual entry. We chose instead to return a continuous
Indicated Level between 0 and 1 together with a Read Confidence, because a
photographed needle usually rests *between* marks and snapping it to the nearest one
discards the very information that tells us how much to hedge.

## Consequences

`GaugeLevel` is a union of nine literal values and cannot represent a camera read.
The type has to widen, or split, before #18 can land — this is not a change confined
to the camera feature.

Read Confidence feeds an Uncertainty Allowance that is *added* to the renter's chosen
Risk Tolerance, so the Safety Buffer applied can exceed the one the renter picked.
The UI has to say so; a silently larger buffer would make the Risk Tolerance control
a lie.

Below a confidence floor a read is refused outright rather than heavily padded, on
the grounds that a renter cannot distinguish a padded guess from a confident reading.
The floor's value is deliberately not set here: it is an empirical question, and #113
exists to collect the photo corpus that answers it.
