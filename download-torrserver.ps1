$ErrorActionPreference = 'Stop'
$assetUrl = "https://github.com/YouROK/TorrServer/releases/download/MatriX.142.2/TorrServer-windows-amd64.exe"
$outPath = "bin/TorrServer.exe"

if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

Write-Host "Downloading TorrServer-windows-amd64.exe (61 MB) to $outPath ..."
$webClient = New-Object System.Net.WebClient
$webClient.DownloadFile($assetUrl, $outPath)

Write-Host "Download finished. Verifying file size..."
$file = Get-Item $outPath
Write-Host "Downloaded file size: $($file.Length) bytes"

if ($file.Length -gt 50000000) {
    Write-Host "TorrServer.exe is ready and verified!"
} else {
    Write-Error "Downloaded file size mismatch (Expected > 50MB)."
}
