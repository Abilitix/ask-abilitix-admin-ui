# PowerShell script to test Runtime API CORS
Write-Host "Testing Runtime API CORS configuration..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Testing OPTIONS preflight request:" -ForegroundColor Yellow
$optionsResponse = Invoke-WebRequest -Uri "https://ask-abilitix-runtime.onrender.com/ask" `
  -Method OPTIONS `
  -Headers @{
    "Origin" = "https://app.abilitix.com.au"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "Content-Type,x-tenant-slug,X-Widget-Key"
  } `
  -UseBasicParsing

Write-Host "Response Status:" $optionsResponse.StatusCode
Write-Host "CORS Headers:"
$optionsResponse.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
    Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Testing POST request CORS headers:" -ForegroundColor Yellow
try {
    $postResponse = Invoke-WebRequest -Uri "https://ask-abilitix-runtime.onrender.com/ask" `
      -Method POST `
      -Headers @{
        "Origin" = "https://app.abilitix.com.au"
        "Content-Type" = "application/json"
        "x-tenant-slug" = "abilitix-pilot"
        "X-Widget-Key" = "wid_test"
      } `
      -Body '{"question":"test","session_id":"test-123"}' `
      -UseBasicParsing

    Write-Host "Response Status:" $postResponse.StatusCode
    Write-Host "CORS Headers:"
    $postResponse.Headers | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Green
    }
} catch {
    Write-Host "POST request failed (expected - widget key is test):" $_.Exception.Message -ForegroundColor Yellow
    Write-Host "But check if CORS headers are present in error response..."
}


