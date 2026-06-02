# Run on this PC (Pakistan ISP IP). Use with Windows Task Scheduler — no GitHub cloud involved.
# Copy .env.example to .env and fill in credentials.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root '.env'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
        $name, $value = $_ -split '=', 2
        if ($name) {
            Set-Item -Path "env:$($name.Trim())" -Value $value.Trim().Trim('"')
        }
    }
}

if (-not $env:MIHCM_USERNAME -or -not $env:MIHCM_PASSWORD) {
    Write-Error 'Missing MIHCM_USERNAME or MIHCM_PASSWORD. Copy .env.example to .env and set values.'
}

$delay = Get-Random -Minimum 0 -Maximum 900
Write-Host "Random delay: $delay seconds (~$([math]::Floor($delay / 60)) min)..."
Start-Sleep -Seconds $delay

node start-my-day.js
