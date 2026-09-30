#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Supply the existing production publishable key via the deployment environment.
# Never use a Stripe secret key here: React embeds this value in public JS.
if [[ ! "${REACT_APP_STRIPE_PUBLISHABLE_KEY:-}" =~ ^pk_live_[A-Za-z0-9]+$ ]]; then
  echo 'Set REACT_APP_STRIPE_PUBLISHABLE_KEY to the production pk_live_ key before deploying.' >&2
  exit 1
fi

# Pin every service: local env files and the beta management default must not
# leak into production. Billing UI stays enabled; inference billing is separate.
PUBLIC_URL=https://stimulize.org/ \
REACT_APP_API_BASE=https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live \
REACT_APP_API_BASE_URL=https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live \
REACT_APP_CHATROOM_MANAGEMENT_API_BASE=https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live \
REACT_APP_CHATROOM_RUNTIME_API_BASE=https://pmvb4orly5.execute-api.us-east-2.amazonaws.com/prod \
REACT_APP_CHATROOM_WIDGET_URL=https://ara-yjx.github.io/stimulize-chatroom-proto/chatroom.min.js \
REACT_APP_BILLING_ENABLED=true \
REACT_APP_STRIPE_PUBLISHABLE_KEY="$REACT_APP_STRIPE_PUBLISHABLE_KEY" \
npm run build

hash=$(git rev-parse HEAD)
printf '%s\n' "$hash" > build/git-commit.txt

GIT_SSH_COMMAND='ssh -i ~/.ssh/spbuilder-team' npx gh-pages -d build --repo git@github.com:spbuilder-team/spbuilder-stimulize.git --cname stimulize.org

echo 'DONE'
