import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const DEFAULT_EXPORT_ROOT = path.join(process.cwd(), "data", "front-exports");
const DEFAULT_ANALYSIS_ROOT = path.join(process.cwd(), "data", "front-analysis");
const DEFAULT_SOP_ROOT = path.join(process.cwd(), "knowledge", "approved", "sops");
const DEFAULT_STYLE_ROOT = path.join(process.cwd(), "knowledge", "style");
const DEFAULT_CURATED_ROOT = path.join(process.cwd(), "knowledge", "examples", "human-replies", "curated");

const INTENT_RULES = [
  {
    intent: "order-status",
    label: "Order Status",
    keywords: ["order status", "tracking", "where is my order", "wismo", "shipment", "shipping update", "lead time"],
    sopKeywords: ["wismo", "order", "shipping", "warehouse", "dropship", "tracking"],
  },
  {
    intent: "returns",
    label: "Returns",
    keywords: ["return", "rma", "label", "refund", "exchange", "replacement", "processing your return"],
    sopKeywords: ["return", "refund", "warranty", "label", "replacement"],
  },
  {
    intent: "installation",
    label: "Installation",
    keywords: ["install", "mount", "orientation", "setup", "placement", "antenna orientation", "installers"],
    sopKeywords: ["installation", "installers", "mount", "orientation", "setup"],
  },
  {
    intent: "compatibility",
    label: "Compatibility",
    keywords: ["compatible", "compatibility", "works with", "xr60", "router", "modem", "gateway"],
    sopKeywords: ["compatibility", "router", "modem", "gateway", "mimo"],
  },
  {
    intent: "product-recommendation",
    label: "Product Recommendation",
    keywords: ["recommend", "recommendation", "which antenna", "which booster", "coverage plan", "tower"],
    sopKeywords: ["recommendation", "coverage", "tower", "qualifying", "estimation"],
  },
  {
    intent: "troubleshooting",
    label: "Troubleshooting",
    keywords: ["troubleshoot", "issue", "problem", "not working", "signal", "speed", "latency", "diagnostic"],
    sopKeywords: ["troubleshooting", "guide", "diagnostic", "signal", "latency", "speed"],
  },
  {
    intent: "warranty",
    label: "Warranty",
    keywords: ["warranty", "warranties", "repair", "go x repairs", "registration"],
    sopKeywords: ["warranty", "repair", "registration", "go x"],
  },
  {
    intent: "commercial",
    label: "Commercial",
    keywords: ["commercial", "project", "quote", "estimation", "site", "floodgate", "office", "enterprise"],
    sopKeywords: ["commercial", "quote", "estimation", "turnkey", "design", "installer"],
  },
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const exportDir = args.exportDir
    ? path.resolve(process.cwd(), args.exportDir)
    : await findLatestExportDir(DEFAULT_EXPORT_ROOT);

  if (!exportDir) {
    throw new Error("No Front export directory was found. Run the exporter first.");
  }

  const analysisRoot = path.resolve(process.cwd(), args.outDir || DEFAULT_ANALYSIS_ROOT);
  const sopRoot = path.resolve(process.cwd(), args.sopDir || DEFAULT_SOP_ROOT);
  const styleRoot = path.resolve(process.cwd(), args.styleDir || DEFAULT_STYLE_ROOT);
  const curatedRoot = path.resolve(process.cwd(), args.curatedDir || DEFAULT_CURATED_ROOT);

  const conversationsPath = path.join(exportDir, "normalized", "conversations.json");
  const manifestPath = path.join(exportDir, "manifest.json");

  if (!fs.existsSync(conversationsPath)) {
    throw new Error(`Expected normalized conversations at ${conversationsPath}`);
  }

  const [conversations, manifest] = await Promise.all([
    readJson(conversationsPath),
    fs.existsSync(manifestPath) ? readJson(manifestPath) : Promise.resolve(null),
  ]);

  console.log(`Analyzing export ${path.basename(exportDir)}...`);
  console.log(`Conversations loaded: ${conversations.length}`);

  const knowledgeDocs = await collectKnowledgeDocs(sopRoot);
  console.log(`Indexed SOP documents: ${knowledgeDocs.length}`);

  const replyCandidates = buildReplyCandidates(conversations, knowledgeDocs);
  const styleSummary = buildStyleSummary(replyCandidates);
  const phraseSummary = buildPhraseSummary(replyCandidates);
  const intentSummary = buildIntentSummary(replyCandidates, knowledgeDocs);

  const exportId = manifest?.exportId || path.basename(exportDir);
  const analysisDir = path.join(analysisRoot, exportId);
  await fsp.mkdir(analysisDir, { recursive: true });
  await fsp.mkdir(styleRoot, { recursive: true });
  await fsp.mkdir(curatedRoot, { recursive: true });
  await fsp.mkdir(path.join(styleRoot, "intent-playbooks"), { recursive: true });

  const analysisPayload = {
    exportId,
    exportDir,
    analyzedAt: new Date().toISOString(),
    counts: {
      conversations: conversations.length,
      replyCandidates: replyCandidates.length,
      strongExamples: replyCandidates.filter((item) => item.qualityBucket === "strong").length,
      usableExamples: replyCandidates.filter((item) => item.qualityBucket === "usable").length,
      excludedExamples: replyCandidates.filter((item) => item.qualityBucket === "exclude").length,
      resolvedCandidates: replyCandidates.filter((item) => item.isResolved).length,
      likelyHumanCandidates: replyCandidates.filter((item) => item.isLikelyHuman).length,
    },
    intents: intentSummary,
    styleSummary,
    phraseSummary,
  };

  await writeJson(path.join(analysisDir, "analysis.json"), analysisPayload);
  await writeJson(path.join(analysisDir, "reply-candidates.json"), replyCandidates);
  await writeJson(path.join(analysisDir, "knowledge-index.json"), knowledgeDocs);
  await writeJson(
    path.join(analysisDir, "gold-set.json"),
    {
      exportId,
      generatedAt: new Date().toISOString(),
      examples: replyCandidates
        .filter((item) => item.qualityBucket === "strong" && item.isResolved && item.isLikelyHuman)
        .slice(0, 100),
    },
  );

  await writeFile(
    path.join(styleRoot, "tone-guide.generated.md"),
    buildToneGuideMarkdown({ styleSummary, intentSummary, exportId }),
  );
  await writeFile(
    path.join(styleRoot, "approved-phrases.generated.md"),
    buildApprovedPhrasesMarkdown(phraseSummary),
  );
  await writeFile(
    path.join(styleRoot, "avoid-phrases.generated.md"),
    buildAvoidPhrasesMarkdown(phraseSummary),
  );

  for (const intent of intentSummary) {
    await writeFile(
      path.join(styleRoot, "intent-playbooks", `${intent.intent}.generated.md`),
      buildIntentPlaybookMarkdown(intent),
    );
  }

  for (const intent of intentSummary) {
    const curatedExamples = replyCandidates
      .filter((item) => item.intent === intent.intent && item.qualityBucket === "strong")
      .slice(0, 8);

    await writeJson(
      path.join(curatedRoot, `${intent.intent}.generated.json`),
      {
        intent: intent.intent,
        label: intent.label,
        generatedFromExport: exportId,
        examples: curatedExamples.map((item) => ({
          conversationId: item.conversationId,
          messageId: item.messageId,
          subject: item.subject,
          cleanedReply: item.cleanedReplyRedacted,
          features: item.features,
          sopMatches: item.sopMatches,
        })),
      },
    );
  }

  console.log(`Analysis complete: ${analysisDir}`);
  console.log(`Strong examples: ${analysisPayload.counts.strongExamples}`);
  console.log(`Generated tone guide: ${path.join(styleRoot, "tone-guide.generated.md")}`);
}

