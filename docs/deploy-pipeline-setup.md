# Deploy Pipeline — TurnoGO

> Última actualización: 24 julio 2026
> Arquitectura final tras smoke test exitoso.

## Arquitectura

```
Push a main
    │
    ├── Vercel: auto-deploy INMEDIATO (~30s) → freelance-web-beta.vercel.app
    │   (Si build falla, Vercel NO deploya — su propio build es el gate)
    │
    ├── GitHub CI (~2 min)
    │   ├── Backend Tests (pytest 163 tests)
    │   ├── Backend Lint (Ruff + Mypy)
    │   └── Frontend Lint (ESLint + TypeScript)
    │
    └── Railway: "Wait for CI" → CI verde → DEPLOY
```

## Cómo funciona cada plataforma

### Vercel
- Git conectado → auto-deploy on push
- Sin `ignoreCommand` (bloquea TODO, incluso Deploy Hooks)
- El build de Vercel es el gate: si falla, NO deploya
- `deploy.yml` solo reporta — no duplica deploys

### Railway
- "Wait for CI" habilitado en Railway Dashboard
- Railway espera que todos los GitHub Checks pasen antes de deployar
- Si CI falla → Railway NO deploya
- Configuración: Railway Dashboard → Service → Settings → "Wait for CI"

### GitHub Actions
- `ci.yml`: 3 jobs paralelos (tests + lint backend + lint frontend)
- `deploy.yml`: gated via `workflow_run`, solo corre tras CI
  - Verify CI Passed → gate que bloquea si CI falló
  - Deploy Summary → reporta resultado (siempre corre)

## Smoke Test (23 Jul 2026)

Se ejecutó una prueba controlada del pipeline:

1. Se rompió 1 test deliberadamente (`assert 200 == 201`)
2. CI falló → Backend Tests: failure
3. deploy.yml: Verify CI Passed → SKIPPED (gate funcionó)
4. Vercel/Railway jobs → SKIPPED
5. Se revirtió con `git revert`
6. CI volvió a verde (3/3 jobs)

**Resultado**: Pipeline funciona correctamente. El gate bloquea deploys cuando CI falla.

## Lecciones Aprendidas

1. **`ignoreCommand` de Vercel es binario**: bloquea Deploy Hooks, no solo git pushes. No sirve para gated deploys.
2. **Railway "Wait for CI" es la solución correcta**: nativo, sin race conditions.
3. **Vercel no tiene "Wait for CI"**: con Git conectado, el auto-deploy es inevitable.
4. **No luchar contra la plataforma**: si Vercel deploya en push, aceptarlo. El build es el gate.
5. **YAML es frágil**: caracteres Unicode en comentarios rompen validación.

## Variables de Entorno

### GitHub Secrets
- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`

### Railway Variables
- `SECRET_KEY`, `DATABASE_URL`, `ENVIRONMENT=production`, `FRONTEND_URL`
- `SENTRY_DSN`, `WEBHOOK_SECRET`
- Blockchain: `SYSTEM_WALLET_ADDRESS`, `SYSTEM_WALLET_PRIVATE_KEY`, etc.

### Vercel Variables
- `NEXT_PUBLIC_API_URL`
