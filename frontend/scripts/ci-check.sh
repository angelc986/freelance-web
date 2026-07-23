#!/bin/bash
# Called by vercel.json ignoreCommand — blocks deploy until CI passes
SHA=$(git rev-parse HEAD)
CI=$(curl -sf "https://api.github.com/repos/angelc986/freelance-web/commits/$SHA/status" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state','pending'))")
if [ "$CI" = "success" ]; then
  echo "CI passed -> deploying"
  exit 1
else
  echo "CI not ready ($CI) -> skipping"
  exit 0
fi
