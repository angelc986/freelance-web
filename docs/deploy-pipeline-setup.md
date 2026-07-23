# Deploy Pipeline Setup

## Problem
Railway and Vercel auto-deploy on every push to `main`, ignoring CI status.
This means broken code can reach production.

## Solution
Disable auto-deploys on both platforms. Only deploy via GitHub Actions
after CI passes (163 tests + ruff + mypy + ESLint + TypeScript).

---

## Step 1: Vercel — Ignored Build Step

1. Go to: https://vercel.com/angelc986/freelance-web/settings/git
2. Scroll to **"Ignored Build Step"**
3. Paste the content of `scripts/vercel-ignore-build.sh`
4. Click **Save**

Now Vercel will check CI status before building.

### Optional: Vercel Deploy Hook (for GitHub Actions deployment)
1. Vercel Dashboard → Settings → Git → Deploy Hooks
2. Create hook named "GitHub Actions"
3. Copy the URL
4. Add to GitHub: Settings → Secrets → `VERCEL_DEPLOY_HOOK`

---

## Step 2: Railway — Disable Auto-Deploy

1. Go to: https://railway.app/project
2. Select your backend service
3. Click **Settings** tab
4. Find **"Auto-deploy on push"** → **TURN IT OFF**
5. Save

### Optional: Railway Deploy Hook (for GitHub Actions deployment)
1. Railway → Service → Settings → Webhooks
2. Create a deploy webhook
3. Copy the URL
4. Add to GitHub: Settings → Secrets → `RAILWAY_DEPLOY_HOOK`

---

## How it works after setup

```
git push to main
    │
    ├── Railway: "Auto-deploy OFF → do nothing" ✅
    ├── Vercel:  "Ignored Build Step → checks CI → SKIPS if not green" ✅
    │
    ├── GitHub CI kicks off
    │   ├── Backend Lint (Ruff + Mypy)
    │   ├── Backend Tests (163 tests)
    │   └── Frontend Lint (ESLint + TypeScript)
    │
    └── CI ALL GREEN ✅
        │
        └── deploy.yml triggers
            ├── Deploy Railway (webhook)
            └── Deploy Vercel (webhook)
```

## Without the hooks (fallback)

Even without the deploy webhooks, with the Ignored Build Step on Vercel:
- Vercel won't deploy until CI passes
- Railway won't auto-deploy at all

You deploy by:
```bash
# Railway: manual deploy from dashboard
# Vercel: happens automatically once CI passes
```
