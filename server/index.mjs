import express from "express";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import {
  appendGenerationLog,
  buildKnowledgeGraph,
  persistKnowledgeGraph,
  readRecentGenerationLogs,
  retrieveGraphContext,
} from "./knowledge-graph.mjs";

const app = express();
const port = Number(process.env.PORT || 3001);
const localEnv = readLocalEnv();
const DIST_ROOT = path.join(process.cwd(), "dist");

const SUPPORT_ANALYSIS_ROOT = path.join(process.cwd(), "data", "front-analysis");
const SUPPORT_SOP_ROOT = path.join(process.cwd(), "knowledge", "approved", "sops");
const SUPPORT_CURATED_ROOT = path.join(process.cwd(), "knowledge", "curated", "customer-guidance");
const SUPPORT_STYLE_ROOT = path.join(process.cwd(), "knowledge", "style");
const REVIEW_DATA_ROOT = path.join(process.cwd(), "data", "reviews");
const REVIEW_STORE_PATH = path.join(REVIEW_DATA_ROOT, "reply-approvals.json");
const TRAINING_DATA_ROOT = path.join(process.cwd(), "data", "training");
const TRAINING_STORE_PATH = path.join(TRAINING_DATA_ROOT, "reply-training.json");
const KNOWLEDGE_GRAPH_ROOT = path.join(process.cwd(), "data", "knowledge-graph");
const GENERATION_LOG_ROOT = path.join(process.cwd(), "data", "generation-logs");
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_REPLY_MODEL = "gpt-5.4";

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, app: "replyguy-support-dashboard" });
});

