# Front Reply Digestion Plan

## Goal

Use historical human-written replies in Front to learn:

- tone and brand voice
- strong response structure by intent
- escalation patterns
- phrases to reuse
- phrases to avoid

Do not use historical replies as policy authority. Approved SOPs and knowledge documents remain the source of truth.

## What "Digest" Means

This workflow should:

1. pull historical conversations and messages from Front
2. isolate high-quality human outbound replies
3. group them by support intent and context
4. analyze tone, structure, and language patterns
5. turn those findings into assets the AI system can use safely

## Primary Outputs

The analysis should produce:

- a tone guide
- intent-level reply playbooks
- approved phrase libraries
- do-not-use phrase lists
- evaluation examples for prompt testing
- a training set for tone scoring and QA review

## Front Data To Pull

For each conversation:

- conversation id
- inbox
- tags
- status
- created date
- assignee or team when available

For each message in the conversation:

- message id
- direction: inbound or outbound
- sender
- recipients
- sent timestamp
- subject
- body content
- attachments metadata if relevant

Helpful enrichment if available:

- contact type or customer segment
- custom fields
- macros used
- reopen or follow-up patterns

## What To Include

Prioritize conversations that:

- came through the pilot inbox
- were resolved successfully
- reflect standard support handling
- have clean, professional outbound replies
- fit common, repeatable intents

## What To Exclude

Exclude conversations that:

- involve refunds or credits outside standard policy
- contain legal, safety, or compliance edge cases
- are heavily escalated or hostile
- reflect one-time exceptions
- contain poor writing quality
- rely on undocumented tribal knowledge

## Selection Strategy

Start with a curated sample before trying to process everything.

Recommended first pass:

- 200 to 500 conversations from `WF help`
- focus on the top 5 to 10 common intents
- bias toward strong agents and recent examples

This is better than bulk-ingesting thousands of mixed-quality replies too early.

## Analysis Pipeline

## Step 1: Export and Normalize

Pull conversation and message history from Front, then normalize each thread into a local record with:

- conversation metadata
- ordered message timeline
- extracted latest customer ask
- extracted final human response

Store normalized data separately from curated assets so we keep a clear audit trail.

## Step 2: Identify Candidate Replies

For each conversation, isolate outbound human replies that are likely useful examples.

Good candidate rules:

- last or resolution-driving outbound reply
- not auto-generated
- not a one-line macro-only response unless the macro is approved
- not an internal comment
- not obviously edited by AI in the future if we want pure human examples

## Step 3: Classify Intent

Assign each candidate reply an intent such as:

- order status
- shipping question
- return window
- installation help
- compatibility question
- warranty question
- product information
- replacement process
- escalation handoff

This can start as manual or rules-based classification, then move to model-assisted classification with human review.

## Step 4: Score Reply Quality

Each reply should be scored on:

- clarity
- empathy
- correctness against SOP
- concision
- completeness
- professionalism
- escalation appropriateness

At the start, use a simple three-bucket system:

- strong example
- usable with caveats
- exclude

## Step 5: Extract Tone and Structure Patterns

For strong examples, analyze:

- greeting style
- acknowledgment or empathy pattern
- explanation structure
- action statement
- closing language
- escalation phrasing
- sentence length and reading level

This is where we identify the actual brand voice rather than just storing raw message text.

## Step 6: Produce Reusable Assets

Turn findings into:

### `knowledge/style/tone-guide.md`

- voice attributes
- preferred wording patterns
- sentence style rules
- empathy rules
- escalation tone rules

### `knowledge/style/approved-phrases.md`

- strong opening patterns
- useful clarification phrases
- clear next-step language
- safe closing lines

### `knowledge/style/avoid-phrases.md`

- overpromising language
- vague or defensive wording
- phrases that sound robotic
- phrases that imply policy exceptions

### `knowledge/style/intent-playbooks/`

One file per intent with:

- customer goal
- recommended response structure
- example wording
- escalation triggers

### `knowledge/examples/human-replies/curated/`

Anonymized gold-standard examples grouped by intent.

## Recommended Data Model

### `front_conversations_raw`

- `conversation_id`
- `inbox_name`
- `status`
- `created_at`
- `tags_json`
- `assignee`
- `custom_fields_json`

### `front_messages_raw`

- `message_id`
- `conversation_id`
- `direction`
- `sender_name`
- `sender_email`
- `sent_at`
- `subject`
- `body_text`
- `body_html`

### `reply_candidates`

- `message_id`
- `conversation_id`
- `intent`
- `quality_bucket`
- `is_human_authored`
- `is_exception_case`
- `needs_review`

### `reply_style_features`

- `message_id`
- `has_empathy_opening`
- `has_clear_next_step`
- `has_policy_reference`
- `has_escalation_language`
- `word_count`
- `reading_level_estimate`
- `tone_notes`

## Guardrails

Historical messages should inform style, not policy.

Rules:

- never let historical replies override approved SOPs
- mark exception-case replies so they do not become templates
- keep customer data anonymized in curated datasets
- separate raw exports from approved reusable examples
- review outputs with support leadership before using them in prompts

## Best Use Of Historical Replies

Use them to:

- improve prompt instructions
- create few-shot style examples
- build tone validators
- test whether generated drafts match your best human replies

Avoid using them to:

- determine refund policy
- infer undocumented promises
- answer edge-case product questions without verified source material

## Suggested Implementation Sequence

### Phase A: Manual and Semi-Manual Review

- export a small historical sample
- review and label strong examples
- draft tone guide and phrase lists

### Phase B: Structured Analysis

- build ingestion script for Front messages
- classify by intent
- score style features
- generate style artifacts

### Phase C: Runtime Usage

Use the outputs in the draft generation system:

- tone guide in system prompt
- intent playbooks in retrieval context
- curated examples as few-shot references
- avoid-phrases list in QA checks

## Recommended First Task

Once Front access is working, the first historical-analysis engineering task should be:

"Fetch a limited set of recent conversations from the `WF help` inbox, extract outbound human replies, and save normalized conversation/message JSON for manual review."

That gives us a clean dataset to inspect before building scoring or prompt logic.
