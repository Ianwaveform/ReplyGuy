# Phase One Plan: AI-Assisted Front Replies

## Goal

Build a safe first version of an AI support assistant that:

- listens for new inbound conversations from Front
- retrieves approved support knowledge and relevant customer context
- generates a draft reply
- sends the draft back to Front for human review and approval

Phase one should not auto-send replies and should not require an MCP server.

## Why This Is Phase One

This approach gives the team:

- faster response drafting without losing control
- a measurable approval workflow
- a cleaner path to trust, compliance, and iteration
- a reusable foundation for later auto-reply and chatbot work

## Phase One Scope

### In Scope

- Front webhook integration for new inbound conversations
- Middleware service to orchestrate retrieval and drafting
- Approved knowledge base for support content
- Draft reply generation with sources and confidence metadata
- Posting drafts back into Front for agent review
- Logging and analytics for quality and adoption

### Out of Scope

- full autonomous replies
- chatbot rollout
- model fine-tuning
- MCP server implementation
- broad ingestion of unreviewed historical emails as source of truth

## Success Criteria

Phase one is successful if we can show:

- agents regularly receive AI-generated drafts in Front
- drafts are grounded in approved knowledge
- acceptance and edit rates are measurable
- risky conversations are excluded from automation
- the team trusts the system enough to use it daily

Recommended launch metrics:

- draft coverage rate
- draft acceptance rate
- average edit rate per draft
- first response time reduction
- hallucination/error rate
- percent of conversations routed to human-only handling by policy

## Recommended Architecture

```text
Front
  -> webhook event
  -> support-ai middleware
      -> Front API connector
      -> customer/order data connector
      -> knowledge retrieval service
      -> policy and risk engine
      -> LLM draft generator
      -> logging and analytics store
  -> draft reply posted back to Front
  -> human agent reviews and sends
```

## Core Product Decisions

### 1. Human in the Loop First

AI drafts replies. Agents approve, edit, or discard them.

### 2. Retrieval Over Training

Do not start by training on old emails. Start with curated knowledge retrieval:

- policies
- macros
- SOPs
- troubleshooting guides
- product FAQ content
- tone guidance

### 3. Guardrails Before Speed

Do not generate drafts for:

- refunds, credits, or billing exceptions
- legal or safety issues
- angry or escalated customers
- enterprise or high-value accounts
- cases with missing source context
- questions where the system cannot find grounded knowledge

### 4. MCP Is Optional Later

For phase one, direct API integrations are simpler and faster. MCP becomes useful later if you want multiple AI clients sharing the same tools and knowledge layer.

## Phase One Workstreams

## Workstream A: Discovery and Support Design

Goal: define what the system should handle first.

Deliverables:

- top 20 to 25 support intents
- risk classification for each intent
- approved tone and voice guide
- escalation rules
- prohibited claims list
- list of source systems needed for context

Recommended first low-risk intents:

- order status
- shipping policy
- return window
- installation basics
- product FAQ
- basic compatibility questions only where data is structured

## Workstream B: Knowledge Base Foundation

Goal: create a governed content source for the AI.

Content types:

- policy documents
- support macros
- help center articles
- troubleshooting docs
- product compatibility tables
- approved email templates

Each knowledge item should include:

- title
- body
- category
- product line
- region
- owner
- approval status
- last reviewed date
- source URL or internal reference

Recommended storage pattern:

- relational database for metadata and structured records
- document store or file-backed content repo for source text
- vector index for semantic retrieval

Suggested minimum schema:

### `knowledge_documents`

- `id`
- `title`
- `category`
- `owner`
- `approval_status`
- `region`
- `product_line`
- `source_ref`
- `updated_at`
- `reviewed_at`

### `knowledge_chunks`

- `id`
- `document_id`
- `chunk_text`
- `chunk_order`
- `embedding_id`
- `tags`

### `support_policies`

- `id`
- `policy_name`
- `rule_type`
- `rule_value`
- `active`

### `draft_events`

- `id`
- `front_conversation_id`
- `intent`
- `risk_level`
- `confidence`
- `status`
- `created_at`

## Workstream C: Front Integration

Goal: make Front the system of engagement.

Phase one flow:

1. Front sends a webhook when a new inbound message arrives.
2. Middleware validates the webhook and loads conversation details.
3. Middleware fetches customer and business context from connected systems.
4. Middleware runs policy checks to determine whether AI drafting is allowed.
5. Retrieval fetches the most relevant approved knowledge.
6. LLM generates:
   - draft reply
   - brief rationale
   - cited source references
   - confidence score
7. Middleware posts the draft back into Front.
8. Agent reviews, edits, and sends.
9. System logs whether the draft was accepted, edited, or discarded.

