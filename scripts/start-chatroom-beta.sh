#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null 2>&1 && [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  source "$HOME/.nvm/nvm.sh"
fi
# Keep login and chatroom management on the same beta service.
export REACT_APP_API_BASE=https://9wr63is7x6.execute-api.us-east-2.amazonaws.com/live
export REACT_APP_CHATROOM_MANAGEMENT_API_BASE="$REACT_APP_API_BASE"
export HOST=127.0.0.1
export PORT="${PORT:-3000}"
export BROWSER=none
exec npm start
