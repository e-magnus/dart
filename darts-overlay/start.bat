@echo off
REM Darts Overlay System - Windows Launcher
REM This script starts the WebSocket server and opens the control panel

setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
cd /d "%~dp0"

REM Display banner
cls
echo.
echo ========================================
echo   DARTS 501 OVERLAY SYSTEM
echo   Initializing...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then try running this script again.
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js detected
echo.

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies (first run only)...
    echo.
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

echo ✓ Dependencies ready
echo.

REM Display next steps
echo ========================================
echo   STARTUP SEQUENCE
echo ========================================
echo.
echo 1. WebSocket server starting on port 8080...
echo 2. Control panel will open in your browser...
echo 3. Keep this window open while playing
echo.
echo SETUP FOR OBS:
echo - Add Browser source to OBS
echo - URL: file:///%cd%\overlay\overlay.html
echo - Size: 1920x1080
echo.
echo Press any key to start...
echo.
pause >nul

REM Start server in a new window
echo Starting server...
start "Darts Server" cmd /k "node server/server.js"

REM Wait for server to start
timeout /t 2 /nobreak >nul

REM Open control panel in default browser
echo Opening control panel...
start "" file:///%cd%\control\control.html

echo.
echo ========================================
echo   SERVER RUNNING
echo ========================================
echo.
echo Control Panel: http://localhost/control/control.html
echo Overlay File: file:///%cd%\overlay\overlay.html
echo.
echo The server will continue running in the other window.
echo Close that window to stop the server.
echo.
pause