Front-specific implementation targets for phase one:

- webhook receiver endpoint
- conversation fetch
- draft creation endpoint
- metadata mapping for inbox, tags, assignee, and contact

## Workstream D: AI Orchestration

Goal: generate useful drafts that stay inside policy.

Prompt design should include:

- the latest customer message
- thread summary or recent conversation context
- relevant customer/order facts
- approved knowledge snippets
- response tone instructions
- escalation rules
- refusal rules when information is missing

The model should return structured output:

- `draft_reply`
- `confidence_score`
- `suggested_intent`
- `suggested_tags`
- `source_ids`
- `should_escalate`
- `escalation_reason`

Generation rules:

- never invent policy or order facts
- never promise exceptions
- never guess compatibility
- prefer asking a clarifying question over fabricating an answer
- escalate when confidence is low or retrieval is weak

## Workstream E: Review and Analytics

Goal: measure whether the system is helping.

Track:

- time from inbound message to draft ready
- whether a draft was created
- whether an agent accepted or edited it
- size of edits
- whether the conversation later required escalation
- any known AI errors

Dashboard v1 can be simple:

- total conversations processed
- drafts generated
- drafts accepted
- drafts edited
- drafts discarded
- top intents
- top policy-block reasons

## Suggested Technical Stack

Since this workspace already uses Node.js and TypeScript, phase one should stay in that stack.

Recommended stack:

- backend: Node.js + TypeScript
- API layer: Express or Fastify
- database: PostgreSQL or SQLite for early local development
- vector store: PostgreSQL with pgvector, Pinecone, or another managed vector index
- LLM: OpenAI responses-based workflow with structured output
- background jobs: simple queue or scheduled workers as needed

For local prototyping:

- use SQLite first if speed matters most
- migrate to PostgreSQL before production if multiple services or users are involved

## Implementation Milestones

## Milestone 0: Definition

Target outcome:

- clear scope for the first 3 to 5 intents
- approved source documents identified
- policy rules drafted

## Milestone 1: Knowledge MVP

Target outcome:

- initial approved docs cleaned and loaded
- chunking and tagging process working
- retrieval returns relevant snippets for test prompts

## Milestone 2: Front Draft MVP

Target outcome:

- webhook endpoint receives inbound events
- middleware fetches conversation context
- draft generation works for low-risk intents
- draft is posted back to Front

## Milestone 3: Agent Pilot

Target outcome:

- a small group of agents uses the workflow
- analytics capture approval and edit outcomes
- prompt and retrieval quality are refined weekly

## Milestone 4: Auto-Reply Readiness Review

Target outcome:

- identify 1 to 2 narrow intents safe enough for future auto-reply
- confirm that policy, retrieval, and accuracy thresholds are reliable

## Delivery Plan

### Week 1

- define top intents and exclusions
- collect macros, SOPs, and policy docs
- define metadata model for approved content

### Week 2

- build ingestion pipeline for approved documents
- implement chunking, tagging, and retrieval
- create evaluation set with real but anonymized support examples

### Week 3

- connect Front webhook and conversation fetch
- build draft generation pipeline
- post draft replies back into Front

### Week 4

- add policy checks and risk gating
- log outcomes and analytics
- run internal testing with support leads

### Week 5+

- pilot with a limited inbox or limited intent set
- review failures weekly
- improve knowledge coverage and prompt quality

## Risks and Mitigations

### Risk: stale or conflicting support content

Mitigation:

- require document owners
- require reviewed dates
- exclude unapproved content from retrieval

### Risk: unsafe drafts in sensitive cases

Mitigation:

- strict pre-generation gating
- default to no draft for high-risk categories
- require human approval on every phase-one message

### Risk: team distrust or low adoption

Mitigation:

- start with a narrow safe scope
- show citations and confidence
- track wins and failure cases openly

### Risk: overreliance on historical emails

Mitigation:

- use history for evaluation and patterns, not as policy authority
- make approved knowledge the primary source

## Recommended Next Step

The best first build task is not code generation. It is defining the initial support scope and the source-of-truth knowledge set.

Start with these three immediate outputs:

1. a list of the first 10 to 20 intents you want AI to handle
2. a folder of approved support content to ingest
3. a simple policy matrix of allowed versus blocked draft topics

Once those are ready, the first engineering ticket should be:

"Build a local middleware service that receives a Front webhook, retrieves approved knowledge for a low-risk support intent, generates a grounded draft reply, and saves the result for human review."

## Phase Two Preview

After phase one is stable, phase two can add:

- limited auto-reply for very low-risk intents
- richer analytics and QA review
- chatbot reuse of the same knowledge and policy layer
- MCP wrapping for tools and shared AI interfaces