app.get("/api/support-lab/overview", async (_request, response) => {
  try {
    const overview = await getSupportLabOverview();
    response.json(overview);
  } catch (error) {
    response.status(500).json({
      error: "Failed to load the support lab overview.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/support-lab/knowledge-graph", async (_request, response) => {
  try {
    const graph = await getReplyKnowledgeGraph();
    response.json(graph);
  } catch (error) {
    response.status(500).json({
      error: "Failed to build the ReplyGuy knowledge graph.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/support-lab/generation-logs", async (request, response) => {
  try {
    const limitValue = Number(request.query.limit || 40);
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(200, limitValue)) : 40;
    const items = await readRecentGenerationLogs({ rootDir: GENERATION_LOG_ROOT, limit });
    response.json({
      fetchedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to load generation logs.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/support-lab/analysis", async (request, response) => {
  const exportId = typeof request.query.exportId === "string" ? request.query.exportId : "";

  if (!exportId) {
    response.status(400).json({ error: "The exportId query parameter is required." });
    return;
  }

  try {
    const analysis = await getSupportAnalysisDetail(exportId);
    response.json(analysis);
  } catch (error) {
    response.status(500).json({
      error: "Failed to load the support analysis detail.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/support-lab/unreplied", async (request, response) => {
  const inbox = typeof request.query.inbox === "string" && request.query.inbox.trim()
    ? request.query.inbox.trim()
    : "WF Help";
  const limitValue = Number(request.query.limit || 8);
  const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(20, limitValue)) : 8;

  try {
    const data = await getUnrepliedEmailPreview({ inbox, limit });
    response.json(data);
  } catch (error) {
    response.status(500).json({
      error: "Failed to load unreplied emails.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/support-lab/draft", async (request, response) => {
  const subject = typeof request.body?.subject === "string" ? request.body.subject.trim() : "";
  const message = typeof request.body?.message === "string" ? request.body.message.trim() : "";
  const topic = typeof request.body?.topic === "string" ? request.body.topic.trim() : "";

  if (!message) {
    response.status(400).json({ error: "message is required." });
    return;
  }

  try {
    const draft = await generateDraftFromSubmission({ subject, message, topic });
    response.json(draft);
  } catch (error) {
    response.status(500).json({
      error: "Failed to generate draft from submission.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/support-lab/training", async (_request, response) => {
  try {
    const items = await readTrainingStore();
    response.json({
      fetchedAt: new Date().toISOString(),
      items,
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to load reply training examples.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/support-lab/training", async (request, response) => {
  const subject = typeof request.body?.subject === "string" ? request.body.subject.trim() : "";
  const customerMessage = typeof request.body?.customerMessage === "string" ? request.body.customerMessage.trim() : "";
  const idealReply = typeof request.body?.idealReply === "string" ? request.body.idealReply.trim() : "";
  const notes = typeof request.body?.notes === "string" ? request.body.notes.trim() : "";
  const reviewer = typeof request.body?.reviewer === "string" ? request.body.reviewer.trim() : "";
  const topic = typeof request.body?.topic === "string" ? request.body.topic.trim() : "";

  if (!customerMessage) {
    response.status(400).json({ error: "customerMessage is required." });
    return;
  }

  if (!idealReply) {
    response.status(400).json({ error: "idealReply is required." });
    return;
  }

  try {
    const item = await saveTrainingExample({
      subject,
      customerMessage,
      idealReply,
      notes,
      reviewer,
      topic,
    });
    response.json({
      ok: true,
      item,
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to save reply training example.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/support-lab/sop", async (request, response) => {
  const relativePath = typeof request.query.path === "string" ? request.query.path : "";

  if (!relativePath) {
    response.status(400).json({ error: "The path query parameter is required." });
    return;
  }

  try {
    const detail = await getSopDetail(relativePath);
    response.json(detail);
  } catch (error) {
    response.status(500).json({
      error: "Failed to load the SOP detail.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/support-lab/reviews", async (_request, response) => {
  try {
    const reviews = await readReviewStore();
    response.json({
      reviewedAt: new Date().toISOString(),
      items: reviews,
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to load reply reviews.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/support-lab/reviews", async (request, response) => {
  const {
    exportId,
    messageId,
    decision,
    reviewer,
    notes,
  } = request.body ?? {};

  if (typeof exportId !== "string" || !exportId.trim()) {
    response.status(400).json({ error: "exportId is required." });
    return;
  }

  if (typeof messageId !== "string" || !messageId.trim()) {
    response.status(400).json({ error: "messageId is required." });
    return;
  }

  if (decision !== "approved" && decision !== "rejected" && decision !== "needs-work") {
    response.status(400).json({ error: "decision must be approved, rejected, or needs-work." });
    return;
  }

  try {
    const review = await upsertReplyReview({
      exportId: exportId.trim(),
      messageId: messageId.trim(),
      decision,
      reviewer: typeof reviewer === "string" ? reviewer.trim() : "",
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    response.json({
      ok: true,
      review,
    });
  } catch (error) {
    response.status(500).json({
      error: "Failed to save reply review.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

async function getSupportLabOverview() {
  const [sops, analyses, styleFiles] = await Promise.all([
    listCuratedDocuments(),
    listSupportAnalyses(),
    listGeneratedStyleFiles(),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    sops: {
      count: sops.length,
      docs: sops,
    },
    analyses: {
      count: analyses.length,
      exports: analyses,
      latestExportId: analyses[0]?.exportId || "",
    },
    styleFiles,
  };
}

async function listCuratedDocuments() {
  const files = await walkFiles(SUPPORT_CURATED_ROOT);
  const docs = [];

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const stat = await fsp.stat(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const isText = [".md", ".txt", ".csv"].includes(extension);
    let title = path.basename(filePath, extension);
    let preview = "";

    if (isText) {
      const raw = await fsp.readFile(filePath, "utf8");
      title = extractMarkdownTitle(raw) || title;
      preview = collapseSupportWhitespace(stripSupportMarkdown(raw)).slice(0, 260);
    }

    docs.push({
      id: relativePath.replace(/\\/g, "/"),
      title,
      relativePath,
      extension,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      isText,
      preview,
    });
  }

  return docs.sort((left, right) => left.title.localeCompare(right.title)).slice(0, 500);
}

async function listSupportAnalyses() {
  if (!fs.existsSync(SUPPORT_ANALYSIS_ROOT)) {
    return [];
  }

  const entries = await fsp.readdir(SUPPORT_ANALYSIS_ROOT, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().reverse();
  const results = [];

  for (const name of dirs) {
    const analysisPath = path.join(SUPPORT_ANALYSIS_ROOT, name, "analysis.json");
    if (!fs.existsSync(analysisPath)) {
      continue;
    }

    const analysis = JSON.parse(await fsp.readFile(analysisPath, "utf8"));
    results.push({
      exportId: analysis.exportId,
      analyzedAt: analysis.analyzedAt,
      counts: analysis.counts,
      intents: Array.isArray(analysis.intents) ? analysis.intents.slice(0, 6) : [],
    });
  }

  return results;
}

async function listGeneratedStyleFiles() {
  if (!fs.existsSync(SUPPORT_STYLE_ROOT)) {
    return [];
  }

  const files = await walkFiles(SUPPORT_STYLE_ROOT);
  return files
    .filter((filePath) => path.basename(filePath).includes(".generated."))
    .map((filePath) => ({
      name: path.basename(filePath),
      relativePath: path.relative(process.cwd(), filePath),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function getSupportAnalysisDetail(exportId) {
  const baseDir = path.join(SUPPORT_ANALYSIS_ROOT, exportId);
  const analysisPath = path.join(baseDir, "analysis.json");
  const candidatesPath = path.join(baseDir, "reply-candidates.json");
  const goldSetPath = path.join(baseDir, "gold-set.json");

  if (!fs.existsSync(analysisPath)) {
    throw new Error(`Analysis export "${exportId}" was not found.`);
  }

  const analysis = JSON.parse(await fsp.readFile(analysisPath, "utf8"));
  const candidates = fs.existsSync(candidatesPath)
    ? JSON.parse(await fsp.readFile(candidatesPath, "utf8"))
    : [];
  const goldSet = fs.existsSync(goldSetPath)
    ? JSON.parse(await fsp.readFile(goldSetPath, "utf8"))
    : { examples: [] };
  const reviews = await readReviewStore();
  const reviewsByMessageId = Object.fromEntries(
    reviews
      .filter((item) => item.exportId === exportId)
      .map((item) => [item.messageId, item]),
  );

  return {
    analysis,
    candidates: candidates.slice(0, 250).map((candidate) => ({
      ...candidate,
      review: reviewsByMessageId[candidate.messageId] || null,
    })),
    goldSet,
  };
}

async function getUnrepliedEmailPreview({ inbox, limit }) {
  const exportMeta = await findLatestFrontExportForInbox(inbox);
  if (!exportMeta) {
    return {
      inbox,
      fetchedAt: new Date().toISOString(),
      exportId: "",
      items: [],
    };
  }

  const conversationsPath = path.join(exportMeta.exportDir, "normalized", "conversations.json");
  const conversations = fs.existsSync(conversationsPath)
    ? JSON.parse(await fsp.readFile(conversationsPath, "utf8"))
    : [];

  const [coachingDoc, customerReplyGuidelinesDoc, latestAnalysis, trainingExamples] = await Promise.all([
    getQaCoachingDoc(),
    getCustomerReplyGuidelinesDoc(),
    getLatestAnalysisCandidates(),
    readTrainingStore(),
  ]);

  const items = conversations
    .filter((conversation) => isUnrepliedConversation(conversation, inbox))
    .slice(0, limit)
    .map((conversation) =>
      buildUnrepliedEmailItem({
        conversation,
        coachingDoc,
        customerReplyGuidelinesDoc,
        analysisCandidates: latestAnalysis.candidates,
        exportId: exportMeta.exportId,
        trainingExamples,
      }),
    );

  return {
    inbox,
    fetchedAt: new Date().toISOString(),
    exportId: exportMeta.exportId,
    items,
  };
}

async function generateDraftFromSubmission({ subject, message, topic }) {
  const cleanedMessage = cleanDraftingText(message);
  const intent = topic
    ? normalizeTopicOverride(topic)
    : classifyUnrepliedIntent({
    subject,
    body: cleanedMessage,
    tags: [],
  });

  const { graph } = await getReplyKnowledgeGraph();
  const graphContext = retrieveGraphContext({
    graph,
    subject,
    message: cleanedMessage,
    intent,
  });
  const trainingMatches = formatGraphMatches(graphContext);
  const example = graphContext.historicalExamples[0]
    ? {
      cleanedReplyRedacted: graphContext.historicalExamples[0].excerpt,
      subject: graphContext.historicalExamples[0].title,
    }
    : null;
  const fallbackDraft = buildUnrepliedDraft({
    conversation: {
      recipient: { name: "", handle: "" },
    },
    customerMessage: cleanedMessage,
    intent,
    trainingMatches,
    example,
  });
  let draft;
  try {
    draft = await generateOpenAiReplyDraft({
      subject,
      message: cleanedMessage,
      intent,
      graphContext,
      trainingMatches,
      example,
      fallbackDraft,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    draft = {
      reply: fallbackDraft.reply,
      notes: [
        ...fallbackDraft.notes,
        `Live OpenAI generation was unavailable, so this used the local fallback draft. Reason: ${detail}`,
      ],
      model: "local-fallback",
      provider: "ReplyGuy",
      mode: "fallback",
    };
  }

  try {
    await appendGenerationLog({
      rootDir: GENERATION_LOG_ROOT,
      event: {
        id: `evt_${Math.random().toString(36).slice(2, 10)}`,
        generatedAt: new Date().toISOString(),
        subject: subject || "Manual submission",
        intent: intent.intent,
        intentLabel: intent.label,
        model: draft.model,
        provider: draft.provider,
        mode: draft.mode,
        retrieval: {
          topic: graphContext.topic,
          guidanceDocIds: graphContext.guidanceDocs.map((item) => item.id),
          trainingExampleIds: graphContext.trainingExamples.map((item) => item.id),
          historicalExampleIds: graphContext.historicalExamples.map((item) => item.id),
        },
        promptStats: {
          subjectChars: subject.length,
          messageChars: cleanedMessage.length,
          guidanceDocCount: graphContext.guidanceDocs.length,
          trainingExampleCount: graphContext.trainingExamples.length,
          historicalExampleCount: graphContext.historicalExamples.length,
        },
      },
    });
  } catch (error) {
    console.warn("ReplyGuy generation log write failed:", error);
  }

  return {
    generatedAt: new Date().toISOString(),
    subject: subject || "Manual submission",
    intent: intent.intent,
    intentLabel: intent.label,
    customerMessageRedacted: cleanedMessage,
    draftReply: draft.reply,
    draftNotes: draft.notes,
    model: draft.model,
    provider: draft.provider,
    generationMode: draft.mode,
    sopMatches: trainingMatches,
    exampleReplyRedacted: example?.cleanedReplyRedacted || "",
    exampleSubject: example?.subject || "",
  };
}

async function generateOpenAiReplyDraft({
  subject,
  message,
  intent,
  graphContext,
  trainingMatches,
  example,
  fallbackDraft,
}) {
  const config = getOpenAiConfig();
  if (!config.apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local to enable live reply generation.");
  }

  const systemPrompt = buildCustomerReplySystemPrompt({
    intentLabel: intent.label,
    graphContext,
  });
  const userPrompt = buildCustomerReplyUserPrompt({
    subject,
    message,
    intentLabel: intent.label,
    exampleReply: graphContext.historicalExamples[0]?.text || example?.cleanedReplyRedacted || "",
    fallbackReply: fallbackDraft.reply,
  });

  const apiResponse = await fetch(`${config.baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      reasoning: {
        effort: "medium",
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: systemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userPrompt,
            },
          ],
        },
      ],
      max_output_tokens: 700,
      text: {
        verbosity: "medium",
      },
    }),
  });

  const payload = await apiResponse.json().catch(() => null);
  if (!apiResponse.ok) {
    const detail = payload?.error?.message || payload?.detail || `OpenAI request failed with status ${apiResponse.status}.`;
    throw new Error(detail);
  }

  const outputText = collapseSupportWhitespace(extractResponseText(payload));
  if (!outputText) {
    throw new Error("OpenAI returned an empty draft.");
  }

  return {
    reply: outputText,
    notes: [
      `Generated with ${payload?.model || config.model} via OpenAI Responses API.`,
      graphContext.trainingExamples.length
        ? `Grounded in ${graphContext.trainingExamples.length} team-saved training ${graphContext.trainingExamples.length === 1 ? "example" : "examples"} for this topic.`
        : "No direct training example matched, so the draft leaned on compact guidance nodes.",
      graphContext.guidanceDocs.length
        ? `Used ${graphContext.guidanceDocs.length} guidance node${graphContext.guidanceDocs.length === 1 ? "" : "s"} for tone and structure.`
        : "No guidance nodes were needed for the first pass.",
    ],
    model: payload?.model || config.model,
    provider: "OpenAI",
    mode: "live",
  };
}

function getOpenAiConfig() {
  return {
    apiKey: readEnvValue("OPENAI_API_KEY", localEnv),
    baseUrl: (readEnvValue("OPENAI_BASE_URL", localEnv) || DEFAULT_OPENAI_BASE_URL).replace(/\/+$/, ""),
    model: readEnvValue("OPENAI_REPLY_MODEL", localEnv) || DEFAULT_OPENAI_REPLY_MODEL,
  };
}

async function getReplyKnowledgeGraph() {
  const [coachingDoc, customerReplyGuidelinesDoc, latestAnalysis, trainingExamples] = await Promise.all([
    getQaCoachingDoc(),
    getCustomerReplyGuidelinesDoc(),
    getLatestAnalysisCandidates(),
    readTrainingStore(),
  ]);

  const graph = await buildKnowledgeGraph({
    trainingExamples,
    historicalCandidates: latestAnalysis.candidates,
    guidanceDocs: [customerReplyGuidelinesDoc, coachingDoc],
  });

  await persistKnowledgeGraph({
    graph,
    rootDir: KNOWLEDGE_GRAPH_ROOT,
  });

  return graph;
}

function formatGraphMatches(graphContext) {
  return [...graphContext.trainingExamples, ...graphContext.guidanceDocs].map((item) => ({
    title: item.title,
    relativePath: item.relativePath,
    score: item.score,
    excerpt: item.excerpt,
  }));
}

function buildCustomerReplySystemPrompt({ intentLabel, graphContext }) {
  const sections = [
    "You write customer-facing email replies for Waveform.",
    "Return only the finished reply body that should be sent to the customer.",
    "Do not mention internal guidance, SOPs, training, coaching frameworks, policies, prompts, or hidden reasoning.",
    "Do not sound scripted, robotic, or support-center generic.",
    "Answer the customer's actual question first, then give the clearest practical next step.",
    `Primary topic: ${intentLabel || "General Support"}.`,
  ];

  if (graphContext.guidanceDocs.length) {
    sections.push(
      `Compact guidance nodes:\n${graphContext.guidanceDocs.map(formatGuidanceNodeForPrompt).join("\n\n")}`,
    );
  }

  if (graphContext.trainingExamples.length) {
    sections.push(
      `Team-approved examples to imitate for tone and structure:\n${graphContext.trainingExamples.map(formatTrainingNodeForPrompt).join("\n\n")}`,
    );
  }

  sections.push(
    "Important constraints:",
    "- Be concise by default.",
    "- Use plain language.",
    "- Never reference internal tools, internal docs, or internal process names.",
    "- If information is missing, ask only the minimum follow-up question needed.",
    "- Prefer confident practical guidance over generic reassurance.",
  );

  return sections.join("\n\n");
}

function buildCustomerReplyUserPrompt({ subject, message, intentLabel, exampleReply, fallbackReply }) {
  const sections = [
    `Topic: ${intentLabel || "General Support"}`,
    `Subject: ${subject || "(none provided)"}`,
    `Customer message:\n${message}`,
  ];

  if (exampleReply) {
    sections.push(`Useful reference example for structure only:\n${exampleReply.slice(0, 1800)}`);
  }

  if (fallbackReply) {
    sections.push(`Drafting starter that may be partially useful, but should be improved if needed:\n${fallbackReply.slice(0, 1200)}`);
  }

  sections.push("Write the best customer-facing reply now.");
  return sections.join("\n\n");
}

function formatTrainingNodeForPrompt(item, index) {
  return [
    `Example ${index + 1}: ${item.title || "Customer reply"}`,
    item.text ? `Context:\n${item.text.slice(0, 900)}` : "",
    item.excerpt ? `Ideal reply:\n${item.excerpt.slice(0, 900)}` : "",
    item.reviewer ? `Reviewer: ${item.reviewer}` : "",
  ].filter(Boolean).join("\n");
}

function formatGuidanceNodeForPrompt(item, index) {
  return [
    `Guidance ${index + 1}: ${item.title || "Guidance"}`,
    item.text ? item.text.slice(0, 900) : item.excerpt.slice(0, 900),
  ].filter(Boolean).join("\n");
}

function extractResponseText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  if (!Array.isArray(payload?.output)) {
    return "";
  }

  const chunks = [];
  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (typeof contentItem?.text === "string") {
        chunks.push(contentItem.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

async function findLatestFrontExportForInbox(inboxName) {
  const exportsRoot = path.join(process.cwd(), "data", "front-exports");
  if (!fs.existsSync(exportsRoot)) {
    return null;
  }

  const entries = await fsp.readdir(exportsRoot, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().reverse();

  for (const dirName of dirs) {
    const exportDir = path.join(exportsRoot, dirName);
    const manifestPath = path.join(exportDir, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(await fsp.readFile(manifestPath, "utf8"));
    const manifestInbox = String(manifest?.inbox?.name || "");
    if (manifestInbox.toLowerCase() === inboxName.toLowerCase()) {
      return {
        exportId: String(manifest.exportId || dirName),
        exportDir,
      };
    }
  }

  return null;
}

function isUnrepliedConversation(conversation, inboxName) {
  return String(conversation?.inboxName || "").toLowerCase() === inboxName.toLowerCase()
    && Number(conversation?.inboundCount || 0) > 0
    && Number(conversation?.outboundHumanReplyCount || 0) === 0
    && String(conversation?.statusCategory || "").toLowerCase() !== "archived";
}

async function getQaCoachingDoc() {
  const qaPath = path.join(SUPPORT_CURATED_ROOT, "QA Call Coaching Framework.md");
  if (!fs.existsSync(qaPath)) {
    return null;
  }

  const raw = await fsp.readFile(qaPath, "utf8");
  return {
    title: extractMarkdownTitle(raw) || "QA Call Coaching Framework",
    relativePath: path.relative(process.cwd(), qaPath),
    cleaned: collapseSupportWhitespace(stripSupportMarkdown(raw)),
    keywords: tokenizeForDrafting(raw),
  };
}

async function getCustomerReplyGuidelinesDoc() {
  const guidelinesPath = path.join(SUPPORT_STYLE_ROOT, "customer-reply-guidelines.md");
  if (!fs.existsSync(guidelinesPath)) {
    return null;
  }

  const raw = await fsp.readFile(guidelinesPath, "utf8");
  return {
    title: extractMarkdownTitle(raw) || "Customer Reply Guidelines",
    relativePath: path.relative(process.cwd(), guidelinesPath),
    cleaned: collapseSupportWhitespace(stripSupportMarkdown(raw)),
    keywords: tokenizeForDrafting(raw),
  };
}

async function getLatestAnalysisCandidates() {
  const analyses = await listSupportAnalyses();
  const latestExportId = analyses[0]?.exportId || "";
  if (!latestExportId) {
    return { candidates: [] };
  }

  const detail = await getSupportAnalysisDetail(latestExportId);
  return {
    candidates: Array.isArray(detail.candidates) ? detail.candidates : [],
  };
}

function buildUnrepliedEmailItem({ conversation, coachingDoc, customerReplyGuidelinesDoc, analysisCandidates, exportId, trainingExamples }) {
  const latestInbound = conversation.latestCustomerMessage || null;
  const customerMessage = cleanDraftingText(latestInbound?.bodyText || latestInbound?.bodyHtml || "");
  const intent = classifyUnrepliedIntent({
    subject: conversation.subject || "",
    body: customerMessage,
    tags: Array.isArray(conversation.tags) ? conversation.tags.map((tag) => tag.name).filter(Boolean) : [],
  });
  const trainingMatches = findTrainingExamples({
    subject: conversation.subject || "",
    body: customerMessage,
    intent,
    trainingExamples,
    coachingDoc,
    customerReplyGuidelinesDoc,
  });
  const example = pickHistoricalExample(intent.intent, analysisCandidates, trainingExamples);
  const draft = buildUnrepliedDraft({
    conversation,
    customerMessage,
    intent,
    trainingMatches,
    example,
  });

  return {
    conversationId: conversation.conversationId,
    subject: conversation.subject || "Untitled conversation",
    recipient: conversation.recipient?.handle || conversation.recipient?.name || "",
    assignee: conversation.assignee?.handle || "",
    receivedAt: latestInbound?.createdAt || conversation.createdAt || "",
    sourceExportId: exportId,
    intent: intent.intent,
    intentLabel: intent.label,
    customerPreview: customerMessage.slice(0, 260),
    customerMessageRedacted: customerMessage,
    sopMatches: trainingMatches,
    draftReply: draft.reply,
    draftNotes: draft.notes,
    exampleReplyRedacted: example?.cleanedReplyRedacted || "",
    exampleSubject: example?.subject || "",
  };
}

function classifyUnrepliedIntent({ subject, body, tags }) {
  const haystack = `${subject}\n${body}\n${tags.join(" ")}`.toLowerCase();
  const rules = [
    { intent: "order-status", label: "Order Status", keywords: ["order", "shipping", "ship", "tracking", "amazon pay", "when will", "status"] },
    { intent: "quote-request", label: "Quote Request", keywords: ["quote", "lead-time", "lead time", "pricing", "2ea", "part", "pn:"] },
    { intent: "returns", label: "Returns", keywords: ["return", "refund", "rma", "exchange"] },
    { intent: "compatibility", label: "Compatibility", keywords: ["compatible", "compatibility", "works with", "router", "gateway", "modem"] },
    { intent: "troubleshooting", label: "Troubleshooting", keywords: ["issue", "not working", "problem", "signal", "speed", "setup"] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule;
    }
  }

  return { intent: "general-support", label: "General Support", keywords: [] };
}

function normalizeTopicOverride(topic) {
  const normalized = String(topic || "").trim();
  if (!normalized) {
    return { intent: "general-support", label: "General Support", keywords: [] };
  }

  return {
    intent: normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general-support",
    label: normalized,
    keywords: [],
  };
}

function findTrainingExamples({ subject, body, intent, trainingExamples, coachingDoc, customerReplyGuidelinesDoc }) {
  const haystackTokens = tokenizeForDrafting(`${subject}\n${body}\n${intent.intent}\n${intent.label}`);
  const scored = trainingExamples
    .map((doc) => {
      let score = overlapScore(haystackTokens, doc.keywords);
      if (String(doc.subject || "").toLowerCase().includes(intent.label.toLowerCase())) {
        score += 5;
      }
      return {
        title: doc.subject || "Team training example",
        relativePath: `training:${doc.id}`,
        score,
        excerpt: doc.idealReply.slice(0, 280),
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  if (coachingDoc && !scored.some((item) => item.relativePath === coachingDoc.relativePath)) {
    scored.push({
      title: coachingDoc.title,
      relativePath: coachingDoc.relativePath,
      score: 90,
      excerpt: coachingDoc.cleaned.slice(0, 280),
    });
  }

  if (customerReplyGuidelinesDoc && !scored.some((item) => item.relativePath === customerReplyGuidelinesDoc.relativePath)) {
    scored.push({
      title: customerReplyGuidelinesDoc.title,
      relativePath: customerReplyGuidelinesDoc.relativePath,
      score: 100,
      excerpt: customerReplyGuidelinesDoc.cleaned.slice(0, 280),
    });
  }

  return scored.slice(0, 4);
}

function pickHistoricalExample(intent, candidates, trainingExamples = []) {
  const trained = trainingExamples.find((item) => item.intent === intent) || trainingExamples[0] || null;
  if (trained) {
    return {
      cleanedReplyRedacted: trained.idealReply,
      subject: trained.subject || "Team training example",
    };
  }

  return candidates.find((candidate) => candidate.intent === intent && candidate.qualityBucket === "strong")
    || candidates.find((candidate) => candidate.qualityBucket === "strong")
    || null;
}

function buildUnrepliedDraft({ conversation, customerMessage, intent, trainingMatches, example }) {
  const recipientName = firstNameFromConversation(conversation);
  const opening = recipientName
    ? `Hi ${recipientName},`
    : "Hi there,";
  const collaborativePrompt = "Thanks for reaching out. Let's work through this together.";
  const followUp = "If there is anything else you want me to double-check, feel free to reply here.";
  const body = customerMessage.toLowerCase();

  if (intent.intent === "order-status") {
    return {
      reply: [
        opening,
        "",
        collaborativePrompt,
        "I understand you are trying to finish your project and want clarity on shipping.",
        "Orders can sometimes take 24 to 48 hours to finish processing before the tracking movement appears, especially right after purchase.",
        "I am checking the order status on our side now so we can confirm whether it is still in processing or already moving with the carrier.",
        "Once we verify that, I can give you the clearest next step.",
        "",
        followUp,
      ].join("\n"),
      notes: [
        "Keeps the response customer-facing and avoids internal process language.",
        "Avoids promising a shipment outcome that is not confirmed in the export.",
        "Takes ownership by stating the next action clearly.",
      ],
    };
  }

  if (intent.intent === "quote-request") {
    return {
      reply: [
        opening,
        "",
        "Thanks for sending the part details through.",
        "We can help with the quote and lead-time request for the cables you listed.",
        "I am reviewing the exact part and quantity now so we can confirm pricing and availability as cleanly as possible.",
        "If there are any connector or termination details we should validate before quoting, we will call those out clearly rather than making assumptions.",
        "",
        "I will follow up with the quote details once I finish checking them.",
        followUp,
      ].join("\n"),
      notes: [
        "Answers the quote request directly in plain customer-facing language.",
        "Keeps the reply useful without inventing a lead time.",
        "Signals ownership and a clear next step.",
      ],
    };
  }

  if (intent.intent === "returns") {
    return {
      reply: [
        opening,
        "",
        collaborativePrompt,
        "I am reviewing the return request details now so we can point you to the right next step as quickly as possible.",
        "I will confirm the cleanest next step as soon as I finish reviewing the details.",
        "",
        followUp,
      ].join("\n"),
      notes: [
        "Keeps the reply customer-facing without exposing internal process language.",
        "Keeps tone calm and ownership-oriented.",
      ],
    };
  }

  const technicalLine = /\b(signal|speed|router|gateway|antenna|booster|compatib)/i.test(body)
    ? "I am reviewing the setup details you shared so we can guide you toward the best next step."
    : "I am reviewing the details you shared so we can give you the clearest next step.";

  return {
    reply: [
      opening,
      "",
      collaborativePrompt,
      technicalLine,
      "I will keep the next recommendation specific and useful.",
      "",
      followUp,
    ].join("\n"),
      notes: [
      "Built from customer reply guidelines, QA coaching, and matched training examples.",
      trainingMatches.some((item) => String(item.relativePath).startsWith("training:"))
        ? "Pulled structure from team-saved training replies rather than internal SOP policy."
        : "No saved training reply matched yet, so this relies on curated customer-facing guidance plus historical structure.",
      example?.cleanedReplyRedacted ? "Cross-checked against a historical strong reply for structure." : "No historical example was required for the first draft.",
    ],
  };
}

async function saveTrainingExample(input) {
  await fsp.mkdir(TRAINING_DATA_ROOT, { recursive: true });
  const items = await readTrainingStore();
  const now = new Date().toISOString();
  const intent = input.topic
    ? normalizeTopicOverride(input.topic)
    : classifyUnrepliedIntent({
      subject: input.subject,
      body: input.customerMessage,
      tags: [],
    });

  const item = {
    id: `train_${Date.now().toString(36)}`,
    subject: input.subject,
    customerMessage: input.customerMessage,
    idealReply: input.idealReply,
    notes: input.notes,
    reviewer: input.reviewer,
    intent: intent.intent,
    intentLabel: intent.label,
    createdAt: now,
    updatedAt: now,
    keywords: Array.from(tokenizeForDrafting(`${input.subject}\n${input.customerMessage}\n${input.idealReply}`)),
  };

  items.unshift(item);
  await fsp.writeFile(TRAINING_STORE_PATH, `${JSON.stringify(items.slice(0, 300), null, 2)}\n`, "utf8");
  return item;
}

async function readTrainingStore() {
  if (!fs.existsSync(TRAINING_STORE_PATH)) {
    return [];
  }

  const raw = JSON.parse(await fsp.readFile(TRAINING_STORE_PATH, "utf8"));
  return Array.isArray(raw)
    ? raw.map((item) => ({
      ...item,
      keywords: new Set(
        Array.isArray(item?.keywords)
          ? item.keywords
          : Array.from(tokenizeForDrafting(`${item?.subject || ""}\n${item?.customerMessage || ""}\n${item?.idealReply || ""}`)),
      ),
    }))
    : [];
}

function firstNameFromConversation(conversation) {
  const raw = String(conversation?.recipient?.name || "").trim();
  if (!raw) {
    return "";
  }

  return raw.split(/\s+/)[0].replace(/[^a-z'-]/gi, "");
}

function cleanDraftingText(value) {
  return collapseSupportWhitespace(
    stripSupportMarkdown(
      String(value || "")
        .replace(/\[Deprecated\][^\n]+/gi, " ")
        .replace(/To unsubscribe from this group[\s\S]*$/i, " ")
        .replace(/\n>[\s\S]*$/m, " ")
        .replace(/\nOn .+ wrote:[\s\S]*$/im, " "),
    ),
  );
}

function tokenizeForDrafting(value) {
  return new Set(
    String(value || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length >= 3),
  );
}

function overlapScore(leftTokens, rightTokens) {
  let score = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      score += 1;
    }
  }
  return score;
}

async function upsertReplyReview(input) {
  await fsp.mkdir(REVIEW_DATA_ROOT, { recursive: true });
  const reviews = await readReviewStore();
  const now = new Date().toISOString();
  const next = {
    exportId: input.exportId,
    messageId: input.messageId,
    decision: input.decision,
    reviewer: input.reviewer,
    notes: input.notes,
    updatedAt: now,
  };

  const existingIndex = reviews.findIndex((item) => item.exportId === input.exportId && item.messageId === input.messageId);
  if (existingIndex === -1) {
    reviews.push(next);
  } else {
    reviews[existingIndex] = next;
  }

  reviews.sort((left, right) => `${left.exportId}:${left.messageId}`.localeCompare(`${right.exportId}:${right.messageId}`));
  await fsp.writeFile(REVIEW_STORE_PATH, JSON.stringify(reviews, null, 2));
  return next;
}

async function readReviewStore() {
  if (!fs.existsSync(REVIEW_STORE_PATH)) {
    return [];
  }

  const raw = await fsp.readFile(REVIEW_STORE_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

async function getSopDetail(relativePath) {
  if (String(relativePath).startsWith("training:")) {
    const trainingId = String(relativePath).slice("training:".length);
    const items = await readTrainingStore();
    const item = items.find((entry) => entry.id === trainingId);
    if (!item) {
      throw new Error("The requested training example was not found.");
    }

    return {
      title: item.subject || "Team training example",
      relativePath,
      extension: ".md",
      size: item.idealReply.length,
      modifiedAt: item.updatedAt || item.createdAt,
      isText: true,
      content: [
        `# ${item.subject || "Team training example"}`,
        "",
        `Topic: ${item.intentLabel || item.intent || "General Support"}`,
        item.reviewer ? `Reviewer: ${item.reviewer}` : "",
        item.notes ? `Notes: ${item.notes}` : "",
        "",
        "## Customer message",
        item.customerMessage,
        "",
        "## Ideal reply",
        item.idealReply,
      ].filter(Boolean).join("\n"),
      preview: collapseSupportWhitespace(item.idealReply).slice(0, 1200),
    };
  }

  const resolvedPath = path.resolve(process.cwd(), relativePath);
  const allowedRoots = [
    path.resolve(SUPPORT_CURATED_ROOT),
    path.resolve(SUPPORT_STYLE_ROOT),
  ];

  if (!allowedRoots.some((root) => resolvedPath.startsWith(root)) || !fs.existsSync(resolvedPath)) {
    throw new Error("The requested SOP path is invalid.");
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  const isText = [".md", ".txt", ".csv"].includes(extension);
  const stat = await fsp.stat(resolvedPath);
  const raw = isText ? await fsp.readFile(resolvedPath, "utf8") : "";

  return {
    title: extractMarkdownTitle(raw) || path.basename(resolvedPath, extension),
    relativePath,
    extension,
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    isText,
    content: isText ? raw : "",
    preview: isText ? collapseSupportWhitespace(stripSupportMarkdown(raw)).slice(0, 1200) : "",
  };
}

async function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const results = [];
  const entries = await fsp.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walkFiles(entryPath));
      continue;
    }

    results.push(entryPath);
  }

  return results;
}

function extractMarkdownTitle(raw) {
  const match = String(raw).match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function stripSupportMarkdown(value) {
  return String(value)
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/`{1,3}[^`]+`{1,3}/g, " ")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_>-]/g, " ");
}

function collapseSupportWhitespace(value) {
  return String(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  const values = {};

  if (!fs.existsSync(envPath)) {
    return values;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    values[key] = rawValue.replace(/^"(.*)"$/, "$1");
  }

  return values;
}

function readEnvValue(key, envValues) {
  return process.env[key] || envValues[key] || "";
}

if (fs.existsSync(DIST_ROOT)) {
  app.use(express.static(DIST_ROOT));

  app.get("/", (_request, response) => {
    response.sendFile(path.join(DIST_ROOT, "index.html"));
  });

  app.get("/front-plugin.html", (_request, response) => {
    response.sendFile(path.join(DIST_ROOT, "front-plugin.html"));
  });
}

app.listen(port, () => {
  console.log(`ReplyGuy Front support dashboard listening on http://127.0.0.1:${port}`);
});