function parseArgs(argv) {
  const args = {
    help: false,
    exportDir: "",
    outDir: "",
    sopDir: "",
    styleDir: "",
    curatedDir: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--help" || value === "-h") {
      args.help = true;
      continue;
    }

    if (value === "--export-dir") {
      args.exportDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--out-dir") {
      args.outDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--sop-dir") {
      args.sopDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--style-dir") {
      args.styleDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--curated-dir") {
      args.curatedDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/analyze-front-history.mjs [options]

Options:
  --export-dir <path>   Export directory to analyze (defaults to latest under data/front-exports)
  --out-dir <path>      Analysis output root (default: data/front-analysis)
  --sop-dir <path>      SOP source directory (default: knowledge/approved/sops)
  --style-dir <path>    Generated style output directory (default: knowledge/style)
  --curated-dir <path>  Generated curated example directory (default: knowledge/examples/human-replies/curated)
  --help                Show this help text

Example:
  npm run front:analyze -- --export-dir data/front-exports/2026-03-25T20-14-53-529Z
`);
}

async function findLatestExportDir(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return "";
  }

  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return dirs.length ? path.join(rootDir, dirs.at(-1)) : "";
}

async function collectKnowledgeDocs(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const files = await walkFiles(rootDir);
  const textFiles = files.filter((filePath) => /\.(md|txt|csv)$/i.test(filePath));
  const docs = [];

  for (const filePath of textFiles) {
    const raw = await fsp.readFile(filePath, "utf8");
    const cleaned = collapseWhitespace(stripMarkdownNoise(normalizeMojibake(raw)));
    if (!cleaned) {
      continue;
    }

    const title = extractTitleFromMarkdown(raw) || path.basename(filePath, path.extname(filePath));
    docs.push({
      title,
      filePath,
      relativePath: path.relative(process.cwd(), filePath),
      keywords: buildKeywordSet(`${title}\n${cleaned.slice(0, 2500)}`),
      excerpt: cleaned.slice(0, 600),
    });
  }

  return docs;
}

async function walkFiles(rootDir) {
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

function buildReplyCandidates(conversations, knowledgeDocs) {
  const candidates = [];

  for (const conversation of conversations) {
    const subject = conversation.subject || "";
    const tags = Array.isArray(conversation.tags) ? conversation.tags.map((tag) => tag.name).filter(Boolean) : [];
    const recipient = conversation.recipient?.handle || "";

    const orderedMessages = Array.isArray(conversation.messages) ? conversation.messages : [];

    for (let index = 0; index < orderedMessages.length; index += 1) {
      const message = orderedMessages[index];
      if (message.direction !== "outbound" || message.isAutoReply) {
        continue;
      }

      const cleanedReply = cleanReplyBody(message.bodyText || message.bodyHtml || "");
      const cleanedReplyRedacted = redactSensitiveData(cleanedReply);
      const contextMessage = findContextInboundMessage(orderedMessages, index);
      const cleanedCustomerMessage = normalizeCustomerContext(cleanReplyBody(
        contextMessage?.bodyText || contextMessage?.bodyHtml || "",
      ));
      const cleanedCustomerMessageRedacted = redactSensitiveData(cleanedCustomerMessage);
      const features = analyzeReplyFeatures(cleanedReply);
      const intent = classifyIntent({ subject, tags, reply: cleanedReply, conversation });
      const sopMatches = findRelevantSops({ intent, subject, reply: cleanedReply, knowledgeDocs });
      const qualityBucket = scoreQualityBucket({ cleanedReply, features, conversation });
      const isResolved = conversation.statusCategory === "resolved" || conversation.status === "archived";
      const isLikelyHuman = !String(conversation.assignee?.handle || "").includes("suggested_reply@");

      candidates.push({
        conversationId: conversation.conversationId,
        messageId: message.messageId,
        subject,
        recipient: redactSensitiveData(recipient),
        assignee: conversation.assignee?.handle || "",
        tags,
        intent: intent.intent,
        intentLabel: intent.label,
        qualityBucket,
        isResolved,
        isLikelyHuman,
        cleanedReplyRedacted,
        customerMessageRedacted: cleanedCustomerMessageRedacted,
        customerPreview: cleanedCustomerMessageRedacted.slice(0, 300),
        rawPreview: redactSensitiveData(cleanedReply.slice(0, 300)),
        features,
        sopMatches,
      });
    }
  }

  return candidates.sort((left, right) => {
    const qualityOrder = bucketRank(left.qualityBucket) - bucketRank(right.qualityBucket);
    if (qualityOrder !== 0) {
      return qualityOrder;
    }

    return right.features.wordCount - left.features.wordCount;
  });
}

function findContextInboundMessage(messages, outboundIndex) {
  for (let index = outboundIndex - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (candidate?.direction === "inbound" && isMeaningfulCustomerContext(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isMeaningfulCustomerContext(message) {
  const cleaned = normalizeCustomerContext(cleanReplyBody(message?.bodyText || message?.bodyHtml || ""));
  if (!cleaned || cleaned.length < 40) {
    return false;
  }

  if (/^on .+ wrote:\s*>*$/ims.test(cleaned)) {
    return false;
  }

  const meaningfulLines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^>/.test(line))
    .filter((line) => !/^on .+$/i.test(line))
    .filter((line) => !/^wrote:$/i.test(line))
    .filter((line) => !/^on .+ wrote:$/i.test(line))
    .filter((line) => !/^[-]{2,}\s*forwarded message\s*[-]{2,}$/i.test(line))
    .filter((line) => !/^(from|date|subject|to):/i.test(line));

  return meaningfulLines.join(" ").length >= 40;
}

function normalizeCustomerContext(cleaned) {
  const value = String(cleaned || "").trim();
  if (!value) {
    return "";
  }

  if (/^on .*\n?wrote:\s*(\n|$)/im.test(value)) {
    return "";
  }

  if (/^[-]{2,}\s*forwarded message\s*[-]{2,}$/im.test(value)) {
    return "";
  }

  return value;
}

function cleanReplyBody(value) {
  let cleaned = normalizeMojibake(value);
  cleaned = stripHtml(cleaned);
  cleaned = cleaned
    .replace(/\[image:[^\]]+\]/gi, " ")
    .replace(/\[[^\]]*Survey[^\]]*\]/gi, " ")
    .replace(/\[[^\]]*social-icon[^\]]*\]/gi, " ")
    .replace(/\[avatar\]/gi, " ")
    .replace(/\[banner\]/gi, " ")
    .replace(/\[Deprecated\][^\n]+/gi, " ");

  cleaned = splitBeforeQuotedThread(cleaned);
  cleaned = stripSignature(cleaned);
  cleaned = collapseWhitespace(cleaned);
  return cleaned;
}

function splitBeforeQuotedThread(value) {
  const markers = [
    /\nOn .+ wrote:\s*$/im,
    /\nFrom:\s.+$/im,
    /\n-----Original Message-----$/im,
    /\nSent from Front$/im,
    /\nHow Did We Do\?:$/im,
    /\nCONFIDENTIALITY NOTICE:/im,
  ];

  let earliest = value.length;
  for (const marker of markers) {
    const match = marker.exec(value);
    if (match && typeof match.index === "number") {
      earliest = Math.min(earliest, match.index);
    }
  }

  return value.slice(0, earliest);
}

function stripSignature(value) {
  const lines = value.split("\n");
  const signatureStarts = [
    /^regards[,]?$/i,
    /^best[,]?$/i,
    /^kind regards[,]?$/i,
    /^thanks[,]?$/i,
    /^thank you[,]?$/i,
    /^cheers[,]?$/i,
  ];

  let cutIndex = lines.length;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (signatureStarts.some((pattern) => pattern.test(line))) {
      cutIndex = Math.min(cutIndex, index + 2);
      break;
    }
  }

  return lines.slice(0, cutIndex).join("\n");
}

function analyzeReplyFeatures(reply) {
  const lines = reply.split("\n").map((line) => line.trim()).filter(Boolean);
  const text = reply.toLowerCase();
  const firstLine = lines[0] || "";
  const sentenceCount = (reply.match(/[.!?](?:\s|$)/g) || []).length || 1;
  const wordCount = tokenize(reply).length;

  return {
    wordCount,
    sentenceCount,
    startsWithGreeting: /^(hi|hello|dear|good (morning|afternoon|evening))/i.test(firstLine),
    hasThanks: /\b(thank you|thanks|appreciate)\b/i.test(text),
    hasEmpathy: /\b(i understand|i can see how|sorry|happy to help|glad to)\b/i.test(text),
    hasClarifyingQuestion: /\?\s*$/.test(reply) || /\b(can you|could you|would you|please share|please confirm)\b/i.test(text),
    hasNextStep: /\b(please|next step|you can|i recommend|we can|i will|let me know)\b/i.test(text),
    hasClosing: /\b(let me know|happy to help|if you have any other questions|reach out)\b/i.test(text),
    hasLinks: /https?:\/\//i.test(reply),
    paragraphCount: lines.length,
    questionCount: (reply.match(/\?/g) || []).length,
  };
}

function classifyIntent({ subject, tags, reply, conversation }) {
  const haystack = `${subject}\n${tags.join(" ")}\n${reply}\n${conversation.latestCustomerMessage?.bodyText || ""}`.toLowerCase();

  let best = {
    intent: "general-support",
    label: "General Support",
    score: 0,
  };

  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (haystack.includes(keyword)) {
        score += keyword.includes(" ") ? 3 : 2;
      }
    }

    if (score > best.score) {
      best = {
        intent: rule.intent,
        label: rule.label,
        score,
      };
    }
  }

  return best;
}

function findRelevantSops({ intent, subject, reply, knowledgeDocs }) {
  const rule = INTENT_RULES.find((entry) => entry.intent === intent.intent);
  const keywordSet = buildKeywordSet(`${subject}\n${reply}`);
  const ranked = knowledgeDocs
    .map((doc) => ({
      title: doc.title,
      relativePath: doc.relativePath,
      score: scoreDocMatch(doc, keywordSet, rule?.sopKeywords || []),
      excerpt: doc.excerpt,
    }))
    .filter((doc) => doc.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  return ranked;
}

function scoreDocMatch(doc, keywordSet, intentKeywords) {
  let score = 0;
  for (const token of keywordSet) {
    if (doc.keywords.has(token)) {
      score += 1;
    }
  }

  for (const keyword of intentKeywords) {
    if (doc.keywords.has(keyword.toLowerCase())) {
      score += 3;
    }
  }

  return score;
}

function scoreQualityBucket({ cleanedReply, features, conversation }) {
  if (!cleanedReply || cleanedReply.length < 60) {
    return "exclude";
  }

  const lower = cleanedReply.toLowerCase();
  if (lower.includes("survey") || lower.includes("social-icon") || lower.includes("sent from front")) {
    return "exclude";
  }

  let score = 0;
  if (features.startsWithGreeting) {
    score += 1;
  }
  if (features.hasThanks || features.hasEmpathy) {
    score += 1;
  }
  if (features.hasNextStep) {
    score += 1;
  }
  if (features.hasClosing) {
    score += 1;
  }
  if (features.wordCount >= 60 && features.wordCount <= 350) {
    score += 1;
  }
  if (conversation.statusCategory === "resolved" || conversation.status === "archived") {
    score += 1;
  }
  if (conversation.statusCategory === "open" || conversation.statusCategory === "assigned") {
    score -= 1;
  }
  if (features.wordCount > 500) {
    score -= 1;
  }
  if ((conversation.assignee?.handle || "").includes("suggested_reply@")) {
    score -= 3;
  }

  if (score >= 4) {
    return "strong";
  }

  if (score >= 2) {
    return "usable";
  }

  return "exclude";
}

function buildStyleSummary(candidates) {
  const usable = candidates.filter((item) => item.qualityBucket !== "exclude");
  const strong = candidates.filter((item) => item.qualityBucket === "strong");
  const source = strong.length ? strong : usable;

  return {
    sampleSize: candidates.length,
    analyzedSetSize: source.length,
    averageWordCount: average(source.map((item) => item.features.wordCount)),
    greetingRate: ratio(source, (item) => item.features.startsWithGreeting),
    thanksRate: ratio(source, (item) => item.features.hasThanks),
    empathyRate: ratio(source, (item) => item.features.hasEmpathy),
    nextStepRate: ratio(source, (item) => item.features.hasNextStep),
    closingRate: ratio(source, (item) => item.features.hasClosing),
    questionRate: ratio(source, (item) => item.features.questionCount > 0),
    guidance: inferStyleGuidance(source),
  };
}

function buildPhraseSummary(candidates) {
  const strong = candidates.filter((item) => item.qualityBucket === "strong");
  const usable = strong.length ? strong : candidates.filter((item) => item.qualityBucket !== "exclude");
  const openings = new Map();
  const closings = new Map();
  const avoid = new Map();

  for (const item of usable) {
    const lines = item.cleanedReplyRedacted.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) {
      continue;
    }

    const opening = lines[0];
    if (opening.length <= 120) {
      const normalizedOpening = normalizePhraseTemplate(opening);
      if (/^(Hi|Hello|Dear) \[Name\][,!]?$/i.test(normalizedOpening)) {
        openings.set(normalizedOpening, (openings.get(normalizedOpening) || 0) + 1);
      }
    }

    const closing = lines.at(-1);
    if (closing && closing.length <= 150) {
      const normalizedClosing = normalizePhraseTemplate(closing);
      closings.set(normalizedClosing, (closings.get(normalizedClosing) || 0) + 1);
    }

    for (const phrase of detectAvoidPhrases(item.cleanedReplyRedacted)) {
      avoid.set(phrase, (avoid.get(phrase) || 0) + 1);
    }
  }

  return {
    openings: topMapEntries(openings, 10),
    closings: topMapEntries(closings, 10),
    avoid: topMapEntries(avoid, 10),
  };
}

function detectAvoidPhrases(reply) {
  const lower = reply.toLowerCase();
  const phrases = [];

  if (lower.includes("i think")) {
    phrases.push("i think");
  }
  if (lower.includes("should be")) {
    phrases.push("should be");
  }
  if (lower.includes("probably")) {
    phrases.push("probably");
  }
  if (lower.includes("not certain")) {
    phrases.push("not certain");
  }

  return phrases;
}

function normalizePhraseTemplate(value) {
  return value
    .replace(/^(hi|hello|dear)\s+[^,!]+[,!]?/i, (match, greeting) => `${capitalize(greeting)} [Name],`)
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "[email]")
    .replace(/\b\d{5,}\b/g, "[number]");
}

function buildIntentSummary(candidates, knowledgeDocs) {
  const grouped = new Map();

  for (const candidate of candidates) {
    if (!grouped.has(candidate.intent)) {
      grouped.set(candidate.intent, {
        intent: candidate.intent,
        label: candidate.intentLabel,
        candidateCount: 0,
        strongExamples: 0,
        commonTags: new Map(),
      });
    }

    const entry = grouped.get(candidate.intent);
    entry.candidateCount += 1;
    if (candidate.qualityBucket === "strong") {
      entry.strongExamples += 1;
    }

    for (const tag of candidate.tags) {
      entry.commonTags.set(tag, (entry.commonTags.get(tag) || 0) + 1);
    }
  }

  return [...grouped.values()]
    .map((entry) => {
      const strongExamples = candidates
        .filter((item) => item.intent === entry.intent && item.qualityBucket === "strong")
        .slice(0, 3);

      const sopMatches = mergeSopMatches(
        candidates
          .filter((item) => item.intent === entry.intent)
          .flatMap((item) => item.sopMatches),
      ).slice(0, 5);

      return {
        intent: entry.intent,
        label: entry.label,
        candidateCount: entry.candidateCount,
        strongExamples: entry.strongExamples,
        commonTags: topMapEntries(entry.commonTags, 5),
        sampleReplies: strongExamples.map((item) => item.cleanedReplyRedacted),
        sopMatches,
        knowledgeDocCount: knowledgeDocs.length,
      };
    })
    .sort((left, right) => right.candidateCount - left.candidateCount);
}

function mergeSopMatches(matches) {
  const merged = new Map();

  for (const match of matches) {
    const key = match.relativePath;
    const current = merged.get(key) || {
      title: match.title,
      relativePath: match.relativePath,
      score: 0,
      excerpt: match.excerpt,
    };

    current.score += match.score;
    merged.set(key, current);
  }

  return [...merged.values()].sort((left, right) => right.score - left.score);
}

function inferStyleGuidance(items) {
  if (!items.length) {
    return [];
  }

  const guidance = [];
  const avgWords = average(items.map((item) => item.features.wordCount));
  guidance.push(avgWords > 220
    ? "Replies often lean detailed and explanatory; keep drafts thorough but structured."
    : "Replies tend to stay concise; favor shorter explanations unless the issue is technical.");

  if (ratio(items, (item) => item.features.startsWithGreeting) >= 0.7) {
    guidance.push("Open with a direct, friendly greeting using the customer's name when available.");
  }

  if (ratio(items, (item) => item.features.hasThanks || item.features.hasEmpathy) >= 0.6) {
    guidance.push("Acknowledge the customer early with thanks or empathy before moving into the answer.");
  }

  if (ratio(items, (item) => item.features.hasNextStep) >= 0.6) {
    guidance.push("Include a clear next step or request for information rather than ending on explanation alone.");
  }

  if (ratio(items, (item) => item.features.hasClosing) >= 0.4) {
    guidance.push("Close by inviting follow-up questions and signaling continued help.");
  }

  return guidance;
}

function buildToneGuideMarkdown({ styleSummary, intentSummary, exportId }) {
  const topIntents = intentSummary.slice(0, 5);
  return `# Generated Tone Guide

Generated from Front export \`${exportId}\`.

## Working Voice

${styleSummary.guidance.map((line) => `- ${line}`).join("\n")}

## Measured Signals

- Average word count: ${styleSummary.averageWordCount}
- Greeting rate: ${styleSummary.greetingRate}%
- Thanks or empathy rate: ${Math.max(styleSummary.thanksRate, styleSummary.empathyRate)}%
- Next-step rate: ${styleSummary.nextStepRate}%
- Closing rate: ${styleSummary.closingRate}%

## Top Intent Areas

${topIntents.map((intent) => `- ${intent.label}: ${intent.candidateCount} candidate replies, ${intent.strongExamples} strong examples`).join("\n")}

## Usage Notes

- Use this guide for tone and structure, not policy.
- Check generated claims against SOP content before using them in AI replies.
- Prefer the intent playbooks for intent-specific structure and phrasing.
`;
}

function buildApprovedPhrasesMarkdown(phraseSummary) {
  return `# Generated Approved Phrases

## Strong Openings

${phraseSummary.openings.length
    ? phraseSummary.openings.map((item) => `- ${item.value}`).join("\n")
    : "- No consistent opening phrases detected yet."}

## Strong Closings

${phraseSummary.closings.length
    ? phraseSummary.closings.map((item) => `- ${item.value}`).join("\n")
    : "- No consistent closing phrases detected yet."}
`;
}

function buildAvoidPhrasesMarkdown(phraseSummary) {
  return `# Generated Avoid Phrases

These phrases appeared in usable replies but can lead to hedging or ambiguity. Treat them as review triggers, not hard bans.

${phraseSummary.avoid.length
    ? phraseSummary.avoid.map((item) => `- ${item.value}`).join("\n")
    : "- No recurring ambiguity phrases detected in this sample."}
`;
}

function buildIntentPlaybookMarkdown(intent) {
  const sampleReplies = intent.sampleReplies.length
    ? intent.sampleReplies.map((reply) => `> ${reply.replace(/\n/g, "\n> ")}`).join("\n\n")
    : "> No strong examples in the current sample.";

  const sopRefs = intent.sopMatches.length
    ? intent.sopMatches.map((match) => `- ${match.title} (${match.relativePath})`).join("\n")
    : "- No likely SOP matches detected yet.";

  return `# ${intent.label} Playbook

## Current Sample Size

- Candidate replies: ${intent.candidateCount}
- Strong examples: ${intent.strongExamples}

## Common Tags

${intent.commonTags.length
    ? intent.commonTags.map((tag) => `- ${tag.value}`).join("\n")
    : "- No recurring Front tags in this sample."}

## Likely SOP References

${sopRefs}

## Example Reply Patterns

${sampleReplies}
`;
}

function bucketRank(bucket) {
  if (bucket === "strong") {
    return 0;
  }
  if (bucket === "usable") {
    return 1;
  }
  return 2;
}

function topMapEntries(map, limit) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value;
}

function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

function ratio(items, predicate) {
  if (!items.length) {
    return 0;
  }

  const count = items.filter(predicate).length;
  return Math.round((count / items.length) * 100);
}

function tokenize(value) {
  return value.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || [];
}

function buildKeywordSet(value) {
  const tokens = tokenize(normalizeMojibake(value));
  return new Set(tokens);
}

function extractTitleFromMarkdown(raw) {
  const match = raw.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function stripMarkdownNoise(value) {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/`{1,3}[^`]+`{1,3}/g, " ")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_>-]/g, " ");
}

function redactSensitiveData(value) {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d().\-\s]{7,}\d/g, "[phone]")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/\b\d{5,}\b/g, "[number]");
}

function normalizeMojibake(value) {
  return String(value)
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, "\"")
    .replace(/â€/g, "\"")
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "-")
    .replace(/Â /g, " ")
    .replace(/Â/g, " ");
}

function stripHtml(value) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function collapseWhitespace(value) {
  return String(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readJson(filePath) {
  const raw = await fsp.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeFile(filePath, contents) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${contents.trim()}\n`, "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
