@echo off
title Quick Hire - Spring Boot Backend
cd /d "%~dp0"
set "_JAVA_OPTIONS=-Djava.net.preferIPv4Stack=true"

echo ========================================================
echo  Quick Hire Backend - Spring Boot 3
echo  API URL  : http://localhost:8080
echo  H2 Console: http://localhost:8080/h2-console
echo ========================================================
echo.

:: -----------------------------------------------------------
:: Load environment variables from .env file (if it exists)
:: -----------------------------------------------------------
if exist ".env" (
    echo [INFO] Loading environment variables from .env ...
    for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
        if not "%%A"=="" set "%%A=%%B"
    )
    echo [INFO] .env loaded successfully.
) else (
    echo [WARN] No .env file found. Using system environment variables.
    echo [WARN] Copy .env.example to .env and fill in your values.
    echo.
)

:: -----------------------------------------------------------
:: Validate that GEMINI_API_KEY is set
:: -----------------------------------------------------------
if "%GEMINI_API_KEY%"=="" (
    echo.
    echo [ERROR] GEMINI_API_KEY is not set!
    echo         1. Copy .env.example to .env
    echo         2. Open .env and paste your Gemini API key
    echo         3. Get a free key at: https://aistudio.google.com/app/apikey
    echo.
    pause
    exit /b 1
)

echo [OK] GEMINI_API_KEY is set.
echo [OK] Starting Spring Boot application...
echo.

:: -----------------------------------------------------------
:: Start the application
:: -----------------------------------------------------------
mvnw.cmd spring-boot:run
pause
