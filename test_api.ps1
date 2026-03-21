#!/usr/bin/env pwsh

$baseUrl = "http://localhost:5000/api"
$contentType = "application/json"

Write-Host "--- Testing SocialVerse API ---" -ForegroundColor Cyan

# 1. Register
Write-Host "1. Registering user..."
$regBody = @{
    userid = "devuser"
    name = "Dev User"
    email = "dev@example.com"
    password = "password123"
    dob = "2000-01-01"
    gender = "Male"
} | ConvertTo-Json

try {
    $regRes = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/register" -Body $regBody -ContentType $contentType
    Write-Host "Registration Success! User ID: $($regRes.userid)" -ForegroundColor Green
} catch {
    Write-Host "Registration Failed (User might exist, trying login...)" -ForegroundColor Yellow
}

# 2. Login
Write-Host "2. Logging in..."
$loginBody = @{
    email = "dev@example.com"
    password = "password123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -Body $loginBody -ContentType $contentType
$token = $loginRes.token

if ($token) {
    Write-Host "Login Success! Token obtained." -ForegroundColor Green
    $headers = @{ Authorization = "Bearer $token" }

    # 3. Get Feed
    Write-Host "3. Fetching Feed..."
    $feed = Invoke-RestMethod -Method Get -Uri "$baseUrl/posts/feed" -Headers $headers
    Write-Host "Feed item found: $($feed[0].caption)" -ForegroundColor Gray

    # 4. Discovery
    Write-Host "4. Testing Nearby Discovery..."
    $nearby = Invoke-RestMethod -Method Get -Uri "$baseUrl/discovery/nearby?longitude=0&latitude=0" -Headers $headers
    Write-Host "Nearby check completed. Found $($nearby.Count) users." -ForegroundColor Gray

    Write-Host "`nAll core tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to obtain token. Check if server is running." -ForegroundColor Red
}
