# Chatroom editor

This repo is the development home for the chatroom editor, including AI-only
batch conversations. The proto repo retains a deprecated editor for comparison
and temporary fallback; do not maintain both copies.

## Local beta testing

```sh
npm ci --legacy-peer-deps
bash scripts/start-chatroom-beta.sh
```

Open http://127.0.0.1:3000/#/chatroom and sign in normally. The launcher sets
both login and management to the beta API; no CORS proxy or local backend is
needed. Use PORT=3001 when 3000 is occupied. Under WSL, load nvm first
if it is installed outside `~/.nvm`; the launcher loads the standard nvm
installation automatically when Node is absent from PATH.

AI-only mode supports Start once, batches of 1-10 conversations, progress,
history, and ZIP export containing TXT/JSON. Normal human chatrooms retain
their embed script and widget preview.

The editor now lists the current room's batch history (newest first) with refresh,
cursor-based Load more, and detail links. It recommends a single quality/cost
preview before a batch, without requiring one. Attachment badges come from
management capabilities, and limits apply to common + each persona's unique
files: five files, 10 MB and ten PDF pages. Backend validation remains authoritative.

Beta management shares the live RDS. Use a test name and deactivate test
chatrooms afterwards. For inexpensive tests use one conversation, max_turns=2,
max_message_chars=80, max_total_chars=200.

The integration is locally validated before release. This does not imply the
hosted stimulize-beta site has been updated.

## Local verification

2026-09-12: 43 focused tests and TypeScript/build checks passed. Browser E2E
logged in from localhost, saved a normal human chatroom, switched to AI-only,
completed two AI turns and downloaded the export through the page. The ZIP
contained matching TXT/JSON with numeric epoch-millisecond timestamps.
The final browser run had no console errors or HTTP failures.
Test chatrooms were soft-deleted.

`scripts/run-ai-batch-editor-e2e.cjs` accepts editor URL, management URL,
account-file path, result JSON path, and screenshot path. It requires the
Playwright Node package and installed Chromium, reads credentials from the
provided file, and cleans up its test chatroom. Output files belong outside
Git. Both beta endpoint settings are provided by the local launcher.
