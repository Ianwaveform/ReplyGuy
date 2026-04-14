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
};

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
  const [trainingState, setTrainingState] = React.useState("");

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
    () =>
      messages.find(
        (message) => message.status === "inbound" && typeof message.content?.body === "string" && message.content.body.trim(),
      ) ?? null,
    [messages],
  );

  async function generateDraft() {
    if (!latestInbound?.content?.body) {
      setDraftError("ReplyGuy couldn't find an inbound customer message to draft from.");
      return;
    }

    setDraftLoading(true);
    setDraftError("");
    setApplySuccess("");
    setTrainingState("");

    try {
      const response = await fetch("/api/support-lab/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: context?.conversation.subject || latestInbound.subject || "",
          message: latestInbound.content.body,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.draftReply) {
        throw new Error(payload?.error || payload?.detail || "Failed to generate ReplyGuy draft.");
      }

      setDraft(payload);
    } catch (error) {
      setDraft(null);
      setDraftError(error instanceof Error ? error.message : "Failed to generate ReplyGuy draft.");
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
    if (!draft?.draftReply || !latestInbound?.content?.body) {
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
          subject: context?.conversation.subject || latestInbound.subject || "Front plugin training example",
          topic: draft.intentLabel || draft.intent || "",
          customerMessage: latestInbound.content.body,
          idealReply: draft.draftReply,
          notes: trainingNotes,
          reviewer: "Front Plugin",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.item) {
        throw new Error(payload?.error || payload?.detail || "Failed to save training notes.");
      }

      setTrainingState("");
      setApplySuccess("Training note saved with the current draft.");
      setTrainingNotes("");
    } catch (error) {
      setTrainingState("");
      setDraftError(error instanceof Error ? error.message : "Failed to save training notes.");
    }
  }

  return (
    <div className="front-plugin-shell">
      <header className="front-plugin-header">
        <div>
          <p className="plugin-eyebrow">ReplyGuy</p>
          <h1>Front Sidebar Plugin</h1>
        </div>
        <button className="plugin-button secondary" type="button" onClick={() => context && void loadMessages(context)} disabled={!context || messagesLoading}>
          {messagesLoading ? "Refreshing..." : "Refresh conversation"}
        </button>
      </header>

      {contextError ? <div className="plugin-notice error">{contextError}</div> : null}
      {messagesError ? <div className="plugin-notice error">{messagesError}</div> : null}
      {draftError ? <div className="plugin-notice error">{draftError}</div> : null}
      {applySuccess ? <div className="plugin-notice success">{applySuccess}</div> : null}

      <section className="plugin-panel">
        <div className="plugin-meta-grid">
          <article className="plugin-meta-card">
            <span>Subject</span>
            <strong>{context?.conversation.subject || "No subject"}</strong>
          </article>
          <article className="plugin-meta-card">
            <span>Recipient</span>
            <strong>{context?.conversation.recipient?.handle || context?.conversation.recipient?.name || "Unknown"}</strong>
          </article>
          <article className="plugin-meta-card">
            <span>Topic</span>
            <strong>{draft?.intentLabel || "Pending"}</strong>
          </article>
        </div>

        <div className="plugin-section">
          <div className="plugin-section-header">
            <div>
              <p className="plugin-eyebrow">Customer</p>
              <h2>Selected thread</h2>
            </div>
          </div>
          <pre className="plugin-message-block">
            {latestInbound?.content?.body || "No inbound customer message found yet."}
          </pre>
        </div>

        <div className="plugin-actions">
          <button className="plugin-button primary" type="button" onClick={() => void generateDraft()} disabled={draftLoading || !latestInbound}>
            {draftLoading ? "Generating..." : "Generate ReplyGuy draft"}
          </button>
          <button className="plugin-button secondary" type="button" onClick={() => void copyDraft()} disabled={!draft?.draftReply}>
            Copy draft
          </button>
          <button className="plugin-button secondary" type="button" onClick={() => void applyDraftToFront()} disabled={!draft?.draftReply || applyState === "applying"}>
            {applyState === "applying" ? "Applying..." : "Insert into Front"}
          </button>
        </div>

        <div className="plugin-section">
          <div className="plugin-section-header">
            <div>
              <p className="plugin-eyebrow">ReplyGuy</p>
              <h2>Generated reply</h2>
            </div>
            <small>{draft ? `${draft.provider || "OpenAI"} ${draft.model || ""}`.trim() : "No draft yet"}</small>
          </div>
          <pre className="plugin-message-block assistant">
            {draft?.draftReply || "Generate a draft to preview the customer-facing reply here."}
          </pre>
        </div>

        <div className="plugin-section">
          <div className="plugin-section-header">
            <div>
              <p className="plugin-eyebrow">Coaching</p>
              <h2>Training notes</h2>
            </div>
          </div>
          <label className="plugin-field">
            <span>What should ReplyGuy learn from this draft?</span>
            <textarea
              className="plugin-textarea"
              value={trainingNotes}
              onChange={(event) => setTrainingNotes(event.target.value)}
              placeholder="Example: Strong answer, direct recommendation, good brevity. Avoid trailing open-ended close next time."
            />
          </label>
          <div className="plugin-actions">
            <button className="plugin-button secondary" type="button" onClick={() => void saveTrainingNotes()} disabled={!draft?.draftReply || trainingState === "saving"}>
              {trainingState === "saving" ? "Saving..." : "Save training note"}
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
