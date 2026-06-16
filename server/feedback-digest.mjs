import fsp from "node:fs/promises";
import path from "node:path";

const RULE_DEFINITIONS = [
  {
    id: "no-em-dashes",
    label: "Avoid em dashes",
    guidance: "Do not use em dashes. Use commas, parentheses, or spaced hyphens instead.",
    test: (note) => /\bem[\s-]?dash(?:es)?\b|—|long dash/i.test(note),
  },
  {
    id: "be-concise",
    label: "Keep replies tighter",
    guidance: "Keep replies concise. Shorten openings and trim filler unless extra detail is necessary.",
    test: (note) => /\b(concise|shorter|shorten|trim|too long|wordy|tighter)\b/i.test(note),
  },
  {
    id: "be-direct",
    label: "Lead with the answer",
    guidance: "Answer the customer's question earlier and be more direct about the next step or recommendation.",
    test: (note) => /\b(direct|answer first|lead with|get to the point|next step|recommendation)\b/i.test(note),
  },
  {
    id: "sound-confident",
    label: "Use more confidence",
    guidance: "Sound more confident and practical. Avoid hedgy phrasing when the recommendation is clear.",
    test: (note) => /\b(confident|confidence|hedg|wishy|stronger recommendation)\b/i.test(note),
  },
  {
    id: "avoid-canned-empathy",
    label: "Avoid canned empathy",
    guidance: "Avoid scripted empathy, filler reassurance, and robotic support phrasing.",
    test: (note) => /\b(scripted|robotic|canned empathy|generic|overly formal|over-apolog|too much empathy)\b/i.test(note),
  },
  {
    id: "avoid-internal-language",
    label: "Keep internal reasoning out",
    guidance: "Do not mention internal reasoning, SOPs, policy language, or internal process wording in the customer reply.",
    test: (note) => /\b(internal|reasoning|sop|policy|process language|internal wording)\b/i.test(note),
  },
];

export function buildFeedbackDigest({ trainingExamples = [], generatedAt = new Date().toISOString() }) {
  const feedbackItems = trainingExamples
    .filter((item) => String(item?.notes || "").trim())
    .map((item) => ({
      id: String(item.id || ""),
      subject: String(item.subject || "Team feedback"),
      intent: String(item.intentLabel || item.intent || "General Support"),
      note: normalizeNote(item.notes),
      createdAt: String(item.updatedAt || item.createdAt || generatedAt),
    }));

  const recurringNotes = summarizeRecurringNotes(feedbackItems);
  const ruleSummaries = summarizeRules(feedbackItems);
  const recentSamples = feedbackItems
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8);

  const markdown = [
    "# Team Feedback Digest",
    "",
    "Generated from teammate feedback saved in ReplyGuy. Treat this as standing coaching guidance for future drafts, not just one-off revision notes.",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Standing guidance",
    ...(ruleSummaries.length
      ? ruleSummaries.map((rule) => `- ${rule.guidance} Mentioned ${rule.count} time${rule.count === 1 ? "" : "s"} by teammates.`)
      : ["- No recurring teammate coaching notes have been saved yet."]),
    "",
    "## Recurring teammate notes",
    ...(recurringNotes.length
      ? recurringNotes.map((item) => `- ${item.count}x: ${item.note}`)
      : ["- No recurring note patterns detected yet."]),
    "",
    "## Recent feedback samples",
    ...(recentSamples.length
      ? recentSamples.map((item) => `- [${item.intent}] ${item.note}`)
      : ["- No saved teammate feedback yet."]),
    "",
  ].join("\n");

  const keywords = Array.from(new Set([
    "team",
    "feedback",
    "coaching",
    "style",
    "reply",
    ...ruleSummaries.flatMap((rule) => tokenize(`${rule.label} ${rule.guidance}`)),
    ...recurringNotes.flatMap((item) => tokenize(item.note)),
  ]));

  return {
    generatedAt,
    feedbackCount: feedbackItems.length,
    ruleSummaries,
    recurringNotes,
    recentSamples,
    markdown,
    keywords,
  };
}

export async function writeFeedbackDigest({ trainingExamples = [], outputPath, summaryPath }) {
  const digest = buildFeedbackDigest({ trainingExamples });
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, digest.markdown, "utf8");

  if (summaryPath) {
    await fsp.mkdir(path.dirname(summaryPath), { recursive: true });
    await fsp.writeFile(summaryPath, `${JSON.stringify(digest, null, 2)}\n`, "utf8");
  }

  return digest;
}

function summarizeRules(items) {
  return RULE_DEFINITIONS
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      guidance: definition.guidance,
      count: items.reduce((total, item) => total + (definition.test(item.note) ? 1 : 0), 0),
    }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count);
}

function summarizeRecurringNotes(items) {
  const counts = new Map();

  for (const item of items) {
    const key = canonicalizeNote(item.note);
    if (!key) {
      continue;
    }

    const current = counts.get(key) || { note: item.note, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }

  return [...counts.values()]
    .filter((item) => item.count >= 1)
    .sort((left, right) => right.count - left.count)
    .slice(0, 12);
}

function normalizeNote(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeNote(value) {
  return normalizeNote(value)
    .toLowerCase()
    .replace(/[`"'.,!?;:()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 3);
}
