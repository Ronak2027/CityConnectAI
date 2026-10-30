# CleanCity AI Launch Script
$env:Path = "E:\Program Files\nodejs;" + $env:Path

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting CleanCity AI (Backend + Frontend)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'E:\Program Files\nodejs;' + `$env:Path; Set-Location '$backendDir'; node server.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = 'E:\Program Files\nodejs;' + `$env:Path; Set-Location '$frontendDir'; npm.cmd run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
