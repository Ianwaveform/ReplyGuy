# ReplyGuy Current Phase Status

Last updated: 2026-06-25

## Current checkpoint

Phase 1 is complete enough for active team testing.

Implemented in the current plugin and backend:

- persistent team feedback coaching is injected into future generations
- anti-em-dash guidance is treated as standing instruction
- compose modes now distinguish `reply`, `follow-up`, and `polish`
- polish mode treats the agent's draft as the source of truth
- polish mode preserves preferred openings and avoids inventing new facts
- medium-aware formatting adjusts output for email vs SMS-style replies
- plugin metadata shows current version and deploy timestamp
- a live regression runner exists for targeted reply checks

## Where we are now

The next active phase is focused on thread-state awareness and operator workflow quality.

Current goals for this phase:

- improve reply vs follow-up detection inside the Front sidebar
- avoid suggesting follow-ups when the team is simply waiting on the customer
- make draft mode selection feel more trustworthy at a glance
- continue reducing cases where ReplyGuy answers the wrong message in the thread

## Still queued after this phase

- performance and loading improvements
- stronger long-term eval coverage and regression scenarios
- broader feedback digestion and coaching review workflows
