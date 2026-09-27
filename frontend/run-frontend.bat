@echo off
title Quick Hire - React Frontend
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ========================================================
echo Starting Quick Hire Frontend (React + Vite + Tailwind CSS)
echo Web App URL: http://localhost:5173
echo ========================================================
call "C:\Program Files\nodejs\npm.cmd" run dev
pause
