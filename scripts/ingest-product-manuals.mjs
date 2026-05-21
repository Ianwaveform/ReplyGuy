import fsp from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const rootDir = process.cwd();
const manualsRoot = path.join(rootDir, "knowledge", "product-manuals");
const manifestPath = path.join(manualsRoot, "manifest.json");

async function main() {
  const manifest = JSON.parse(await fsp.readFile(manifestPath, "utf8"));
  const manuals = Array.isArray(manifest.manuals) ? manifest.manuals : [];

  for (const manual of manuals) {
    await ingestManual(manual);
  }
}

async function ingestManual(manual) {
  const sourcePath = path.join(manualsRoot, manual.sourcePdf);
  const outputPath = path.join(manualsRoot, manual.outputMarkdown);
  const buffer = await fsp.readFile(sourcePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = normalizeManualText(result.text || "");
    const markdown = [
      "---",
      `title: ${escapeYamlValue(manual.title || "Product Manual")}`,
      `source_pdf: ${escapeYamlValue(manual.sourcePdf || "")}`,
      `product_tags: [${(manual.productTags || []).map(escapeYamlValue).join(", ")}]`,
      `keywords: [${(manual.keywords || []).map(escapeYamlValue).join(", ")}]`,
      "---",
      "",
      `# ${manual.title || "Product Manual"}`,
      "",
      text,
      "",
    ].join("\n");

    await fsp.mkdir(path.dirname(outputPath), { recursive: true });
    await fsp.writeFile(outputPath, markdown, "utf8");
    console.log(`Wrote ${path.relative(rootDir, outputPath)} (${text.length} chars)`);
  } finally {
    await parser.destroy();
  }
}

function normalizeManualText(value) {
  return repairMojibake(String(value || ""))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

function repairMojibake(value) {
  return String(value || "")
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, "\"")
    .replace(/â€/g, "\"")
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "-")
    .replace(/â€¦/g, "...")
    .replace(/Â°/g, " degrees")
    .replace(/Â/g, "");
}

function escapeYamlValue(value) {
  return `"${String(value || "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
