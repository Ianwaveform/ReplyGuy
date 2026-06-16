import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { writeFeedbackDigest } from "../server/feedback-digest.mjs";

const rootDir = process.cwd();
const trainingStorePath = path.join(rootDir, "data", "training", "reply-training.json");
const outputPath = path.join(rootDir, "knowledge", "style", "team-feedback-digest.generated.md");
const summaryPath = path.join(rootDir, "data", "training", "feedback-digest.json");

const trainingExamples = await readTrainingStore(trainingStorePath);
const digest = await writeFeedbackDigest({
  trainingExamples,
  outputPath,
  summaryPath,
});

console.log(`Feedback digest rebuilt from ${trainingExamples.length} training example(s).`);
console.log(`Markdown: ${path.relative(rootDir, outputPath)}`);
console.log(`Summary: ${path.relative(rootDir, summaryPath)}`);
console.log(`Recurring coaching rules: ${digest.ruleSummaries.length}`);

async function readTrainingStore(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = JSON.parse(await fsp.readFile(filePath, "utf8"));
  return Array.isArray(raw) ? raw : [];
}
