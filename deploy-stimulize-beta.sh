#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Pin every service explicitly: local .env files must not leak into Pages.
PUBLIC_URL=https://ara-yjx.github.io/stimulize-beta/ \
REACT_APP_API_BASE=https://9wr63is7x6.execute-api.us-east-2.amazonaws.com/live \
REACT_APP_CHATROOM_MANAGEMENT_API_BASE=https://9wr63is7x6.execute-api.us-east-2.amazonaws.com/live \
REACT_APP_CHATROOM_RUNTIME_API_BASE=https://pmvb4orly5.execute-api.us-east-2.amazonaws.com/prod \
REACT_APP_CHATROOM_WIDGET_URL=https://ara-yjx.github.io/stimulize-chatroom-proto/chatroom.min.js \
REACT_APP_CHATROOM_ATTACHMENTS_ENABLED=true \
npm run build

hash=$(git rev-parse HEAD)
printf '%s\n' "$hash" > build/git-commit.txt

npx gh-pages -d build --repo git@github.com:Ara-yjx/stimulize-beta.git

echo 'DONE'
