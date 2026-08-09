@echo off
title TorrStream — Instant Magnet Video Player
cls

echo ====================================================
echo  ✨ TorrStream Web OTT Video Player Launcher
echo ====================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Check if TorrServer binary exists
if not exist "bin\TorrServer.exe" (
    echo [INFO] TorrServer binary missing. Downloading official TorrServer engine...
    powershell -ExecutionPolicy Bypass -File "download-torrserver.ps1"
    if not exist "bin\TorrServer.exe" (
        echo [ERROR] Failed to download TorrServer.exe!
        pause
        exit /b 1
    )
)

:: 3. Install NPM dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
)

:: 4. Auto-open Web Player in Browser
echo [INFO] Starting TorrStream Web Player on http://localhost:3000...
start http://localhost:3000

:: 5. Launch Full-Stack Application Server
node start-player.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server exited with error code %errorlevel%.
    pause
)
