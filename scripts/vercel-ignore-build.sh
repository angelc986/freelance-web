#!/bin/bash
# ============================================================
# Vercel Ignored Build Step
# Copy this into: Vercel Dashboard → Settings → Git → Ignored Build Step
#
# Blocks Vercel auto-deploy until GitHub CI passes.
# Exit 0 = skip deploy (CI not ready / failed)
# Exit 1 = proceed with deploy (CI passed)
# ============================================================

REPO="angelc986/freelance-web"
SHA=$(git rev-parse HEAD)

echo "Checking CI status for commit: ${SHA:0:7}"

CI_STATE=$(curl -sf "https://api.github.com/repos/$REPO/commits/$SHA/status" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('state', 'pending'))
")

echo "CI state: $CI_STATE"

if [ "$CI_STATE" = "success" ]; then
  echo "✅ CI passed — proceeding with deploy"
  exit 1
else
  echo "⏸️  CI not passed (state=$CI_STATE) — deploy BLOCKED"
  exit 0
fi
