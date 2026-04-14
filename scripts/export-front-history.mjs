import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "https://api2.frontapp.com";
const DEFAULT_MAX_CONVERSATIONS = 50;
const DEFAULT_PAGE_LIMIT = 25;
const DEFAULT_OUTPUT_ROOT = path.join(process.cwd(), "data", "front-exports");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const localEnv = readLocalEnv();
  const config = {
    apiToken: readEnvValue("FRONT_API_TOKEN", localEnv),
    baseUrl: (readEnvValue("FRONT_BASE_URL", localEnv) || DEFAULT_BASE_URL).replace(/\/+$/, ""),
    inboxNameOrId: args.inbox || readEnvValue("FRONT_PILOT_INBOX", localEnv),
    outputRoot: path.resolve(process.cwd(), args.outDir || DEFAULT_OUTPUT_ROOT),
    maxConversations: args.maxConversations ?? DEFAULT_MAX_CONVERSATIONS,
    pageLimit: args.pageLimit ?? DEFAULT_PAGE_LIMIT,
    since: args.since || "",
  };

  if (!config.apiToken) {
    throw new Error("Missing FRONT_API_TOKEN. Add it to .env.local or your shell environment.");
  }

  if (!config.inboxNameOrId) {
    throw new Error("Missing inbox name. Pass --inbox or set FRONT_PILOT_INBOX in .env.local.");
  }

  if (config.maxConversations < 1) {
    throw new Error("--max-conversations must be at least 1.");
  }

  if (config.pageLimit < 1 || config.pageLimit > 100) {
    throw new Error("--page-limit must be between 1 and 100.");
  }

  if (config.since && Number.isNaN(Date.parse(config.since))) {
    throw new Error("--since must be a valid ISO date or date-time string.");
  }

  const client = createFrontClient({
    apiToken: config.apiToken,
    baseUrl: config.baseUrl,
  });

  console.log(`Resolving Front inbox "${config.inboxNameOrId}"...`);
  const inbox = await resolveInbox(client, config.inboxNameOrId);
  console.log(`Resolved inbox ${inbox.name} (${inbox.id}).`);

  console.log("Fetching recent conversations...");
  const conversationShells = await listInboxConversations(client, inbox.id, {
    maxConversations: config.maxConversations,
    pageLimit: config.pageLimit,
    since: config.since,
  });

  if (conversationShells.length === 0) {
    console.log("No conversations matched the current export filters.");
    return;
  }

  console.log(`Fetching messages for ${conversationShells.length} conversations...`);
  const startedAt = new Date().toISOString();
  const exportId = makeExportId();
  const exportDir = path.join(config.outputRoot, exportId);
  const rawConversationsDir = path.join(exportDir, "raw", "conversations");
  const normalizedDir = path.join(exportDir, "normalized");
  await fsp.mkdir(rawConversationsDir, { recursive: true });
  await fsp.mkdir(normalizedDir, { recursive: true });

  const normalizedConversations = [];
  for (const conversation of conversationShells) {
    const messages = await listConversationMessages(client, conversation.id);
    const payload = {
      conversation,
      messages,
    };

    await writeJson(
      path.join(rawConversationsDir, `${sanitizeFileName(conversation.id)}.json`),
      payload,
    );

    normalizedConversations.push(
      normalizeConversation({
        conversation,
        messages,
        inbox,
      }),
    );
  }

  const summary = buildExportSummary({
    inbox,
    startedAt,
    finishedAt: new Date().toISOString(),
    exportId,
    exportDir,
    totalConversations: normalizedConversations.length,
    conversations: normalizedConversations,
    filters: {
      inbox: config.inboxNameOrId,
      since: config.since || null,
      maxConversations: config.maxConversations,
      pageLimit: config.pageLimit,
    },
  });

  await writeJson(path.join(exportDir, "manifest.json"), {
    exportId,
    createdAt: summary.finishedAt,
    inbox: {
      id: inbox.id,
      name: inbox.name,
    },
    filters: summary.filters,
    counts: summary.counts,
    files: {
      manifest: "manifest.json",
      summary: "normalized/summary.json",
      conversations: "normalized/conversations.json",
      rawConversationsDir: "raw/conversations",
    },
  });

  await writeJson(path.join(normalizedDir, "conversations.json"), normalizedConversations);
  await writeJson(path.join(normalizedDir, "summary.json"), summary);

  console.log(`Export complete: ${exportDir}`);
  console.log(`Conversations exported: ${summary.counts.conversations}`);
  console.log(`Outbound human replies found: ${summary.counts.outboundHumanReplies}`);
}

