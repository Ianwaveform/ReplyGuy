# ReplyGuy Execution Roadmap

## Current State

The repo is currently in a **corpus-building and review** stage:

* Front conversation export exists.
* Front reply analysis exists.
* SOP + generated tone assets are browseable in the dashboard.
* Strong-reply review is possible in the dashboard.

What does **not** exist yet:

* a live assistant backend using OpenAI Responses API
* a Front plugin/add-on
* a retrieval system with citations
* a formal human review workflow for training examples
* continuous ingestion and evaluation loops

## Target Architecture

Build **one governed assistant backend** with separate assistant policies:

* **Internal assistant**: surfaced through a Front plugin/add-on, grounded in internal SOPs and approved Front replies
* **Customer assistant**: future website widget, grounded only in public customer-safe docs

Shared backend responsibilities:

* conversation orchestration
* retrieval and source attribution
* prompt/version control
* eval datasets and regression checks
* logging, feedback, escalation history

## Phases

## Phase 0: Corpus And Workflow Foundation

Goal: make the training corpus reliable and continuously refreshable.

Deliverables:

* repeatable Front export + analysis pipeline
* stable output directories and metadata
* dashboard visibility into latest exports and analyses
* initial review rubric for what counts as a strong reply

Status:

* Partially complete

Remaining work:

* automate recurring export/analyze runs
* define review criteria and annotation workflow
* store human approvals/rejections instead of relying only on heuristics
* support multiple Front inboxes under one pipeline

## Phase 1: Internal Assistant Backend

Goal: produce grounded internal answers and reply drafts from approved internal sources.

Deliverables:

* `POST /chat/internal`
* Responses API integration
* retrieval over internal SOPs + approved Front examples + style guide
* source citations in every answer
* audit logging of retrieved sources and answer metadata

Status:

* Not started

## Phase 2: Front Plugin/Add-On

Goal: bring the internal assistant directly into Front instead of Slack.

Deliverables:

* Front plugin UI embedded in the conversation view
* current conversation context passed into ReplyGuy backend
* suggested reply drafting
* citation panel
* human accept/edit/copy workflow
* feedback capture such as useful/not useful or accepted/edited

Status:

* Not started

## Phase 3: Review, Eval, And Safety

Goal: make ReplyGuy trustworthy enough for everyday internal use.

Deliverables:

* evaluation dataset of common internal support questions
* response quality scoring for tone, correctness, citations, and policy adherence
* guardrails for unsupported asks
* regression testing before prompt/model changes

Status:

* Not started

## Phase 4: Customer Assistant Foundation

Goal: add the customer-facing assistant without mixing internal content.

Deliverables:

* separate customer retrieval store
* website widget endpoint
* public-source-only answers
* Front handoff path for customer escalation

Status:

* Not started

## Recommended Build Order

1. Make ingestion continuous and safe.
2. Add human review + approval storage for strong replies.
3. Build internal retrieval with citations.
4. Add `POST /chat/internal` with Responses API.
5. Build the Front plugin/add-on around that endpoint.
6. Add evals and regression checks.
7. Only then start the customer assistant track.

## Immediate Next Step

Implement a **repeatable Front pipeline** that:

* exports recent Front conversations
* uses a small overlap window to avoid missing updates
* analyzes the newest export automatically
* becomes the basis for scheduled ingestion later

That keeps the corpus growing while we design the plugin and review workflow.

## Current Working Defaults

The current agreed operating defaults are:

* Front inboxes: `WF Help`, `WI - SMS Support`, `AMZ SMS`, `AMZ UK`
* cadence target: every 4 hours
* overlap window: 3 hours
* plugin v1 scope: reply drafting plus internal policy/process answers
* launch permissions: suggest text, copy draft, write draft into Front composer
* approved internal sources: `waveform.com` product pages, Notion SOPs, historic Front replies
* model/backend: OpenAI Responses API with `gpt-5.4` and `gpt-5.4-mini`
* initial teams: Sales and Support
* citations: required in plugin output
