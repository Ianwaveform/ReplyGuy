# ReplyGuy Working Decisions

## Current Defaults

These are the current operating defaults for the internal ReplyGuy build.

### Front Inboxes

ReplyGuy should ingest these inboxes:

* `WF Help`
* `WI - SMS Support`
* `AMZ SMS`
* `AMZ UK`

### Refresh Cadence

Recommended default:

* run the pipeline every **4 hours**
* use a **3 hour overlap window**

Why:

* keeps the corpus moving steadily
* avoids hammering the Front API every few minutes
* re-fetches enough recent history to catch updates, reopenings, and follow-up replies

If volume grows substantially, the next adjustment should be:

* keep the 4 hour cadence
* reduce per-run `max-conversations` by inbox
* move to per-inbox tuning only if the API budget becomes an issue

### Plugin v1 Scope

The first Front plugin/add-on should do both:

* draft a reply
* answer internal policy/process questions

### Plugin Permissions At Launch

Launch with:

* suggest text
* copy draft
* write draft into Front composer

Do not auto-send in v1.

### Approved Knowledge Sources

Internal assistant grounding is allowed to use:

* product pages from `waveform.com`
* historic Front replies
* explicitly curated guidance docs you choose to keep

Customer-facing draft generation is currently restricted to:

* saved team training replies
* curated customer-facing guidelines
* QA coaching guidance
* historic Front replies for structure only

The imported Notion SOP corpus has been removed from this project.
Only specifically curated guidance docs should be added back on purpose.
Put future approved guidance in:

* `knowledge/curated/customer-guidance`

### Model Defaults

Backend default:

* OpenAI Responses API
* `gpt-5.4` for harder reasoning
* `gpt-5.4-mini` for faster/lower-cost flows

### Review Ownership

Training feedback and approval should come from:

* you
* your team

### Initial Team

Initial internal users:

* Sales
* Support

### Citations

Plugin responses should include citations from day one.