function parseArgs(argv) {
  const args = {
    help: false,
    inbox: "",
    outDir: "",
    since: "",
    maxConversations: undefined,
    pageLimit: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--help" || value === "-h") {
      args.help = true;
      continue;
    }

    if (value === "--inbox") {
      args.inbox = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--out-dir") {
      args.outDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--since") {
      args.since = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--max-conversations") {
      args.maxConversations = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (value === "--page-limit") {
      args.pageLimit = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/export-front-history.mjs [options]

Options:
  --inbox <name-or-id>            Shared inbox name or Front inbox id
  --max-conversations <number>    Maximum conversations to export (default: ${DEFAULT_MAX_CONVERSATIONS})
  --page-limit <number>           Page size for Front pagination, 1-100 (default: ${DEFAULT_PAGE_LIMIT})
  --since <iso-date>              Only keep conversations updated on or after this date
  --out-dir <path>                Output directory root (default: data/front-exports)
  --help                          Show this help text

Examples:
  npm run front:export -- --inbox "WF help" --max-conversations 25
  npm run front:export -- --since 2026-03-01 --max-conversations 100
`);
}

function createFrontClient({ apiToken, baseUrl }) {
  return {
    async getJson(urlPath) {
      const target = urlPath.startsWith("http") ? urlPath : `${baseUrl}${urlPath}`;
      return fetchWithRetry(target, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    },
  };
}

async function resolveInbox(client, inboxNameOrId) {
  if (inboxNameOrId.startsWith("inb_")) {
    const inbox = await client.getJson(`/inboxes/${encodeURIComponent(inboxNameOrId)}`);
    return {
      id: inbox.id,
      name: inbox.name || inboxNameOrId,
      isPrivate: Boolean(inbox.is_private),
    };
  }

  const inboxes = await paginate(client, `/inboxes?limit=100`, "results");
  const match = inboxes.find((item) => {
    const name = String(item.name || "").trim().toLowerCase();
    return name === inboxNameOrId.trim().toLowerCase();
  });

  if (!match) {
    const availableNames = inboxes
      .map((item) => item.name)
      .filter(Boolean)
      .slice(0, 20)
      .join(", ");
    throw new Error(`Front inbox "${inboxNameOrId}" was not found. Sample inboxes: ${availableNames}`);
  }

  return {
    id: match.id,
    name: match.name,
    isPrivate: Boolean(match.is_private),
  };
}

async function listInboxConversations(client, inboxId, { maxConversations, pageLimit, since }) {
  const items = [];
  let nextUrl = `/inboxes/${encodeURIComponent(inboxId)}/conversations?limit=${pageLimit}`;
  const sinceMs = since ? Date.parse(since) : 0;

  while (nextUrl && items.length < maxConversations) {
    const page = await client.getJson(nextUrl);
    const results = Array.isArray(page._results) ? page._results : Array.isArray(page.results) ? page.results : [];

    for (const item of results) {
      if (sinceMs) {
        const activityDate = coerceDate(
          item.last_message?.created_at
            || item.last_message?.date
            || item.last_activity_at
            || item.updated_at
            || item.created_at,
        );

        if (activityDate && Date.parse(activityDate) < sinceMs) {
          continue;
        }
      }

      items.push(item);
      if (items.length >= maxConversations) {
        break;
      }
    }

    nextUrl = page?._pagination?.next || null;
  }

  return items;
}

async function listConversationMessages(client, conversationId) {
  const results = await paginate(
    client,
    `/conversations/${encodeURIComponent(conversationId)}/messages?limit=100`,
    "_results",
  );

  return results.sort((left, right) => {
    const leftMs = Date.parse(coerceDate(left.created_at || left.date) || "") || 0;
    const rightMs = Date.parse(coerceDate(right.created_at || right.date) || "") || 0;
    return leftMs - rightMs;
  });
}

async function paginate(client, initialUrl, preferredKey) {
  const items = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    const page = await client.getJson(nextUrl);
    const results = Array.isArray(page[preferredKey])
      ? page[preferredKey]
      : Array.isArray(page.results)
        ? page.results
        : Array.isArray(page._results)
          ? page._results
          : [];

    items.push(...results);
    nextUrl = page?._pagination?.next || null;
  }

  return items;
}

async function fetchWithRetry(url, options, attempt = 0) {
  const response = await fetch(url, options);

  if (response.status === 429 && attempt < 4) {
    const retryAfterSeconds = Number(response.headers.get("retry-after") || "1");
    await sleep(Math.max(retryAfterSeconds, 1) * 1000);
    return fetchWithRetry(url, options, attempt + 1);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Front API request failed (${response.status} ${response.statusText}) for ${url}: ${body}`);
  }

  return response.json();
}

