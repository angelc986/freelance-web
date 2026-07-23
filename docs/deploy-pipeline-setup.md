# Deploy Pipeline Setup

## Solution
Railway and Vercel auto-deploy on every push to `main`, ignoring CI status.
This can deploy broken code to production.

**Fix**: Block auto-deploys. Only deploy via GitHub Actions after CI passes.

---

## Step 1: Vercel — `vercel.json` ignoreCommand ✅ DONE

Already configured in `frontend/vercel.json`:

```json
"ignoreCommand": "bash -c '...'"
```

This script checks GitHub CI status before building. If CI hasn't passed,
Vercel cancels the deploy automatically.

**No manual steps needed for Vercel.** It works from the config file.

---

## Step 2: Railway — Disable Auto-Deploy ⚠️ MANUAL

1. Go to https://railway.app → your backend service
2. Click **Settings** tab
3. Find **"Auto-deploy on push"** → **TURN IT OFF**
4. Save

---

## How it works

```
git push to main
    │
    ├── Railway: "Auto-deploy OFF → do nothing" ✅
    ├── Vercel:  ignoreCommand checks CI → SKIPS if not green ✅
    │
    ├── GitHub CI kicks off
    │   ├── Backend Lint (Ruff + Mypy)
    │   ├── Backend Tests (163/163)
    │   └── Frontend Lint (ESLint + TypeScript)
    │
    └── CI ALL GREEN ✅
        │
        └── Vercel: next push/build → ignoreCommand sees CI=success → deploys
        └── Railway: manual deploy from dashboard
```
