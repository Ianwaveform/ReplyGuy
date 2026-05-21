import React from "react";
import ReactDOM from "react-dom/client";
import { contextUpdates, delegateNewWindowsToFront } from "@frontapp/plugin-sdk";
import type { ApplicationMessage, SingleConversationContext } from "@frontapp/plugin-sdk";
import "./front-plugin.css";

type DraftResponse = {
  generatedAt: string;
  subject: string;
  intent: string;
  intentLabel: string;
  customerMessageRedacted: string;
  draftReply: string;
  draftNotes: string[];
  model?: string;
  provider?: string;
  generationMode?: string;
  replyMode?: ReplyMode;
  confidence?: DraftConfidence;
  sources?: DraftSource[];
  productTags?: string[];
};

type ThreadMemory = {
  latestCustomerAsk: string;
  recentCustomerContext: string[];
  recentTeamReplies: string[];
  openQuestion: string;
  constraints: string[];
};

type ReplyMode = "fast" | "careful" | "research";

type DraftConfidence = {
  label: "High" | "Medium" | "Low";
  score: number;
  reasons: string[];
};

type DraftSource = {
  id: string;
  type: string;
  title: string;
  detail?: string;
  excerpt?: string;
  relativePath?: string;
};

const REPLY_MODES: Array<{ value: ReplyMode; label: string }> = [
  { value: "fast", label: "Fast" },
  { value: "careful", label: "Careful" },
  { value: "research", label: "Research" },
];

const KNOWN_PRODUCT_TAGS = [
  "Coax Window Cable",
  "DualMini",
  "DualPlus",
  "DualPlus Duo",
  "Ethernet Window Cable",
  "FlexMount",
  "GO X G32",
  "GO X G41",
  "GO X G41 MIMO",
  "Griddy",
  "LP 2x2",
  "LP 4x4",
  "MIMO 2x2",
  "MIMO 4x4",
  "MIMO 8x8",
  "MP70",
  "OGE",
  "Omniroam",
  "Panel 2x2",
  "Panel 4x4 (Legacy)",
  "ProLink",
  "Quad Accessory",
  "QuadMini",
  "QuadMini Duo",
  "QuadPro",
  "QuadPro Duo",
  "UltraPole",
  "XR60",
];

const PRODUCT_TAG_LOOKUP = new Map(KNOWN_PRODUCT_TAGS.map((tag) => [tag.toLowerCase(), tag]));

