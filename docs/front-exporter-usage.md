# Front Exporter Usage

## Purpose

The Front exporter pulls a limited batch of conversations from the pilot inbox and saves:

- raw conversation-plus-message payloads
- normalized conversation/message JSON
- a summary file for quick review

This is the first step for tone analysis and reply digestion.

## Command

```powershell
npm run front:export -- --inbox "WF help" --max-conversations 25
```

## Options

- `--inbox <name-or-id>`: Front inbox name or `inb_...` id
- `--max-conversations <number>`: total conversations to export
- `--page-limit <number>`: page size sent to Front, up to 100
- `--since <iso-date>`: keep only conversations updated on or after a date
- `--out-dir <path>`: change the output root

Example:

```powershell
npm run front:export -- --inbox "WF help" --since 2026-03-01 --max-conversations 100
```

## Output

Exports are written under:

`data/front-exports/<timestamp>/`

Files:

- `manifest.json`
- `normalized/summary.json`
- `normalized/conversations.json`
- `raw/conversations/<conversation-id>.json`

## Notes

- The exporter uses `FRONT_API_TOKEN`, `FRONT_BASE_URL`, and `FRONT_PILOT_INBOX` from `.env.local`.
- The script keeps every exported conversation separate in `raw/` so we preserve an audit trail before curation.
- Historical replies should be used for style analysis, not policy authority.
