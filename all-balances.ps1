$pw = "Admin123" + "!"
$body = @{email="admin@turnogo.com";password=*** | ConvertTo-Json
$resp = Invoke-RestMethod -Uri "https://freelance-web-beta.vercel.app/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$tok = $resp.access_token
$auth = "Bearer $tok"

$users = Invoke-RestMethod -Uri "https://freelance-web-beta.vercel.app/api/v1/admin/users?per_page=50" -Method GET -Headers @{Authorization=$auth}
foreach ($u in $users.users) {
    Write-Host "ID=$($u.id) | $($u.email) | role=$($u.role) | balance=$($u.balance)"
}
