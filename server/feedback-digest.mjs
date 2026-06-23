import fsp from "node:fs/promises";
import path from "node:path";

const RULE_DEFINITIONS = [
  {
    id: "no-hyphen-breaks",
    label: "Avoid hyphen-style breaks",
    guidance: "Do not use hyphens or em dashes for parenthetical breaks. Use commas or parentheses instead.",
    test: (note) => /\b(?:no|avoid|remove|without|stop using)\s+(?:the\s+)?(?:em[\s-]?dashes?|dashes?|hyphens?)\b|\bem[\s-]?dash(?:es)?\b|—|long dash/i.test(note),
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
      idealReply: String(item.idealReply || ""),
      createdAt: String(item.updatedAt || item.createdAt || generatedAt),
    }));

  const recurringNotes = summarizeRecurringNotes(feedbackItems);
  const ruleSummaries = summarizeRules(feedbackItems, trainingExamples);
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

function summarizeRules(items, trainingExamples) {
  const explicitRules = RULE_DEFINITIONS
    .map((definition) => ({
      id: definition.id,
      label: definition.label,
      guidance: definition.guidance,
      count: items.reduce((total, item) => total + (definition.test(item.note) ? 1 : 0), 0),
    }))
    .filter((item) => item.count > 0);

  const preferredOpeningRules = summarizePreferredOpenings(items, trainingExamples);

  return [...explicitRules, ...preferredOpeningRules]
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

function summarizePreferredOpenings(items, trainingExamples) {
  const extracted = new Map();

  for (const item of items) {
    if (!/\b(opening|openings|start|starts|greeting|emails?\s+to\s+start|prefer emails?\s+to\s+start)\b/i.test(item.note)) {
      continue;
    }

    for (const phrase of extractOpeningPhrases(item.note)) {
      addPreferredOpening(extracted, phrase);
    }
  }

  for (const example of trainingExamples) {
    const notes = normalizeNote(example?.notes || "");
    if (!/\b(opening|openings|start|starts|greeting|emails?\s+to\s+start|prefer emails?\s+to\s+start)\b/i.test(notes)) {
      continue;
    }

    const opening = extractOpeningLine(example?.idealReply || "");
    if (opening) {
      addPreferredOpening(extracted, opening);
    }
  }

  return [...extracted.values()].map((item) => ({
    id: `preferred-opening:${canonicalizeNote(item.phrase)}`,
    label: "Preferred email opening",
    guidance: `For email replies, prefer opening with "${item.phrase}" when it fits the conversation.`,
    count: item.count,
  }));
}

function extractOpeningPhrases(note) {
  const phrases = new Set();

  const quotedMatches = [...String(note || "").matchAll(/"([^"]{4,120})"/g)];
  for (const match of quotedMatches) {
    const cleaned = normalizeOpeningPhrase(match[1]);
    if (cleaned) {
      phrases.add(cleaned);
    }
  }

  const startWithMatch = String(note || "").match(/(?:start(?:ing)?\s+with|start\s+emails?\s+with|prefer emails?\s+to\s+start with)\s+(.+)/i);
  if (startWithMatch?.[1]) {
    for (const rawPart of startWithMatch[1].split(/\bor\b|,|\/|;/i)) {
      const cleaned = normalizeOpeningPhrase(rawPart);
      if (isLikelyOpeningPhrase(cleaned)) {
        phrases.add(cleaned);
      }
    }
  }

  return [...phrases];
}

function extractOpeningLine(reply) {
  const lines = String(reply || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/^(hi|hello|thanks|thank you)\b/i.test(line)) {
      return normalizeOpeningPhrase(line);
    }
  }

  return "";
}

function normalizeOpeningPhrase(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "")
    .trim();
}

function isLikelyOpeningPhrase(value) {
  return /^(thank you|thanks|hi|hello)\b/i.test(String(value || "").trim());
}

function addPreferredOpening(store, phrase) {
  const cleaned = normalizeOpeningPhrase(phrase);
  if (!cleaned) {
    return;
  }

  const key = canonicalizeNote(cleaned);
  const current = store.get(key) || { phrase: cleaned, count: 0 };
  current.count += 1;
  store.set(key, current);
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
