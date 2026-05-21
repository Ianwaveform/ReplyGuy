import fsp from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const rootDir = process.cwd();
const routerGuidesRoot = path.join(rootDir, "knowledge", "router-guides");
const generatedRoot = path.join(routerGuidesRoot, "generated");
const manifestPath = path.join(routerGuidesRoot, "manifest.json");
const DEFAULT_INDEX_URL = "https://www.waveform.com/a/b/guides/hotspots";
const execFileAsync = promisify(execFile);
const browserUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function main() {
  const indexUrl = process.argv[2] || DEFAULT_INDEX_URL;
  const indexHtml = await fetchHtml(indexUrl);
  const guideLinks = extractGuideLinks(indexHtml, indexUrl);

  await fsp.rm(generatedRoot, { recursive: true, force: true });
  await fsp.mkdir(generatedRoot, { recursive: true });

  const manifest = {
    indexUrl,
    generatedAt: new Date().toISOString(),
    guideCount: 0,
    guides: [],
  };

  for (const guide of guideLinks) {
    const html = await fetchHtml(guide.url);
    const title = extractTitle(html) || guide.title;
    const text = extractArticleText(html);
    if (isInvalidGuidePage(title, text)) {
      console.warn(`Skipped ${guide.url} (${title || "no title"})`);
      continue;
    }

    const slug = slugify(new URL(guide.url).pathname.split("/").filter(Boolean).pop() || title);
    const outputMarkdown = `generated/${slug}.md`;
    const outputPath = path.join(routerGuidesRoot, outputMarkdown);
    const markdown = [
      "---",
      `title: ${escapeYamlValue(title)}`,
      `source_url: ${escapeYamlValue(guide.url)}`,
      `guide_type: "router_external_antenna_guide"`,
      "---",
      "",
      `# ${title}`,
      "",
      text,
      "",
    ].join("\n");

    await fsp.writeFile(outputPath, markdown, "utf8");
    manifest.guides.push({
      title,
      sourceUrl: guide.url,
      outputMarkdown,
      keywords: inferKeywords(title),
    });
    console.log(`Wrote ${path.relative(rootDir, outputPath)} (${text.length} chars)`);
  }

  manifest.guideCount = manifest.guides.length;
  await fsp.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Indexed ${manifest.guides.length} router guides from ${indexUrl}`);
}

async function fetchHtml(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": browserUserAgent,
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (response.ok) {
      return response.text();
    }

    console.warn(`Fetch returned ${response.status} for ${url}; retrying with curl fallback.`);
  } catch (error) {
    console.warn(`Fetch failed for ${url}; retrying with curl fallback. ${error.message}`);
  }

  return fetchHtmlWithCurl(url);
}

async function fetchHtmlWithCurl(url) {
  const commands = process.platform === "win32" ? ["curl.exe", "curl"] : ["curl", "curl.exe"];
  let lastError = null;

  for (const command of commands) {
    try {
      const { stdout } = await execFileAsync(
        command,
        [
          "-L",
          "--fail",
          "--silent",
          "--show-error",
          "--max-time",
          "60",
          "-A",
          browserUserAgent,
          "-H",
          "Accept: text/html",
          "-H",
          "Accept-Language: en-US,en;q=0.9",
          url,
        ],
        {
          encoding: "utf8",
          maxBuffer: 50 * 1024 * 1024,
        },
      );
      return stdout;
    } catch (error) {
      lastError = error;
      if (error.code === "ENOENT") {
        continue;
      }
    }
  }

  throw new Error(`Failed to fetch ${url} with fetch and curl fallback: ${lastError?.message || "unknown error"}`);
}

function extractGuideLinks(html, indexUrl) {
  const base = new URL(indexUrl);
  const links = new Map();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html))) {
    const href = match[1];
    const title = cleanText(match[2]);
    if (!title || !/guide/i.test(title)) {
      continue;
    }

    const url = new URL(href, base);
    if (url.hostname !== base.hostname) {
      continue;
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    if (!pathname.startsWith("/a/b/guides/hotspots/")) {
      continue;
    }

    links.set(url.href.replace(/#.*$/, ""), {
      title,
      url: url.href.replace(/#.*$/, ""),
    });
  }

  return Array.from(links.values()).sort((left, right) => left.title.localeCompare(right.title));
}

function extractTitle(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    return cleanText(h1[1]);
  }

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title?.[1] ? cleanText(title[1]).replace(/\s*\|\s*Waveform.*$/i, "") : "";
}

function extractArticleText(html) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const articleMatch = withoutScripts.match(/<main\b[\s\S]*?<\/main>/i)
    || withoutScripts.match(/<article\b[\s\S]*?<\/article>/i)
    || withoutScripts.match(/Free shipping over \$99[\s\S]*?(?=<footer\b|<\/body>)/i);
  const articleHtml = articleMatch?.[0] || withoutScripts;

  return decodeHtmlEntities(
    articleHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|main|li|h1|h2|h3|h4|table|tr)>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function cleanText(value) {
  return decodeHtmlEntities(
    String(value || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value) {
  return repairTextEncoding(String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16))));
}

function repairTextEncoding(value) {
  return String(value || "")
    .replace(/\u00c2\u00a0/g, " ")
    .replace(/\u00c2/g, "")
    .replace(/\u00c3\u2014/g, "x")
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u02dc/g, "'")
    .replace(/\u00e2\u20ac\u0153/g, "\"")
    .replace(/\u00e2\u20ac\u009d/g, "\"")
    .replace(/\u00e2\u20ac\ufffd/g, "\"")
    .replace(/\u00e2\u20ac\u201c/g, "-")
    .replace(/\u00e2\u20ac\u201d/g, "-")
    .replace(/\u00e2\u20ac\u00a6/g, "...")
    .replace(/\u00e2\u20ac\u00a2/g, "-");
}

function inferKeywords(title) {
  return Array.from(
    new Set(
      String(title || "")
        .replace(/\b(external|antenna|guide|optimization)\b/gi, " ")
        .split(/[^a-z0-9]+/i)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2),
    ),
  );
}

function isInvalidGuidePage(title, text) {
  return /page not found/i.test(title || "")
    || /there doesn't seem to be a page here/i.test(text || "")
    || String(text || "").length < 1000;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "router-guide";
}

function escapeYamlValue(value) {
  return `"${String(value || "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