function FrontPluginApp() {
  const [context, setContext] = React.useState<SingleConversationContext | null>(null);
  const [contextError, setContextError] = React.useState("");
  const [messages, setMessages] = React.useState<ApplicationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [messagesError, setMessagesError] = React.useState("");
  const [draft, setDraft] = React.useState<DraftResponse | null>(null);
  const [draftLoading, setDraftLoading] = React.useState(false);
  const [draftError, setDraftError] = React.useState("");
  const [applyState, setApplyState] = React.useState("");
  const [applySuccess, setApplySuccess] = React.useState("");
  const [trainingNotes, setTrainingNotes] = React.useState("");
  const [savedFeedbackNotes, setSavedFeedbackNotes] = React.useState("");
  const [trainingState, setTrainingState] = React.useState("");
  const [feedbackSaved, setFeedbackSaved] = React.useState(false);
  const [replyMode, setReplyMode] = React.useState<ReplyMode>("careful");

  React.useEffect(() => {
    delegateNewWindowsToFront();
    const subscription = contextUpdates.subscribe({
      next(nextContext: unknown) {
        if (isSingleConversationContext(nextContext)) {
          setContext(nextContext);
          setContextError("");
          return;
        }

        setContext(null);
        setMessages([]);
        setDraft(null);
        setContextError("Open a single conversation in Front to use ReplyGuy.");
      },
      error(error) {
        setContext(null);
        setContextError(error instanceof Error ? error.message : "Failed to connect to Front context.");
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!context) {
      return;
    }

    void loadMessages(context);
  }, [context?.conversation.id]);

  async function loadMessages(activeContext: SingleConversationContext) {
    setMessagesLoading(true);
    setMessagesError("");

    try {
      const result = await activeContext.listMessages();
      setMessages(
        [...result.results].sort(
          (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
        ),
      );
    } catch (error) {
      setMessages([]);
      setMessagesError(error instanceof Error ? error.message : "Failed to load conversation messages.");
    } finally {
      setMessagesLoading(false);
    }
  }

  const latestInbound = React.useMemo(
    () => pickLatestUsefulInboundMessage(messages),
    [messages],
  );
  const latestInboundText = React.useMemo(() => extractMessageText(latestInbound), [latestInbound]);
  const threadMemory = React.useMemo(() => buildThreadMemory(messages, latestInbound), [messages, latestInbound]);
  const productTags = React.useMemo(() => extractProductTags(context?.conversation), [context?.conversation]);

  async function generateDraft() {
    await requestDraft();
  }

  async function regenerateFromFeedback() {
    const feedback = feedbackSaved ? savedFeedbackNotes : trainingNotes;
    if (!feedback.trim()) {
      setDraftError("Add feedback first, then regenerate the reply.");
      return;
    }

    await requestDraft({
      revisionFeedback: feedback,
      currentDraft: draft?.draftReply || "",
    });
  }

  async function requestDraft(options?: { revisionFeedback?: string; currentDraft?: string }) {
    if (!latestInboundText) {
      setDraftError("ReplyGuy couldn't find an inbound customer message to draft from.");
      return;
    }

    setDraftLoading(true);
    setDraftError("");
    setApplySuccess("");
    setTrainingState("");
    setFeedbackSaved(false);
    setSavedFeedbackNotes("");

    try {
      const response = await fetch("/api/support-lab/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: context?.conversation.subject || latestInbound?.subject || "",
          message: latestInboundText,
          threadMemory,
          replyMode,
          productTags,
          revisionFeedback: options?.revisionFeedback || "",
          currentDraft: options?.currentDraft || "",
          allowFallback: false,
        }),
      });
      const raw = await response.text();
      const payload = safeParseJson(raw);

      if (!response.ok || !payload?.draftReply) {
        throw new Error(payload?.detail || payload?.error || "ReplyGuy couldn't generate a draft for this thread.");
      }

      setDraft(payload);
      setFeedbackSaved(false);
      setSavedFeedbackNotes("");
    } catch (error) {
      setDraft(null);
      setDraftError(
        error instanceof Error
          ? error.message
          : "ReplyGuy couldn't generate a live draft for this thread.",
      );
    } finally {
      setDraftLoading(false);
    }
  }

  async function applyDraftToFront() {
    if (!context || !draft?.draftReply) {
      return;
    }

    setApplyState("applying");
    setApplySuccess("");

    try {
      const content = {
        body: draft.draftReply,
        type: "text" as const,
      };

      if (context.conversation.draftId) {
        await context.updateDraft(context.conversation.draftId, {
          updateMode: "replace",
          content,
          subject: context.conversation.subject,
        });
      } else if (latestInbound?.id) {
        await context.createDraft({
          replyOptions: {
            type: "reply",
            originalMessageId: latestInbound.id,
          },
          content,
        });
      } else {
        await context.createDraft({
          content,
          subject: context.conversation.subject,
        });
      }

      setApplySuccess("Draft added to Front.");
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : "Failed to apply the draft inside Front.");
    } finally {
      setApplyState("");
    }
  }

  async function copyDraft() {
    if (!draft?.draftReply) {
      return;
    }

    await navigator.clipboard.writeText(draft.draftReply);
    setApplySuccess("Draft copied to clipboard.");
  }

  async function saveTrainingNotes() {
    if (!draft?.draftReply || !latestInboundText) {
      setDraftError("Generate a draft first so ReplyGuy has something to save as training.");
      return;
    }

    setTrainingState("saving");
    setDraftError("");
    setApplySuccess("");

    try {
      const response = await fetch("/api/support-lab/training", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: context?.conversation.subject || latestInbound?.subject || "Front plugin training example",
          topic: draft.intentLabel || draft.intent || "",
          customerMessage: latestInboundText,
          idealReply: draft.draftReply,
          notes: trainingNotes,
          reviewer: "Front Plugin",
        }),
      });
      const raw = await response.text();
      const payload = safeParseJson(raw);
      if (!response.ok || !payload?.item) {
        throw new Error(payload?.detail || payload?.error || "Failed to save training notes.");
      }

      setTrainingState("");
      setApplySuccess(
        payload?.storePath
          ? `Feedback saved to ${payload.storePath}.`
          : "Feedback saved with the current draft.",
      );
      setSavedFeedbackNotes(trainingNotes);
      setTrainingNotes("");
      setFeedbackSaved(true);
    } catch (error) {
      setTrainingState("");
      setDraftError(error instanceof Error ? error.message : "Failed to save training notes.");
    }
  }

  return (
    <div className="front-plugin-shell">
      <header className="front-plugin-header">
        <div className="plugin-title-group">
          <p className="plugin-eyebrow">ReplyGuy</p>
          <h1>{draft?.intentLabel || "Loading topic..."}</h1>
          <p className="plugin-subtitle">{context?.conversation.subject || "Open a Front thread to draft a reply."}</p>
        </div>
      </header>

      {contextError ? <div className="plugin-notice error">{contextError}</div> : null}
      {messagesError ? <div className="plugin-notice error">{messagesError}</div> : null}
      {draftError ? <div className="plugin-notice error">{draftError}</div> : null}
      {applySuccess ? <div className="plugin-notice success">{applySuccess}</div> : null}

      <section className="plugin-panel">
        <div className="plugin-summary-row">
          <div className="plugin-topic-pill">{draft?.intentLabel || "Topic pending"}</div>
          {draft?.confidence ? (
            <div className={`plugin-confidence ${draft.confidence.label.toLowerCase()}`}>
              {draft.confidence.label} confidence
            </div>
          ) : null}
          <button className="plugin-button secondary" type="button" onClick={() => context && void loadMessages(context)} disabled={!context || messagesLoading}>
            {messagesLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="plugin-mode-picker" role="group" aria-label="Reply mode">
          {REPLY_MODES.map((mode) => (
            <button
              key={mode.value}
              className={replyMode === mode.value ? "active" : ""}
              type="button"
              onClick={() => setReplyMode(mode.value)}
              disabled={draftLoading}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="plugin-section">
          <div className="plugin-section-header">
            <div>
              <p className="plugin-eyebrow">Reply</p>
              <h2>Generated reply</h2>
            </div>
            <small>{draft ? `${draft.provider || "OpenAI"} ${draft.model || ""}`.trim() : "No draft yet"}</small>
          </div>
          <pre className="plugin-message-block assistant">
            {draft?.draftReply || "Generate a draft to preview the reply here."}
          </pre>
          <div className="plugin-actions">
            <button className="plugin-button primary" type="button" onClick={() => void generateDraft()} disabled={draftLoading || !latestInbound}>
              {draftLoading ? "Generating..." : "Generate reply"}
            </button>
            <button className="plugin-button secondary" type="button" onClick={() => void applyDraftToFront()} disabled={!draft?.draftReply || applyState === "applying"}>
              {applyState === "applying" ? "Adding..." : "Add to Front composer"}
            </button>
            <button className="plugin-button secondary" type="button" onClick={() => void copyDraft()} disabled={!draft?.draftReply}>
              Copy
            </button>
          </div>
          {draft?.sources?.length || draft?.confidence ? (
            <details className="plugin-sources">
              <summary>Sources and confidence</summary>
              {draft.confidence ? (
                <div className="plugin-confidence-detail">
                  <strong>{draft.confidence.label} confidence</strong>
                  <span>{draft.confidence.score}/100</span>
                  {draft.confidence.reasons.length ? (
                    <ul>
                      {draft.confidence.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              {draft.sources?.length ? (
                <ul className="plugin-source-list">
                  {draft.sources.map((source) => (
                    <li key={source.id}>
                      <strong>{source.title}</strong>
                      {source.detail ? <span>{source.detail}</span> : null}
                      {source.excerpt ? <small>{source.excerpt}</small> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </details>
          ) : null}
        </div>

        <div className="plugin-section">
          <div className="plugin-section-header">
            <div>
              <p className="plugin-eyebrow">Customer</p>
              <h2>Latest ask</h2>
            </div>
          </div>
          <div className="plugin-customer-brief">
            {latestInboundText || "No clean inbound customer message found yet."}
          </div>
        </div>

        <div className="plugin-section">
          <div className="plugin-section-header">
            <div>
              <p className="plugin-eyebrow">Training</p>
              <h2>Feedback</h2>
            </div>
          </div>
          <label className="plugin-field">
            <span>What should ReplyGuy learn from this reply?</span>
            <textarea
              className="plugin-textarea"
              value={trainingNotes}
              onChange={(event) => {
                setTrainingNotes(event.target.value);
                setFeedbackSaved(false);
                setSavedFeedbackNotes("");
              }}
              placeholder={
                feedbackSaved
                  ? "Feedback saved, Re-generate reply?"
                  : "Example: Good direct recommendation. Shorten the opening. Be more confident about next steps. Avoid mentioning internal reasoning."
              }
            />
          </label>
          <div className="plugin-actions">
            <button
              className="plugin-button secondary"
              type="button"
              onClick={() => void (feedbackSaved ? regenerateFromFeedback() : saveTrainingNotes())}
              disabled={
                !draft?.draftReply
                || (!(feedbackSaved ? savedFeedbackNotes.trim() : trainingNotes.trim()))
                || draftLoading
                || trainingState === "saving"
              }
            >
              {trainingState === "saving"
                ? "Saving..."
                : draftLoading
                  ? "Regenerating..."
                  : feedbackSaved
                    ? "Re-generate reply"
                    : "Save feedback"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FrontPluginApp />
  </React.StrictMode>,
);

function isSingleConversationContext(value: unknown): value is SingleConversationContext {
  return typeof value === "object"
    && value !== null
    && "type" in value
    && value.type === "singleConversation";
}

function extractProductTags(conversation: unknown) {
  const tagNames = collectPotentialTagNames(conversation);
  const matched = tagNames
    .map((tag) => PRODUCT_TAG_LOOKUP.get(tag.toLowerCase()))
    .filter((tag): tag is string => Boolean(tag));

  return Array.from(new Set(matched));
}

function collectPotentialTagNames(value: unknown) {
  const names = new Set<string>();
  const queue: unknown[] = [value];
  const seen = new Set<unknown>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (typeof current === "string") {
      names.add(current.trim());
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    if (typeof current !== "object") {
      continue;
    }

    const record = current as Record<string, unknown>;
    for (const key of ["name", "tagName", "tag_name", "label"]) {
      if (typeof record[key] === "string") {
        names.add(String(record[key]).trim());
      }
    }

    for (const key of ["tags", "applied_tags", "taggings"]) {
      if (Array.isArray(record[key])) {
        queue.push(record[key]);
      }
    }
  }

  return Array.from(names).filter(Boolean);
}

function extractMessageText(message: ApplicationMessage | null | undefined) {
  const raw = String(message?.content?.body || "");
  if (!raw.trim()) {
    return "";
  }

  const htmlWithoutStyles = raw
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const document = new DOMParser().parseFromString(htmlWithoutStyles, "text/html");
  const text = normalizeCustomerText(document.body?.textContent || raw);
  return trimQuotedHistory(text);
}

function normalizeCustomerText(value: string) {
  return stripContactFormScaffolding(
    String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim(),
  );
}

function trimQuotedHistory(value: string) {
  const patterns = [
    /\nFrom:\s.+$/is,
    /\nOn .+ wrote:\s*$/is,
    /\n-{2,}\s*Original Message\s*-{2,}[\s\S]*$/i,
    /\nTo unsubscribe from this group[\s\S]*$/i,
  ];

  let result = value;
  for (const pattern of patterns) {
    result = result.replace(pattern, "").trim();
  }

  return result;
}

function safeParseJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {
      error: "ReplyGuy received an unexpected server response. Refresh the plugin and try again.",
      detail: raw.slice(0, 200),
    };
  }
}

function pickLatestUsefulInboundMessage(messages: ApplicationMessage[]) {
  const inboundMessages = messages
    .filter((message) => message.status === "inbound")
    .map((message) => ({
      message,
      text: extractMessageText(message),
      score: scoreInboundText(extractMessageText(message)),
      time: new Date(message.date).getTime(),
    }))
    .filter((entry) => entry.text.trim())
    .sort((left, right) => right.time - left.time);

  const latestValid = inboundMessages.find((entry) => entry.score > -50);
  if (latestValid) {
    return latestValid.message;
  }

  return inboundMessages[0]?.message ?? null;
}

function scoreInboundText(text: string) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return -100;
  }

  let score = Math.min(normalized.length, 800);
  if (/\b(i have|i need|can you|let me know|looking for|issue|problem|question|current)\b/i.test(normalized)) {
    score += 120;
  }
  if (/\b\[deprecated\]\b/i.test(normalized)) {
    score -= 300;
  }
  if (/url from referer header/i.test(normalized)) {
    score -= 300;
  }
  if (/^https?:\/\/\S+$/im.test(normalized)) {
    score -= 120;
  }

  return score;
}

function stripContactFormScaffolding(value: string) {
  let result = String(value || "");

  result = result
    .replace(/\[Deprecated\]\s*URL from Referer header:\s*[\s\S]*?(?=(?:\n[A-Z][A-Za-z ]{1,24}:)|$)/gi, " ")
    .replace(/\burl:\s*https?:\/\/\S+/gi, " ")
    .replace(/\bhttps?:\/\/www\.waveform\.com\/pages\/contact-us\b/gi, " ");

  const messageFieldMatch = result.match(/(?:^|\n)Message:\s*([\s\S]*)/i);
  if (messageFieldMatch?.[1]?.trim()) {
    result = messageFieldMatch[1].trim();
  }

  return result
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildThreadMemory(messages: ApplicationMessage[], latestInbound: ApplicationMessage | null): ThreadMemory {
  const latestDate = latestInbound ? new Date(latestInbound.date).getTime() : Number.POSITIVE_INFINITY;
  const olderMessages = messages
    .filter((message) => new Date(message.date).getTime() < latestDate)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  const recentCustomerContext = olderMessages
    .filter((message) => message.status === "inbound")
    .map((message) => extractMessageText(message))
    .filter(Boolean)
    .slice(0, 2);

  const recentTeamReplies = olderMessages
    .filter((message) => message.status !== "inbound")
    .map((message) => extractMessageText(message))
    .filter(Boolean)
    .slice(0, 2);

  const constraints = extractConstraints([latestInbound ? extractMessageText(latestInbound) : "", ...recentCustomerContext]);

  return {
    latestCustomerAsk: latestInbound ? extractMessageText(latestInbound) : "",
    recentCustomerContext,
    recentTeamReplies,
    openQuestion: inferOpenQuestion(latestInbound ? extractMessageText(latestInbound) : ""),
    constraints,
  };
}

function inferOpenQuestion(text: string) {
  const cleaned = String(text || "").trim();
  if (!cleaned) {
    return "";
  }

  const questionSentences = cleaned
    .split(/(?<=[?.!])\s+/)
    .filter((sentence) => sentence.includes("?"));

  return questionSentences[0] || cleaned.split(/\n+/)[0] || "";
}

function extractConstraints(inputs: string[]) {
  const constraints = new Set<string>();
  const joined = inputs.join("\n");

  if (/\b(asap|urgent|today|tomorrow|overnight|deadline)\b/i.test(joined)) {
    constraints.add("There is a timing or urgency constraint.");
  }

  if (/\b(price|payment|invoice|quote|budget|cost)\b/i.test(joined)) {
    constraints.add("Commercial details may affect the reply.");
  }

  if (/\binstall|installer|roof|schedule|access|noise|onsite|coordina/i.test(joined)) {
    constraints.add("Installation or scheduling logistics matter here.");
  }

  if (/\bwarranty|replace|replacement|return|refund\b/i.test(joined)) {
    constraints.add("Warranty, replacement, or return handling may be relevant.");
  }

  return Array.from(constraints);
}
