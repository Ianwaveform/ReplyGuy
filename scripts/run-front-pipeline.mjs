import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const EXPORT_ROOT = path.join(process.cwd(), "data", "front-exports");
const DEFAULT_OVERLAP_MINUTES = 180;
const DEFAULT_INBOXES = [
  "WF Help",
  "WI - SMS Support",
  "AMZ SMS",
  "AMZ UK",
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const inboxes = normalizeInboxList(args.inboxes.length ? args.inboxes : readInboxDefaults());
  if (!inboxes.length) {
    throw new Error("No Front inboxes were configured. Pass one or more --inbox values or set FRONT_PIPELINE_INBOXES.");
  }

  const overlapMinutes = Number.isFinite(args.overlapMinutes)
    ? args.overlapMinutes
    : DEFAULT_OVERLAP_MINUTES;
  const since = args.since || await deriveSinceTimestamp(overlapMinutes, args.outDir);

  console.log("[pipeline] Starting Front pipeline");
  console.log(`[pipeline] Inboxes: ${inboxes.join(", ")}`);
  console.log(`[pipeline] Since filter: ${since || "none"}`);

  for (const inbox of inboxes) {
    const inboxRoot = args.outDir
      ? path.resolve(process.cwd(), args.outDir, sanitizePathSegment(inbox))
      : path.join(EXPORT_ROOT, sanitizePathSegment(inbox));

    console.log(`[pipeline] Exporting inbox: ${inbox}`);
    const exportArgs = [path.join(process.cwd(), "scripts", "export-front-history.mjs"), "--inbox", inbox, "--out-dir", inboxRoot];

    if (args.maxConversations) {
      exportArgs.push("--max-conversations", String(args.maxConversations));
    }

    if (args.pageLimit) {
      exportArgs.push("--page-limit", String(args.pageLimit));
    }

    if (since) {
      exportArgs.push("--since", since);
    }

    await runNodeScript(exportArgs);

    const latestExportDir = await findLatestExportDir(inboxRoot);
    if (!latestExportDir) {
      throw new Error(`Export finished for "${inbox}", but no export directory was found in ${inboxRoot}.`);
    }

    console.log(`[pipeline] Analyzing export: ${latestExportDir}`);
    await runNodeScript([
      path.join(process.cwd(), "scripts", "analyze-front-history.mjs"),
      "--export-dir",
      latestExportDir,
    ]);
  }

  console.log("[pipeline] Front pipeline complete");
}

function parseArgs(argv) {
  const args = {
    help: false,
    inboxes: [],
    since: "",
    outDir: "",
    maxConversations: 0,
    pageLimit: 0,
    overlapMinutes: DEFAULT_OVERLAP_MINUTES,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--help" || value === "-h") {
      args.help = true;
      continue;
    }

    if (value === "--inbox") {
      args.inboxes.push(argv[index + 1] || "");
      index += 1;
      continue;
    }

    if (value === "--since") {
      args.since = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--out-dir") {
      args.outDir = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--max-conversations") {
      args.maxConversations = Number(argv[index + 1] || 0);
      index += 1;
      continue;
    }

    if (value === "--page-limit") {
      args.pageLimit = Number(argv[index + 1] || 0);
      index += 1;
      continue;
    }

    if (value === "--overlap-minutes") {
      args.overlapMinutes = Number(argv[index + 1] || DEFAULT_OVERLAP_MINUTES);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/run-front-pipeline.mjs [options]

Options:
  --inbox <name-or-id>            Front inbox name or id (repeatable)
  --since <iso-date>              Override automatic incremental timestamp
  --out-dir <path>                Export root (default: data/front-exports)
  --max-conversations <number>    Maximum conversations to export per inbox
  --page-limit <number>           Front API page size per request
  --overlap-minutes <number>      Re-fetch this much overlap from the latest export (default: ${DEFAULT_OVERLAP_MINUTES})
  --help                          Show this help text

Defaults:
  Inboxes: ${DEFAULT_INBOXES.join(", ")}

Examples:
  npm run front:pipeline
  npm run front:pipeline -- --inbox "WF Help" --inbox "AMZ UK"
  npm run front:pipeline -- --max-conversations 150 --overlap-minutes 240
`);
}

function readInboxDefaults() {
  const localEnv = readLocalEnv();
  const configured = localEnv.FRONT_PIPELINE_INBOXES || process.env.FRONT_PIPELINE_INBOXES || "";
  if (!configured.trim()) {
    return DEFAULT_INBOXES;
  }

  return configured.split(",");
}

function normalizeInboxList(values) {
  return values
    .map((value) => String(value).trim())
    .filter(Boolean);
}

async function deriveSinceTimestamp(overlapMinutes, configuredOutDir) {
  const rootDir = configuredOutDir
    ? path.resolve(process.cwd(), configuredOutDir)
    : EXPORT_ROOT;
  const latestExportDir = await findLatestExportDirDeep(rootDir);

  if (!latestExportDir) {
    return "";
  }

  const manifestPath = path.join(latestExportDir, "manifest.json");
  const summaryPath = path.join(latestExportDir, "normalized", "summary.json");
  const candidatePaths = [summaryPath, manifestPath];

  for (const filePath of candidatePaths) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const payload = JSON.parse(await fsp.readFile(filePath, "utf8"));
    const timestamp = payload.finishedAt || payload.createdAt || "";
    if (!timestamp || Number.isNaN(Date.parse(timestamp))) {
      continue;
    }

    return new Date(Date.parse(timestamp) - overlapMinutes * 60 * 1000).toISOString();
  }

  return "";
}

async function findLatestExportDir(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return "";
  }

  const entries = await fsp.readdir(rootDir, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  return dirs[0] ? path.join(rootDir, dirs[0]) : "";
}

async function findLatestExportDirDeep(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return "";
  }

  const exportDirs = [];

  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    const childDirs = entries.filter((entry) => entry.isDirectory());
    const hasManifest = entries.some((entry) => entry.isFile() && entry.name === "manifest.json");

    if (hasManifest) {
      exportDirs.push(dir);
      return;
    }

    for (const entry of childDirs) {
      await walk(path.join(dir, entry.name));
    }
  }

  await walk(rootDir);
  exportDirs.sort().reverse();
  return exportDirs[0] || "";
}

function sanitizePathSegment(value) {
  return String(value)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "-");
}

async function runNodeScript(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`Script failed with exit code ${code}`));
    });
  });
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
