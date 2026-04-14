import React from "react";

type SopDoc = {
  id: string;
  title: string;
  relativePath: string;
  extension: string;
  size: number;
  modifiedAt: string;
  isText: boolean;
  preview: string;
};

type IntentSummary = {
  intent: string;
  label: string;
  candidateCount: number;
  strongExamples: number;
};

type AnalysisSummary = {
  exportId: string;
  analyzedAt: string;
  counts: {
    conversations: number;
    replyCandidates: number;
    strongExamples: number;
    usableExamples: number;
    excludedExamples: number;
    resolvedCandidates?: number;
    likelyHumanCandidates?: number;
  };
  intents: IntentSummary[];
};

type SupportOverview = {
  fetchedAt: string;
  sops: {
    count: number;
    docs: SopDoc[];
  };
  analyses: {
    count: number;
    exports: AnalysisSummary[];
    latestExportId: string;
  };
  styleFiles: Array<{
    name: string;
    relativePath: string;
  }>;
};

type ReplyReview = {
  exportId: string;
  messageId: string;
  decision: "approved" | "rejected" | "needs-work";
  reviewer: string;
  notes: string;
  updatedAt: string;
};

type SopMatch = {
  title: string;
  relativePath: string;
  score: number;
  excerpt: string;
};

type ReplyCandidate = {
  conversationId: string;
  messageId: string;
  subject: string;
  recipient: string;
  assignee: string;
  tags: string[];
  intent: string;
  intentLabel: string;
  qualityBucket: "strong" | "usable" | "exclude";
  isResolved?: boolean;
  isLikelyHuman?: boolean;
  customerMessageRedacted?: string;
  customerPreview?: string;
  cleanedReplyRedacted: string;
  rawPreview: string;
  features: {
    wordCount: number;
    sentenceCount: number;
    questionCount: number;
  };
  sopMatches: SopMatch[];
  review?: ReplyReview | null;
};

type AnalysisDetail = {
  analysis: AnalysisSummary & {
    exportDir: string;
    styleSummary: {
      averageWordCount: number;
      guidance: string[];
    };
  };
  candidates: ReplyCandidate[];
  goldSet: {
    examples: ReplyCandidate[];
  };
};

type UnrepliedEmail = {
  conversationId: string;
  subject: string;
  recipient: string;
  assignee: string;
  receivedAt: string;
  sourceExportId: string;
  intent: string;
  intentLabel: string;
  customerPreview: string;
  customerMessageRedacted: string;
  sopMatches: SopMatch[];
  draftReply: string;
  draftNotes: string[];
  exampleReplyRedacted: string;
  exampleSubject: string;
};

type UnrepliedResponse = {
  inbox: string;
  fetchedAt: string;
  exportId: string;
  items: UnrepliedEmail[];
};

type ManualDraft = {
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
  sopMatches: SopMatch[];
  exampleReplyRedacted: string;
  exampleSubject: string;
};

type TrainingExample = {
  id: string;
  subject: string;
  customerMessage: string;
  idealReply: string;
  notes: string;
  reviewer: string;
  intent: string;
  intentLabel: string;
  createdAt: string;
  updatedAt: string;
};

type TrainingResponse = {
  fetchedAt: string;
  items: TrainingExample[];
};

type PreviewSelection =
  | { kind: "unreplied"; id: string }
  | { kind: "historical"; id: string }
  | { kind: "manual" }
  | null;

