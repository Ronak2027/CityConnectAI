@echo off
title CleanCity AI - Smart Municipal App Runner
echo ========================================================
echo  Starting CleanCity AI (Backend + Frontend)
echo ========================================================

set "PATH=E:\Program Files\nodejs;%PATH%"

echo Starting Backend API (Port 5000)...
start "CleanCity AI Backend" cmd /k "cd /d %~dp0backend && node server.js"

echo Starting Frontend Dev Server (Port 3000)...
start "CleanCity AI Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo ========================================================
echo  Both servers launched!
echo  Backend:  http://localhost:5000/api/health
echo  Frontend: http://localhost:3000
echo ========================================================
timeout /t 3 >nul
start http://localhost:3000
