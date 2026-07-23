# TurnoGO — Observability Guide

## Architecture

```
                    ┌─────────────────────────────┐
                    │      TurnoGO Backend        │
                    │                             │
                    │  JSON Logs ───────────────► │
                    │  Request IDs ─────────────► │
                    │  /metrics (Prometheus) ────► │
                    │  /live  /ready  /health  ──► │
                    │  Sentry SDK ───────────────► │
                    └─────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              Prometheus        Grafana          Sentry
              (scrapes         (dashboards)     (errors)
               /metrics)
```

---

## Endpoints

| Endpoint | Purpose | External Use |
|----------|---------|-------------|
| `GET /api/v1/health` | General health check | Monitors, uptime checks |
| `GET /live` | Liveness probe (no DB) | Railway health check, process monitor |
| `GET /ready` | Readiness probe (DB check) | Load balancer, ingress |
| `GET /metrics` | Prometheus metrics | Prometheus scraper |
| `X-Request-ID` header | Request correlation | Client → API → Logs → Sentry |

### Response examples

```bash
# /live — process alive
curl https://api.turnogo.com/live
→ 200 {"status":"alive"}

# /ready — ready for traffic
curl https://api.turnogo.com/ready
→ 200 {"status":"ready","checks":{"database":"ok"}}

# /ready — DB down
curl https://api.turnogo.com/ready
→ 503 {"status":"not_ready","checks":{"database":"unavailable"}}

# Send custom request ID from frontend
curl -H "X-Request-ID: user-action-abc123" https://api.turnogo.com/api/v1/health
→ 200 {"status":"ok"}
   X-Request-ID: user-action-abc123
```

---

## Prometheus Metrics

All metrics use `turnogo_` prefix.

### HTTP

| Metric | Type | Labels |
|--------|------|--------|
| `turnogo_http_requests_total` | Counter | method, endpoint, status |
| `turnogo_http_request_duration_seconds` | Histogram | method, endpoint |
| `turnogo_http_errors_total` | Counter | method, endpoint, status_class |

### Infrastructure

| Metric | Type | Notes |
|--------|------|-------|
| `turnogo_database_status` | Gauge | 1=ok, 0=down |
| `turnogo_app_info` | Info | name, version, environment |

### Connecting Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: turnogo
    scrape_interval: 15s
    metrics_path: /metrics
    static_configs:
      - targets: ['api.turnogo.com']
```

---

## Grafana Dashboards

### Recommended dashboards (import via JSON)

#### 1. API Overview
- **Panels**: Total requests, requests/min, active endpoints
- **Query**: `rate(turnogo_http_requests_total[5m])`

#### 2. Latency
- **Panels**: p50, p95, p99 latency per endpoint
- **Query**: `histogram_quantile(0.95, rate(turnogo_http_request_duration_seconds_bucket[5m]))`

#### 3. Errors
- **Panels**: 4xx rate, 5xx rate, errors by endpoint
- **Query**: `rate(turnogo_http_errors_total{status_class="5xx"}[5m])`

#### 4. Health
- **Panels**: DB status, uptime, /live response time
- **Query**: `turnogo_database_status`

---

## Alert Rules

### Prometheus AlertManager rules

```yaml
groups:
  - name: turnogo
    rules:
      # Critical: API down
      - alert: TurnogoAPI Down
        expr: up{job="turnogo"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "TurnoGO API is down"
          description: "The /live endpoint has been failing for 2 minutes."

      # Critical: Database unavailable
      - alert: TurnogoDatabaseDown
        expr: turnogo_database_status == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "TurnoGO database unavailable"
          description: "The /ready endpoint reports database as unavailable."

      # High 5xx error rate
      - alert: TurnogoHigh5xxRate
        expr: |
          rate(turnogo_http_errors_total{status_class="5xx"}[5m])
          / rate(turnogo_http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High 5xx error rate on TurnoGO"
          description: "5xx errors exceed 5% over the last 5 minutes."

      # High latency
      - alert: TurnogoHighLatency
        expr: |
          histogram_quantile(0.95,
            rate(turnogo_http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High p95 latency on TurnoGO"
          description: "p95 latency exceeds 2 seconds over the last 5 minutes."

      # Elevated 4xx rate (possible auth/client issues)
      - alert: TurnogoElevated4xxRate
        expr: |
          rate(turnogo_http_errors_total{status_class="4xx"}[10m])
          / rate(turnogo_http_requests_total[10m]) > 0.25
        for: 10m
        labels:
          severity: info
        annotations:
          summary: "Elevated 4xx rate on TurnoGO"
          description: "4xx errors exceed 25% — check for client issues or auth problems."
```

---

## Sentry Configuration

### Current Setup
- **SDK**: sentry-sdk 2.64.0
- **Integrations**: FastAPI, SQLAlchemy
- **Environment**: `development` / `production` (from `ENVIRONMENT` env var)
- **Traces**: 10% sample rate (`traces_sample_rate=0.1`)
- **PII**: Disabled (`send_default_pii=False`)
- **Sanitization**: `before_send` hook scrubs passwords, tokens, keys
- **Correlation**: `request_id` tag attached automatically

### Environment Variables
```
SENTRY_DSN=https://xxx@sentry.io/xxx
ENVIRONMENT=production
```

### Verifying Sentry
```bash
# Force a test error
curl -H "X-Request-ID: sentry-test-001" \
  https://api.turnogo.com/api/v1/_sentry-test  # non-existent endpoint
# Check Sentry dashboard for the error with tag: request_id=sentry-test-001
```

---

## Investigating Errors with request_id

### Step-by-step

1. **Frontend catches error**, shows request_id to user or captures in Sentry
2. **Find the request**:
   ```bash
   # Railway logs
   railway logs --service turnogo-backend | grep "a3f8b2c1"
   ```
3. **Trace the full lifecycle**:
   - Logs show: method, path, duration_ms, status
   - Sentry shows: exception type, stack trace, user (if auth'd)
   - Metrics show: endpoint latency at that time
4. **Correlate with other services**:
   - Same request_id in email send logs
   - Same request_id in push notification logs
   - Same request_id in blockchain scan logs

### Example investigation

```
User: "El pago no se liberó a las 14:32"
→ Frontend envía X-Request-ID: pay-release-fail-001
→ Logs muestran:
   [pay-release-fail-001] POST /api/v1/payments/release/42 → 400
   [pay-release-fail-001] held_balance insufficient: 50.00 < 100.00
→ Diagnóstico en < 1 minuto: fondos insuficientes en escrow
```

---

## Railway Configuration

### Health check endpoint
Set in Railway service settings:
```
Health Check Path: /live
```

### Logs
Railway automatically collects stdout. JSON logs are parsed natively.

---

## Future Improvements

- [ ] Grafana dashboard JSON files in `infra/grafana/`
- [ ] Alertmanager config in `infra/prometheus/`
- [ ] OpenTelemetry tracing for distributed traces
- [ ] `/admin/operations` dashboard (business metrics: users, jobs, payments)
- [ ] Rate limiting metrics (`turnogo_rate_limits_total`)
- [ ] Business metrics (`turnogo_jobs_created_total`, `turnogo_payments_total`)
