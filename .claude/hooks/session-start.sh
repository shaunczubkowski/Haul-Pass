#!/bin/bash
# SessionStart hook — install dependencies so tests and linters are runnable
# the moment a Claude Code on the web session begins. Local sessions manage
# their own node_modules, so this is a no-op outside the remote environment.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# npm install (not npm ci) so the cached container image can reuse an existing
# node_modules; the committed package-lock.json still pins every version.
npm install --no-audit --no-fund
