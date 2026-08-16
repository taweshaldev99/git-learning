@echo off
title Git Challenge Tracker
cd /d "%~dp0tracker-backend"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on your PATH.
  echo Install the LTS build from https://nodejs.org/ then run this file again.
  pause
  exit /b 1
)

echo Starting the tracker...
echo.

rem The server opens the browser itself, once the port is actually listening.
set OPEN_BROWSER=1
node server.js

echo.
echo Server stopped.
pause
