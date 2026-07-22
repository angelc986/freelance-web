$password = "Admin123!"
$body = @{email="admin@turnogo.com";password=$password} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "https://freelance-web-beta.vercel.app/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$tok = $response.access_token
Write-Host "TOKEN_LEN: $($tok.Length)"

# Get jobs via admin API
$authHeader = "Bearer $tok"
$jobs = Invoke-RestMethod -Uri "https://freelance-web-beta.vercel.app/api/v1/admin/jobs?per_page=100" -Method GET -Headers @{Authorization=$authHeader}
Write-Host "Total jobs: $($jobs.total)"
foreach ($j in $jobs.jobs) {
    Write-Host "ID=$($j.id) | $($j.title) | $($j.status) | client=$($j.client_id) | worker=$($j.worker_id)"
}

# Delete all jobs
foreach ($j in $jobs.jobs) {
    try {
        # No hay endpoint de delete, pero podemos cancelarlos
        Write-Host "Procesando job ID=$($j.id)..."
    } catch {
        Write-Host "Error con job $($j.id): $_"
    }
}
