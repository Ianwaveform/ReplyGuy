import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export async function buildKnowledgeGraph({
  trainingExamples = [],
  historicalCandidates = [],
  guidanceDocs = [],
}) {
  const topics = new Map();
  const nodes = [];
  const edges = [];

  for (const guidanceDoc of guidanceDocs.filter(Boolean)) {
    const docId = `guidance:${slugify(guidanceDoc.title || guidanceDoc.relativePath || "guidance")}`;
    nodes.push({
      id: docId,
      type: "guidance_doc",
      title: guidanceDoc.title || "Guidance",
      topic: "global",
      text: String(guidanceDoc.cleaned || ""),
      excerpt: String(guidanceDoc.cleaned || "").slice(0, 400),
      relativePath: guidanceDoc.relativePath || "",
      tags: Array.isArray(guidanceDoc.tags) ? guidanceDoc.tags : [],
      keywords: Array.from(asTokenSet(guidanceDoc.keywords || guidanceDoc.cleaned || "")),
    });
  }

  for (const item of trainingExamples) {
    const topic = String(item.intent || "general-support");
    ensureTopicNode({ topics, nodes, topic, label: item.intentLabel || humanizeTopic(topic) });
    const nodeId = `training:${item.id}`;
    nodes.push({
      id: nodeId,
      type: "training_example",
      title: item.subject || item.intentLabel || "Training reply",
      topic,
      text: `${item.customerMessage || ""}\n${item.idealReply || ""}\n${item.notes || ""}`.trim(),
      excerpt: String(item.idealReply || "").slice(0, 500),
      relativePath: `training:${item.id}`,
      reviewer: item.reviewer || "",
      keywords: Array.from(asTokenSet(item.keywords || `${item.subject || ""}\n${item.customerMessage || ""}\n${item.idealReply || ""}`)),
    });
    edges.push({
      from: nodeId,
      to: `topic:${topic}`,
      type: "belongs_to_topic",
      weight: 1,
    });
  }

  for (const candidate of historicalCandidates.filter(Boolean).slice(0, 200)) {
    const topic = String(candidate.intent || "general-support");
    ensureTopicNode({ topics, nodes, topic, label: candidate.intentLabel || humanizeTopic(topic) });
    const nodeId = `historical:${candidate.messageId || slugify(candidate.subject || candidate.intent || "reply")}`;
    nodes.push({
      id: nodeId,
      type: "historical_example",
      title: candidate.subject || candidate.intentLabel || "Historical reply",
      topic,
      text: `${candidate.customerMessageRedacted || ""}\n${candidate.cleanedReplyRedacted || candidate.replyRedacted || ""}`.trim(),
      excerpt: String(candidate.cleanedReplyRedacted || candidate.replyRedacted || "").slice(0, 500),
      relativePath: candidate.relativePath || "",
      messageId: candidate.messageId || "",
      keywords: Array.from(asTokenSet(`${candidate.subject || ""}\n${candidate.customerMessageRedacted || ""}\n${candidate.cleanedReplyRedacted || candidate.replyRedacted || ""}`)),
    });
    edges.push({
      from: nodeId,
      to: `topic:${topic}`,
      type: "belongs_to_topic",
      weight: 1,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      topicCount: topics.size,
      trainingExampleCount: nodes.filter((node) => node.type === "training_example").length,
      historicalExampleCount: nodes.filter((node) => node.type === "historical_example").length,
      guidanceDocCount: nodes.filter((node) => node.type === "guidance_doc").length,
    },
    nodes,
    edges,
  };
}

export function retrieveGraphContext({
  graph,
  subject = "",
  message = "",
  intent,
}) {
  const queryTokens = asTokenSet(`${subject}\n${message}\n${intent?.intent || ""}\n${intent?.label || ""}`);
  const guidanceDocs = [];
  const trainingExamples = [];
  const historicalExamples = [];

  for (const node of graph?.nodes || []) {
    const score = scoreNode(node, queryTokens, intent);
    if (score <= 0) {
      continue;
    }

    const enriched = {
      id: node.id,
      type: node.type,
      title: node.title,
      topic: node.topic,
      relativePath: node.relativePath || "",
      excerpt: node.excerpt || "",
      score,
      text: node.text || "",
      reviewer: node.reviewer || "",
    };

    if (node.type === "guidance_doc") {
      guidanceDocs.push(enriched);
    } else if (node.type === "training_example") {
      trainingExamples.push(enriched);
    } else if (node.type === "historical_example") {
      historicalExamples.push(enriched);
    }
  }

  guidanceDocs.sort(sortByScore);
  trainingExamples.sort(sortByScore);
  historicalExamples.sort(sortByScore);

  return {
    topic: {
      id: intent?.intent || "general-support",
      label: intent?.label || "General Support",
    },
    guidanceDocs: guidanceDocs.slice(0, 2),
    trainingExamples: trainingExamples.slice(0, 2),
    historicalExamples: historicalExamples.slice(0, 1),
  };
}

export async function persistKnowledgeGraph({ graph, rootDir }) {
  await fsp.mkdir(rootDir, { recursive: true });
  const filePath = path.join(rootDir, "latest.json");
  await fsp.writeFile(filePath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
  return filePath;
}

export async function appendGenerationLog({ rootDir, event }) {
  await fsp.mkdir(rootDir, { recursive: true });
  const filePath = path.join(rootDir, "reply-events.jsonl");
  await fsp.appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
  return filePath;
}

export async function readRecentGenerationLogs({ rootDir, limit = 40 }) {
  const filePath = path.join(rootDir, "reply-events.jsonl");
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = await fsp.readFile(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-Math.max(1, limit))
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
}

function ensureTopicNode({ topics, nodes, topic, label }) {
  if (topics.has(topic)) {
    return topics.get(topic);
  }

  const topicNode = {
    id: `topic:${topic}`,
    type: "topic",
    title: label || humanizeTopic(topic),
    topic,
    excerpt: label || humanizeTopic(topic),
    keywords: Array.from(asTokenSet(`${topic}\n${label || ""}`)),
  };

  topics.set(topic, topicNode);
  nodes.push(topicNode);
  return topicNode;
}

function scoreNode(node, queryTokens, intent) {
  const nodeTokens = asTokenSet(node.keywords || node.text || node.excerpt || "");
  let score = overlapScore(queryTokens, nodeTokens);

  if (node.topic && intent?.intent && node.topic === intent.intent) {
    score += node.type === "training_example" ? 10 : 6;
  }

  if (node.type === "guidance_doc") {
    score += 4;
  }

  return score;
}

function overlapScore(left, right) {
  let score = 0;
  for (const token of left) {
    if (right.has(token)) {
      score += token.length > 6 ? 2 : 1;
    }
  }
  return score;
}

function asTokenSet(value) {
  if (value instanceof Set) {
    return value;
  }

  if (Array.isArray(value)) {
    return new Set(value.map((item) => String(item).toLowerCase()).filter(Boolean));
  }

  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function humanizeTopic(value) {
  return String(value || "general-support")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sortByScore(left, right) {
  return right.score - left.score;
}
