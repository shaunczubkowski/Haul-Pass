# FillRight

FillRight tells someone returning a rental moving truck how many gallons to put in
before drop-off, so they hand it back at the fuel level their contract requires and
avoid a service fee. It exists because the gauges these trucks carry cannot be read
precisely, so the answer is always a hedge rather than a measurement.

## Language

### Fuel level

**Indicated Level**:
The fuel level a truck's gauge displays, as a fraction of a full tank between 0 and 1.
The only fuel reading a renter, or a camera, can actually observe. Continuous: a needle
resting between two Gauge Marks has an Indicated Level between them.
_Avoid_: gauge level, fuel level, reading

**Gauge Mark**:
One of the nine labelled positions printed on the gauge — E, ⅛, ¼, ⅜, ½, ⅝, ¾, ⅞, F.
What a person selects when entering a level by hand. A Gauge Mark is one possible
Indicated Level, not a separate kind of thing.
_Avoid_: gauge level, notch, tick

**Read Confidence**:
How certain a camera read is of the Indicated Level it reports. Present only on a read
produced by a Gauge Photo; a level a person entered by hand carries none.
_Avoid_: accuracy, certainty score

**Actual Level**:
The true fraction of fuel in the tank. Never directly observable — no part of the
product measures it, and every figure the app handles is an Indicated Level.
_Avoid_: real level, true level

**Safety Buffer**:
The extra gallons added to a recommendation to hedge the divergence between Indicated
Level and Actual Level. The product's central concession: because the gap is
unknowable, the answer errs toward overfilling. Composed of the renter's Risk
Tolerance plus any Uncertainty Allowance.
_Avoid_: margin, cushion, padding

**Uncertainty Allowance**:
Gallons added to the Safety Buffer because a camera read carried low Read Confidence.
Additive on top of Risk Tolerance, so a lean renter with a poor photo is still hedged —
which means the buffer applied can exceed the one the renter chose.
_Avoid_: confidence penalty, fudge factor

### Hedging

**Risk Tolerance**:
How large a Safety Buffer the renter chooses — conservative, standard, or lean. A
preference about how much to overfill, never about when to stop for fuel.
_Avoid_: risk level, refuel threshold, fill-up point

### Rental company policy

**Fee Threshold**:
The Indicated Level below which a rental company charges a service fee on return, on
top of the cost of the missing fuel. Taken from that company's nationally published
terms — never a FillRight judgement — and set per company, accepting that an
individual location's contract may differ.
_Avoid_: penalty line, minimum level, the quarter-tank rule

**Fee Exposure**:
The state of being on course to return a truck below its Fee Threshold, given the
Indicated Level now and the fuel the remaining drive will burn. Undefined, and
therefore not shown, for a company whose Fee Threshold has not been verified.
_Avoid_: at risk, penalty risk

### Truck and cargo

**Move Size**:
The size of household move a truck suits, expressed the way a renter thinks about it
— "Studio", "2 bedrooms". A property of the truck model, used to help someone choose
one.
_Avoid_: load size, capacity

**Load Level**:
How heavily a truck is loaded on this trip — empty, partial, or full. Reduces the
truck's effective fuel economy below its published figure.
_Avoid_: load size, weight, fullness

### Camera reading

**Gauge Photo**:
A photograph of a truck's fuel gauge, taken so the app can produce an Indicated Level
from it instead of asking the renter to pick a Gauge Mark.
_Avoid_: scan, capture, gauge image

**Refused Read**:
A Gauge Photo whose Read Confidence falls below the floor the app will act on. It
yields no Indicated Level at all — the renter retakes it or enters a Gauge Mark by
hand. Distinct from a low-confidence read, which is used but carries an Uncertainty
Allowance.
_Avoid_: failed scan, error, bad photo