function App() {
  const [overview, setOverview] = React.useState<SupportOverview | null>(null);
  const [overviewError, setOverviewError] = React.useState("");
  const [overviewLoading, setOverviewLoading] = React.useState(false);
  const [selectedExportId, setSelectedExportId] = React.useState("");
  const [analysisDetail, setAnalysisDetail] = React.useState<AnalysisDetail | null>(null);
  const [analysisError, setAnalysisError] = React.useState("");
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [selectedPreview, setSelectedPreview] = React.useState<PreviewSelection>(null);
  const [sopError] = React.useState("");
  const [reviewerName] = React.useState("Ian");
  const [reviewSuccess, setReviewSuccess] = React.useState("");
  const [pluginMode, setPluginMode] = React.useState<"draft" | "policy">("draft");
  const [sourceMode, setSourceMode] = React.useState<"unreplied" | "manual" | "historical">("unreplied");
  const [showFullReference, setShowFullReference] = React.useState(false);
  const [showFullReply, setShowFullReply] = React.useState(false);
  const [showResources, setShowResources] = React.useState(false);
  const [unreplied, setUnreplied] = React.useState<UnrepliedResponse | null>(null);
  const [unrepliedLoading, setUnrepliedLoading] = React.useState(false);
  const [unrepliedError, setUnrepliedError] = React.useState("");
  const [manualSubject, setManualSubject] = React.useState("");
  const [manualTopic, setManualTopic] = React.useState("");
  const [manualMessage, setManualMessage] = React.useState("");
  const [manualDraft, setManualDraft] = React.useState<ManualDraft | null>(null);
  const [manualDraftLoading, setManualDraftLoading] = React.useState(false);
  const [manualDraftError, setManualDraftError] = React.useState("");
  const [trainingExamples, setTrainingExamples] = React.useState<TrainingExample[]>([]);
  const [trainingLoading, setTrainingLoading] = React.useState(false);
  const [trainingError, setTrainingError] = React.useState("");
  const [trainingReply, setTrainingReply] = React.useState("");
  const [trainingNotes, setTrainingNotes] = React.useState("");
  const [trainingSaving, setTrainingSaving] = React.useState(false);
  const [trainingSuccess, setTrainingSuccess] = React.useState("");

  React.useEffect(() => {
    void loadOverview();
    void loadUnreplied();
    void loadTrainingExamples();
  }, []);

  React.useEffect(() => {
    if (!overview) {
      return;
    }

    if (!selectedExportId && overview.analyses.latestExportId) {
      setSelectedExportId(overview.analyses.latestExportId);
    }
  }, [overview, selectedExportId]);

  React.useEffect(() => {
    if (!selectedExportId) {
      return;
    }

    void loadAnalysis(selectedExportId);
  }, [selectedExportId]);

  const visibleCandidates = React.useMemo(() => {
    if (!analysisDetail) {
      return [];
    }

    const candidatesByMessageId = new Map(
      analysisDetail.candidates.map((candidate) => [candidate.messageId, candidate] as const),
    );

    const preferred = analysisDetail.goldSet.examples.length
      ? analysisDetail.goldSet.examples.map((candidate) => candidatesByMessageId.get(candidate.messageId) || candidate)
      : analysisDetail.candidates.filter((candidate) => candidate.qualityBucket === "strong");

    return preferred.slice(0, 8);
  }, [analysisDetail]);

  const selectedUnreplied = React.useMemo(() => {
    if (selectedPreview?.kind !== "unreplied") {
      return null;
    }

    return unreplied?.items.find((item) => item.conversationId === selectedPreview.id) ?? null;
  }, [selectedPreview, unreplied]);

  const selectedHistorical = React.useMemo(() => {
    if (selectedPreview?.kind !== "historical") {
      return null;
    }

    return visibleCandidates.find((candidate) => candidate.messageId === selectedPreview.id) ?? null;
  }, [selectedPreview, visibleCandidates]);

  const selectedManual = selectedPreview?.kind === "manual" ? manualDraft : null;

  const activeReplyText = selectedManual?.draftReply
    ?? (selectedUnreplied
      ? selectedUnreplied.draftReply
      : buildPluginDraft(selectedHistorical, pluginMode));
  const activeCustomerQuery = selectedManual?.customerMessageRedacted
    ?? selectedUnreplied?.customerMessageRedacted
    ?? selectedHistorical?.customerMessageRedacted
    ?? "";
  const activeIntentLabel = selectedManual?.intentLabel ?? selectedUnreplied?.intentLabel ?? selectedHistorical?.intentLabel ?? "";
  const activeSubject = selectedManual?.subject ?? selectedUnreplied?.subject ?? selectedHistorical?.subject ?? "";
  const activeRecipient = selectedManual ? "Pasted test message" : (selectedUnreplied?.recipient ?? selectedHistorical?.recipient ?? "");
  const activeAssignee = selectedManual?.provider ? `${selectedManual.provider} ${selectedManual.model || ""}`.trim() : (selectedUnreplied?.assignee ?? selectedHistorical?.assignee ?? "");
  const activeTimestamp = selectedManual?.generatedAt ?? selectedUnreplied?.receivedAt ?? "";
  const trainingDraftChanged = trainingReply.trim() && trainingReply.trim() !== activeReplyText.trim();

  React.useEffect(() => {
    if (selectedPreview?.kind === "manual") {
      setSourceMode("manual");
      return;
    }

    if (selectedPreview?.kind === "historical") {
      setSourceMode("historical");
      return;
    }

    if (selectedPreview?.kind === "unreplied") {
      setSourceMode("unreplied");
    }
  }, [selectedPreview]);

  React.useEffect(() => {
    if (selectedPreview?.kind === "manual" && selectedManual) {
      return;
    }

    if (selectedPreview?.kind === "unreplied" && selectedUnreplied) {
      return;
    }

    if (selectedPreview?.kind === "historical" && selectedHistorical) {
      return;
    }

    if (unreplied?.items.length) {
      setSelectedPreview({ kind: "unreplied", id: unreplied.items[0].conversationId });
      return;
    }

    if (visibleCandidates.length) {
      setSelectedPreview({ kind: "historical", id: visibleCandidates[0].messageId });
      return;
    }

    setSelectedPreview(null);
  }, [selectedHistorical, selectedManual, selectedPreview, selectedUnreplied, unreplied, visibleCandidates]);

  React.useEffect(() => {
    if (sourceMode === "manual") {
      if (manualDraft && selectedPreview?.kind !== "manual") {
        setSelectedPreview({ kind: "manual" });
      }
      return;
    }

    if (sourceMode === "historical") {
      if (selectedPreview?.kind !== "historical" && visibleCandidates.length) {
        setSelectedPreview({ kind: "historical", id: visibleCandidates[0].messageId });
      }
      return;
    }

    if (sourceMode === "unreplied") {
      if (selectedPreview?.kind !== "unreplied" && unreplied?.items.length) {
        setSelectedPreview({ kind: "unreplied", id: unreplied.items[0].conversationId });
      }
    }
  }, [manualDraft, selectedPreview, sourceMode, unreplied, visibleCandidates]);

  React.useEffect(() => {
    setReviewSuccess("");
    setShowFullReference(false);
    setShowFullReply(false);
  }, [selectedHistorical, selectedUnreplied]);

  React.useEffect(() => {
    setTrainingSuccess("");
    setTrainingError("");
    setTrainingNotes("");
    setTrainingReply(activeReplyText || "");
  }, [activeReplyText, selectedPreview]);

  async function loadOverview() {
    setOverviewLoading(true);
    setOverviewError("");

    try {
      const { response, data } = await fetchJson("/api/support-lab/overview");

      if (!response.ok || !("sops" in data)) {
        throw new Error(data.error || data.detail || "Failed to load the support dashboard.");
      }

      setOverview(data);
    } catch (error) {
      setOverviewError(error instanceof Error ? error.message : "Failed to load the support dashboard.");
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadUnreplied() {
    setUnrepliedLoading(true);
    setUnrepliedError("");

    try {
      const { response, data } = await fetchJson(`/api/support-lab/unreplied?${new URLSearchParams({ inbox: "WF Help", limit: "8" }).toString()}`);

      if (!response.ok || !Array.isArray(data.items)) {
        throw new Error(data.error || data.detail || "Failed to load unreplied emails.");
      }

      setUnreplied(data);
    } catch (error) {
      setUnrepliedError(error instanceof Error ? error.message : "Failed to load unreplied emails.");
    } finally {
      setUnrepliedLoading(false);
    }
  }

  async function loadAnalysis(exportId: string) {
    setAnalysisLoading(true);
    setAnalysisError("");

    try {
      const { response, data } = await fetchJson(`/api/support-lab/analysis?${new URLSearchParams({ exportId }).toString()}`);

      if (!response.ok || !("analysis" in data)) {
        throw new Error(data.error || data.detail || "Failed to load the selected Front analysis.");
      }

      setAnalysisDetail(data);
    } catch (error) {
      setAnalysisDetail(null);
      setAnalysisError(error instanceof Error ? error.message : "Failed to load the selected Front analysis.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function loadTrainingExamples() {
    setTrainingLoading(true);
    setTrainingError("");

    try {
      const { response, data } = await fetchJson("/api/support-lab/training");
      if (!response.ok || !Array.isArray(data.items)) {
        throw new Error(data.error || data.detail || "Failed to load training examples.");
      }

      const payload = data as TrainingResponse;
      setTrainingExamples(payload.items);
    } catch (error) {
      setTrainingError(error instanceof Error ? error.message : "Failed to load training examples.");
    } finally {
      setTrainingLoading(false);
    }
  }

  async function generateManualDraft() {
    if (!manualMessage.trim()) {
      setManualDraftError("Paste a customer message first.");
      return;
    }

    setManualDraftLoading(true);
    setManualDraftError("");
    setTrainingSuccess("");

    try {
      const { response, data } = await fetchJson("/api/support-lab/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: manualSubject,
          topic: manualTopic,
          message: manualMessage,
        }),
      });

      if (!response.ok || !data.draftReply) {
        throw new Error(data.error || data.detail || "Failed to generate draft.");
      }

      setManualDraft(data);
      setSelectedPreview({ kind: "manual" });
    } catch (error) {
      setManualDraftError(error instanceof Error ? error.message : "Failed to generate draft.");
    } finally {
      setManualDraftLoading(false);
    }
  }

  async function saveTrainingExample() {
    if (!activeCustomerQuery.trim()) {
      setTrainingError("This preview does not have enough customer message context to save as training yet.");
      return;
    }

    if (!trainingReply.trim()) {
      setTrainingError("Add the ideal reply before saving a training example.");
      return;
    }

    setTrainingSaving(true);
    setTrainingError("");
    setTrainingSuccess("");

    try {
      const { response, data } = await fetchJson("/api/support-lab/training", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: activeSubject,
          topic: activeIntentLabel,
          customerMessage: activeCustomerQuery,
          idealReply: trainingReply,
          notes: trainingNotes,
          reviewer: reviewerName,
        }),
      });

      if (!response.ok || !data.item) {
        throw new Error(data.error || data.detail || "Failed to save training example.");
      }

      setTrainingSuccess("Saved as a training example.");
      await loadTrainingExamples();
    } catch (error) {
      setTrainingError(error instanceof Error ? error.message : "Failed to save training example.");
    } finally {
      setTrainingSaving(false);
    }
  }

  return (
    <div className="app-shell plugin-shell">
      <header className="plugin-hero">
        <div>
          <p className="eyebrow">ReplyGuy</p>
          <h1>Front Plugin Preview</h1>
        </div>
        <div className="hero-actions">
          <div className="hero-stat">
            <span>Unreplied emails</span>
            <strong>{unreplied?.items.length ?? 0}</strong>
          </div>
          <div className="hero-stat">
            <span>Strong replies</span>
            <strong>{analysisDetail?.analysis.counts.strongExamples ?? 0}</strong>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={() => {
              void loadOverview();
              void loadUnreplied();
            }}
            disabled={overviewLoading || unrepliedLoading}
          >
            {overviewLoading || unrepliedLoading ? "Refreshing..." : "Refresh workspace"}
          </button>
        </div>
      </header>

      {overviewError ? <div className="notice error">{overviewError}</div> : null}
      {analysisError ? <div className="notice error">{analysisError}</div> : null}
      {unrepliedError ? <div className="notice error">{unrepliedError}</div> : null}
      {manualDraftError ? <div className="notice error">{manualDraftError}</div> : null}
      {trainingError ? <div className="notice error">{trainingError}</div> : null}
      {sopError ? <div className="notice error">{sopError}</div> : null}
      {reviewSuccess ? <div className="notice success">{reviewSuccess}</div> : null}
      {trainingSuccess ? <div className="notice success">{trainingSuccess}</div> : null}

      <section className="panel plugin-preview-panel plugin-preview-panel-primary">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workbench</p>
              <h2>Plugin Surface</h2>
            </div>
            <div className="mode-switch">
              <button className={pluginMode === "draft" ? "tab-button active" : "tab-button"} type="button" onClick={() => setPluginMode("draft")}>
                Draft reply
              </button>
              <button className={pluginMode === "policy" ? "tab-button active" : "tab-button"} type="button" onClick={() => setPluginMode("policy")}>
                Internal answer
              </button>
            </div>
          </div>

          {selectedPreview ? (
            <div className="plugin-card">
              <div className="plugin-card-header">
                <div>
                  <strong>{activeSubject || "Untitled conversation"}</strong>
                  <span>{activeIntentLabel || "General support"} | {activeAssignee || "Unassigned"}</span>
                </div>
                <div className="pill-row">
                  <span className="pill">{selectedManual ? "Pasted test message" : selectedUnreplied ? "Live unreplied email" : "Historical reference"}</span>
                  <span className="pill">{pluginMode === "draft" ? "Reply draft" : "Internal guidance"}</span>
                  <span className="pill">{activeIntentLabel || "General Support"}</span>
                </div>
              </div>

              <div className="plugin-metrics meta-grid">
                <article className="mini-card">
                  <span>Recipient</span>
                  <strong>{activeRecipient || "Unknown"}</strong>
                </article>
                <article className="mini-card">
                  <span>Received</span>
                  <strong>{activeTimestamp ? formatDate(activeTimestamp) : "Historical"}</strong>
                </article>
                <article className="mini-card">
                  <span>Topic</span>
                  <strong>{activeIntentLabel || "General Support"}</strong>
                </article>
              </div>

              <div className="plugin-thread">
                <article className="thread-bubble customer">
                  <span className="thread-label">Customer query</span>
                  {activeCustomerQuery ? (
                    <>
                      <pre className={showFullReference ? "expanded-message" : ""}>
                        {showFullReference ? activeCustomerQuery : truncateText(activeCustomerQuery, 560)}
                      </pre>
                      <button className="text-button" type="button" onClick={() => setShowFullReference((current) => !current)}>
                        {showFullReference ? "Collapse customer query" : "Expand customer query"}
                      </button>
                    </>
                  ) : (
                    <p className="muted">No customer query was captured cleanly for this preview.</p>
                  )}
                </article>

                <article className="thread-bubble assistant">
                  <span className="thread-label">ReplyGuy output</span>
                  <pre className={showFullReply ? "expanded-message" : ""}>
                    {showFullReply ? activeReplyText : truncateText(activeReplyText, 900)}
                  </pre>
                  <button className="text-button" type="button" onClick={() => setShowFullReply((current) => !current)}>
                    {showFullReply ? "Collapse draft" : "Expand draft"}
                  </button>
                </article>
              </div>

              {selectedUnreplied?.draftNotes.length ? (
                <div className="guidance-list">
                  {selectedUnreplied.draftNotes.map((note) => (
                    <div key={note} className="guidance-item">{note}</div>
                  ))}
                </div>
              ) : null}

              <div className="plugin-actions">
                <button className="refresh-button" type="button" onClick={() => void loadUnreplied()}>
                  Regenerate view
                </button>
                <button className="secondary-button" type="button">Copy draft</button>
                <button className="secondary-button" type="button">Insert into Front composer</button>
              </div>

              <div className="training-editor">
                <div className="panel-heading compact">
                  <div>
                    <p className="eyebrow">Training</p>
                    <h2>Coach This Draft</h2>
                  </div>
                </div>

                <div className="training-status">
                  <span>{activeIntentLabel || "General Support"}</span>
                  <strong>{trainingDraftChanged ? "Edited before save" : "Draft looks strong as-is"}</strong>
                  <small>
                    {selectedManual
                      ? "Use this to test the model on pasted customer messages, then save the strong version or rewrite it into the one you want it to learn."
                      : selectedUnreplied
                      ? "Use this when the live draft is strong or when you want to rewrite it into the better version."
                      : "Use this to promote a historical reply into the training set or rewrite it into a better standard."}
                  </small>
                </div>

                <label className="search-field">
                  <span>Ideal reply</span>
                  <textarea
                    className="message-input"
                    value={trainingReply}
                    onChange={(event) => setTrainingReply(event.target.value)}
                    placeholder="Refine the response you actually want ReplyGuy to learn from."
                  />
                </label>

                <label className="search-field">
                  <span>Training notes</span>
                  <textarea
                    className="notes-input"
                    value={trainingNotes}
                    onChange={(event) => setTrainingNotes(event.target.value)}
                    placeholder="Explain whether this is strong already, what you edited, what tone it should keep, and what to avoid."
                  />
                </label>

                <div className="plugin-actions">
                  <button className="secondary-button" type="button" onClick={() => void saveTrainingExample()} disabled={trainingSaving}>
                    {trainingSaving ? "Saving..." : trainingDraftChanged ? "Save edited reply as training" : "Save strong reply as training"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-card">Select an unreplied email or historical reply to preview the plugin.</div>
          )}
      </section>

      <section className="panel source-panel stack">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Source Picker</p>
            <h2>Choose What Feeds The Workbench</h2>
          </div>
          <div className="mode-switch">
            <button className={sourceMode === "unreplied" ? "tab-button active" : "tab-button"} type="button" onClick={() => setSourceMode("unreplied")}>
              Unreplied
            </button>
            <button className={sourceMode === "manual" ? "tab-button active" : "tab-button"} type="button" onClick={() => setSourceMode("manual")}>
              Test Message
            </button>
            <button className={sourceMode === "historical" ? "tab-button active" : "tab-button"} type="button" onClick={() => setSourceMode("historical")}>
              Historical
            </button>
          </div>
        </div>

        {sourceMode === "unreplied" ? (
          <div className="source-stack">
            <div className="rail-summary">
              <span>{unrepliedLoading ? "Loading unreplied emails..." : formatDate(unreplied?.fetchedAt || new Date().toISOString())}</span>
              <strong>{unreplied?.items.length ?? 0} open conversations</strong>
              <small>{unreplied?.exportId ? `Source export ${unreplied.exportId}` : "No live export loaded"}</small>
            </div>

            <div className="source-list-grid">
              {(unreplied?.items ?? []).map((item) => (
                <button
                  key={item.conversationId}
                  type="button"
                  className={selectedPreview?.kind === "unreplied" && selectedPreview.id === item.conversationId ? "list-button active" : "list-button"}
                  onClick={() => setSelectedPreview({ kind: "unreplied", id: item.conversationId })}
                >
                  <strong>{item.subject}</strong>
                  <span>Topic: {item.intentLabel}</span>
                  <small>{item.recipient || "Unknown recipient"}</small>
                  <small>{item.customerPreview || "No preview available."}</small>
                </button>
              ))}
              {!unreplied?.items.length && !unrepliedLoading ? <div className="empty-card">No unreplied emails found in the latest `WF Help` export.</div> : null}
            </div>
          </div>
        ) : null}

        {sourceMode === "manual" ? (
          <div className="test-compose">
            <div className="test-compose-grid">
              <label className="search-field">
                <span>Subject</span>
                <input value={manualSubject} onChange={(event) => setManualSubject(event.target.value)} placeholder="Optional subject line" />
              </label>

              <label className="search-field">
                <span>Topic</span>
                <input value={manualTopic} onChange={(event) => setManualTopic(event.target.value)} placeholder="Optional topic override" />
              </label>
            </div>

            <label className="search-field">
              <span>Customer message</span>
              <textarea
                className="test-message-input"
                value={manualMessage}
                onChange={(event) => setManualMessage(event.target.value)}
                placeholder="Paste the customer email, chat, or support request here."
              />
            </label>

            <div className="plugin-actions">
              <button className="refresh-button" type="button" onClick={() => void generateManualDraft()} disabled={manualDraftLoading}>
                {manualDraftLoading ? "Generating..." : "Generate test draft"}
              </button>
              {manualDraft ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setSelectedPreview({ kind: "manual" });
                    setTrainingReply(manualDraft.draftReply);
                  }}
                >
                  View latest test draft
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {sourceMode === "historical" ? (
          <div className="source-stack">
            <label className="select-field">
              <span>Analysis export</span>
              <select value={selectedExportId} onChange={(event) => setSelectedExportId(event.target.value)}>
                {(overview?.analyses.exports ?? []).map((entry) => (
                  <option key={entry.exportId} value={entry.exportId}>
                    {entry.exportId}
                  </option>
                ))}
              </select>
            </label>

            <div className="rail-summary">
              <span>{analysisLoading ? "Loading analysis..." : formatDate(analysisDetail?.analysis.analyzedAt || overview?.fetchedAt || new Date().toISOString())}</span>
              <strong>{analysisDetail?.analysis.counts.replyCandidates ?? 0} reply candidates</strong>
              <small>{analysisDetail?.analysis.counts.likelyHumanCandidates ?? 0} likely human</small>
            </div>

            <div className="source-list-grid">
              {visibleCandidates.map((candidate) => (
                <button
                  key={candidate.messageId}
                  type="button"
                  className={selectedPreview?.kind === "historical" && selectedPreview.id === candidate.messageId ? "list-button active" : "list-button"}
                  onClick={() => setSelectedPreview({ kind: "historical", id: candidate.messageId })}
                >
                  <strong>{candidate.subject || "Untitled conversation"}</strong>
                  <span>Topic: {candidate.intentLabel}</span>
                  <small>{candidate.recipient || "Unknown recipient"}</small>
                  <small>{candidate.customerPreview || candidate.customerMessageRedacted || candidate.rawPreview}</small>
                  {candidate.review ? <small>Review: {candidate.review.decision}</small> : null}
                </button>
              ))}
              {!visibleCandidates.length && !analysisLoading ? <div className="empty-card">No strong examples loaded yet.</div> : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel stack dashboard-support-panel">
          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">Guidance</p>
              <h2>Generated Tone Signals</h2>
            </div>
          </div>
          <div className="guidance-list">
            {(analysisDetail?.analysis.styleSummary.guidance ?? []).map((item) => (
              <div key={item} className="guidance-item">{item}</div>
            ))}
            {!analysisDetail?.analysis.styleSummary.guidance.length ? <div className="empty-card">Load an analysis to inspect tone guidance.</div> : null}
          </div>

          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">Knowledge</p>
              <h2>Internal Resources</h2>
            </div>
          </div>
          <div className="resource-summary">
            <span>{overview?.sops.count ?? 0} SOP files</span>
            <span>{overview?.styleFiles.length ?? 0} generated guidance assets</span>
          </div>
          <button className="secondary-button" type="button" onClick={() => setShowResources((current) => !current)}>
            {showResources ? "Hide internal resources" : "See internal resources"}
          </button>
          {showResources ? (
            <div className="asset-grid compact-grid">
              {(overview?.styleFiles ?? []).slice(0, 6).map((file) => (
                <article key={file.relativePath} className="asset-card">
                  <strong>{humanizeAssetName(file.name)}</strong>
                  <span>{file.relativePath}</span>
                </article>
              ))}
              {(overview?.sops.docs ?? []).slice(0, 6).map((doc) => (
                <article key={doc.id} className="asset-card">
                  <strong>{doc.title}</strong>
                  <span>{doc.relativePath}</span>
                </article>
              ))}
            </div>
          ) : null}

          <div className="panel-heading compact">
            <div>
              <p className="eyebrow">Team Set</p>
              <h2>Recent Training Replies</h2>
            </div>
          </div>
          <div className="reply-list compact-list">
            {trainingExamples.slice(0, 6).map((item) => (
              <article key={item.id} className="asset-card">
                <strong>{item.subject || "Training example"}</strong>
                <span>{item.intentLabel} | {item.reviewer || "Team"}</span>
                <p>{truncateText(item.idealReply, 220)}</p>
              </article>
            ))}
            {!trainingExamples.length && !trainingLoading ? <div className="empty-card">No training replies saved yet.</div> : null}
          </div>
      </section>
    </div>
  );
}

function buildPluginDraft(candidate: ReplyCandidate | null, pluginMode: "draft" | "policy") {
  if (!candidate) {
    return "";
  }

  if (pluginMode === "policy") {
    const references = candidate.sopMatches.slice(0, 2).map((match) => match.title).join(", ") || "matched SOP references";
    return [
      `Recommended handling: ${candidate.intentLabel}.`,
      "",
      `Use the ${references} guidance as the primary source of truth for this response.`,
      "Answer the customer directly, keep the next step concrete, and avoid adding unsupported promises.",
      "",
      "Suggested internal note:",
      candidate.cleanedReplyRedacted,
    ].join("\n");
  }

  return candidate.cleanedReplyRedacted;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const text = await response.text();

  try {
    return {
      response,
      data: JSON.parse(text),
    };
  } catch {
    throw new Error("The running backend returned an unexpected page instead of API data. Restart the local app to load the latest server changes.");
  }
}

function humanizeAssetName(value: string) {
  return value
    .replace(".generated", "")
    .replace(/\.(md|json)$/i, "")
    .replace(/[-_]/g, " ");
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit).trimEnd()}\n\n...`;
}

export default App;