function normalizeConversation({ conversation, messages, inbox }) {
  const recipient = extractRecipientSummary(conversation.recipient);
  const orderedMessages = messages.map((message) =>
    normalizeMessage(message, {
      conversationRecipient: recipient,
    }),
  );
  const inboundMessages = orderedMessages.filter((message) => message.direction === "inbound");
  const outboundMessages = orderedMessages.filter((message) => message.direction === "outbound");
  const latestInbound = inboundMessages.at(-1) || null;
  const latestOutbound = outboundMessages.at(-1) || null;
  const humanOutboundReplies = outboundMessages.filter((message) => !message.isAutoReply);

  return {
    conversationId: conversation.id,
    inboxId: inbox.id,
    inboxName: inbox.name,
    subject: pickFirstNonEmpty([
      conversation.subject,
      latestInbound?.subject,
      latestOutbound?.subject,
    ]),
    status: conversation.status || "",
    statusCategory: conversation.status_category || "",
    createdAt: coerceDate(conversation.created_at) || latestInbound?.createdAt || latestOutbound?.createdAt || "",
    tags: normalizeConversationTags(conversation),
    assignee: extractDisplayEntity(conversation.assignee),
    recipient,
    messageCount: orderedMessages.length,
    inboundCount: inboundMessages.length,
    outboundCount: outboundMessages.length,
    outboundHumanReplyCount: humanOutboundReplies.length,
    latestCustomerMessage: latestInbound,
    latestHumanReply: humanOutboundReplies.at(-1) || null,
    messages: orderedMessages,
  };
}

function normalizeMessage(message, { conversationRecipient }) {
  const recipients = extractRecipients(message);
  const author = extractDisplayEntity(message.author);
  const sender = extractDisplayEntity(message.sender);
  const direction = normalizeMessageDirection(message, {
    conversationRecipient,
    recipients,
    sender,
    author,
  });
  const textBody = extractMessageText(message);
  const htmlBody = extractHtmlBody(message);

  return {
    messageId: message.id || "",
    type: message.type || "",
    direction,
    createdAt: coerceDate(message.created_at || message.date) || "",
    subject: message.subject || "",
    sender,
    recipients,
    isDraft: Boolean(message.is_draft),
    isAutoReply: isLikelyAutoReply(message, sender, author),
    bodyText: textBody,
    bodyHtml: htmlBody,
    blurb: message.blurb || "",
    attachments: normalizeAttachments(message),
    rawMetadata: {
      status: message.status || "",
      author,
      metadata: message.metadata || null,
    },
  };
}

function normalizeMessageDirection(message, { conversationRecipient, recipients, sender, author }) {
  const status = String(message.status || "").toLowerCase();
  const type = String(message.type || "").toLowerCase();

  if (status === "inbound" || type === "inbound") {
    return "inbound";
  }

  if (status === "outbound" || type === "outbound") {
    return "outbound";
  }

  if (message.is_draft) {
    return "outbound";
  }

  const recipientHandle = String(conversationRecipient?.handle || "").toLowerCase();
  const fromHandles = recipients
    .filter((entry) => entry.role === "from")
    .map((entry) => String(entry.handle || "").toLowerCase())
    .filter(Boolean);
  const toHandles = recipients
    .filter((entry) => entry.role === "to")
    .map((entry) => String(entry.handle || "").toLowerCase())
    .filter(Boolean);

  if (recipientHandle) {
    if (fromHandles.includes(recipientHandle)) {
      return "inbound";
    }

    if (toHandles.includes(recipientHandle)) {
      return "outbound";
    }
  }

  const authorRole = String(author.role || "").toLowerCase();
  if (authorRole === "ai" || authorRole === "user") {
    return "outbound";
  }

  const senderHandle = String(sender.handle || "").toLowerCase();
  if (senderHandle && recipientHandle) {
    if (senderHandle === recipientHandle) {
      return "inbound";
    }

    return "outbound";
  }

  return "unknown";
}

