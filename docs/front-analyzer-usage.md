# Front Analyzer Usage

## Purpose

The analyzer reads a Front export and generates:

- scored reply candidates
- a tone/style summary
- generated phrase lists
- intent playbooks
- curated redacted examples

## Command

```powershell
npm run front:analyze -- --export-dir data/front-exports/2026-03-25T20-14-53-529Z
```

If `--export-dir` is omitted, the analyzer uses the latest export under `data/front-exports`.

## Inputs

- Front export from `scripts/export-front-history.mjs`
- SOP content under `knowledge/approved/sops`

## Outputs

Local analysis files:

- `data/front-analysis/<export-id>/analysis.json`
- `data/front-analysis/<export-id>/reply-candidates.json`
- `data/front-analysis/<export-id>/knowledge-index.json`

Generated style assets:

- `knowledge/style/tone-guide.generated.md`
- `knowledge/style/approved-phrases.generated.md`
- `knowledge/style/avoid-phrases.generated.md`
- `knowledge/style/intent-playbooks/*.generated.md`

Generated curated examples:

- `knowledge/examples/human-replies/curated/*.generated.json`

## Notes

- Curated examples are redacted, but the raw Front exports still contain sensitive customer data.
- The analyzer uses heuristics today, not model-based scoring.
- Historical replies should shape tone and structure, not override SOP policy.
