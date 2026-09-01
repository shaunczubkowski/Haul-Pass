# A Gauge Mark is a subtype of Indicated Level, not a variant of it

ADR-0001 established that a Gauge Photo returns a continuous Indicated Level rather
than snapping to one of the nine marks, and left open whether the type should widen
or split. It splits: `GaugeMark` stays the union of nine literals, `IndicatedLevel`
is any level a gauge can indicate, and `GaugeMark` is assignable to `IndicatedLevel`.
`CalculatorInput.pickupLevel` and `.currentLevel` both take the wider type.

This is `CONTEXT.md`'s claim written as types — *a Gauge Mark is one possible
Indicated Level, not a separate kind of thing.*

## Considered Options

Widening `GaugeLevel` to `number` outright was cheaper but would have made
`GAUGE_LEVEL_LABELS` a `Record<number, string>`, which asserts a label exists for
0.37. Labels only ever key off marks, and the split keeps that sound for free.

A discriminated union — `{ kind: "mark" } | { kind: "camera", confidence }` — was the
safer-looking option, since it makes it impossible to read a confidence off a level a
person entered by hand. We rejected it because it contradicts the glossary: it models
the two as sibling variants, when the domain says one is an instance of the other.
Every consumer would also have to unwrap, including `calculator.ts`, which today just
multiplies the level by `tankCapacity`. Read Confidence will ride alongside the level
when #18 needs it, not inside it.

## Consequences

The nine literals no longer constrain what reaches `calculateFuelReturn`, so it
guards its own inputs: a level outside 0–1 is clamped, and `NaN` throws. These are
different failures. An out-of-range level still carries intent — a vision model
reporting 1.02 saw a full tank — while `NaN` carries none, and clamping it to 0 would
tell a renter their tank is empty and to buy a full tank of fuel. That is the worst
wrong answer this app can give, so it is the one we refuse to give quietly.

`page.tsx` calls `calculateFuelReturn` during render, which makes that throw a render
crash. Nothing can reach it today — page state is `GaugeMark`, and a URL parameter is
parsed with `parseFloat` and then tested against the nine, a test `NaN` fails. **#18
introduces the first caller that can produce `NaN`, and must validate the vision
response before calling rather than relying on the calculator to be safe.**

The constant `GAUGE_LEVELS` and its labels keep their names. Only the type was
renamed, because only the type sat next to `IndicatedLevel` where the two words had
to be told apart.