function normalizeConversationTags(conversation) {
  const tags = Array.isArray(conversation.tags)
    ? conversation.tags
    : Array.isArray(conversation.applied_tags)
      ? conversation.applied_tags
      : [];

  return tags
    .map((tag) => {
      if (!tag) {
        return null;
      }

      if (typeof tag === "string") {
        return { id: "", name: tag };
      }

      return {
        id: tag.id || "",
        name: tag.name || "",
      };
    })
    .filter(Boolean);
}

function normalizeAttachments(message) {
  const attachments = message.attachments
    || message.content?.attachments
    || [];

  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.map((attachment) => ({
    id: attachment.id || "",
    filename: attachment.filename || attachment.name || "",
    contentType: attachment.content_type || attachment.contentType || "",
    size: attachment.size || 0,
    isInline: Boolean(attachment.is_inline),
  }));
}

function extractMessageText(message) {
  const directText = pickFirstNonEmpty([
    message.text,
    message.body_text,
    message.content?.text,
    message.plaintext,
    message.blurb,
  ]);

  if (directText) {
    return collapseWhitespace(directText);
  }

  const htmlBody = extractHtmlBody(message);
  if (!htmlBody) {
    return "";
  }

  return collapseWhitespace(stripHtml(htmlBody));
}

function extractHtmlBody(message) {
  return pickFirstNonEmpty([
    message.body,
    message.body_html,
    message.content?.body,
    message.content?.html,
  ]);
}

function extractRecipients(message) {
  const pools = [
    message.recipients,
    message.to,
    message.cc,
    message.bcc,
  ];

  const flattened = [];
  for (const pool of pools) {
    if (!Array.isArray(pool)) {
      continue;
    }

    for (const entry of pool) {
      flattened.push(extractDisplayEntity(entry));
    }
  }

  return flattened.filter((entry) => entry.name || entry.handle);
}

function extractDisplayEntity(entity) {
  if (!entity) {
    return {
      id: "",
      name: "",
      handle: "",
      role: "",
    };
  }

  if (typeof entity === "string") {
    return {
      id: "",
      name: entity,
      handle: "",
      role: "",
    };
  }

  return {
    id: entity.id || "",
    name: entity.name || entity.display_name || "",
    handle: entity.handle || entity.email || entity.username || "",
    role: entity.role || entity.type || "",
  };
}

function extractRecipientSummary(recipient) {
  const entity = extractDisplayEntity(recipient);
  if (!entity.name && !entity.handle) {
    return null;
  }

  return entity;
}

function isLikelyAutoReply(message, sender, author) {
  const metadataText = JSON.stringify(message.metadata || {});
  const combinedText = [
    message.type,
    message.status,
    sender.name,
    sender.handle,
    author.name,
    author.handle,
    author.role,
    metadataText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return combinedText.includes("auto")
    || combinedText.includes("noreply")
    || combinedText.includes("no-reply")
    || String(author.role || "").toLowerCase() === "ai";
}

function buildExportSummary({
  inbox,
  startedAt,
  finishedAt,
  exportId,
  exportDir,
  totalConversations,
  conversations,
  filters,
}) {
  const outboundHumanReplies = conversations.reduce(
    (count, conversation) => count + conversation.outboundHumanReplyCount,
    0,
  );

  const intentsPreview = inferTopSubjects(conversations);

  return {
    exportId,
    exportDir,
    startedAt,
    finishedAt,
    inbox: {
      id: inbox.id,
      name: inbox.name,
    },
    filters,
    counts: {
      conversations: totalConversations,
      outboundHumanReplies,
      inboundMessages: conversations.reduce((count, item) => count + item.inboundCount, 0),
      outboundMessages: conversations.reduce((count, item) => count + item.outboundCount, 0),
    },
    previews: {
      topSubjects: intentsPreview,
    },
  };
}

function inferTopSubjects(conversations) {
  const counts = new Map();
  for (const conversation of conversations) {
    const key = collapseWhitespace((conversation.subject || "").toLowerCase());
    if (!key) {
      continue;
    }

    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([subject, count]) => ({ subject, count }));
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
  return String(value).replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function coerceDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "number") {
    return new Date(value * (value > 10_000_000_000 ? 1 : 1000)).toISOString();
  }

  const parsed = Date.parse(String(value));
  if (Number.isNaN(parsed)) {
    return "";
  }

  return new Date(parsed).toISOString();
}

function pickFirstNonEmpty(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeJson(filePath, value) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sanitizeFileName(value) {
  return String(value).replace(/[<>:"/\\|?*\x00-\x1F]/g, "-");
}

function makeExportId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
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

function readEnvValue(key, localEnv) {
  return process.env[key] || localEnv[key] || "";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
