@echo off
REM Weekly Authority Update Script for Taxentia-AI
REM Run this with Windows Task Scheduler every Sunday at 2 AM
REM
REM Setup Instructions:
REM 1. Open Task Scheduler (taskschd.msc)
REM 2. Create Basic Task:
REM    - Name: "Taxentia-AI Weekly Update"
REM    - Trigger: Weekly, Sunday at 2:00 AM
REM    - Action: Start a program
REM    - Program: %COMSPEC%
REM    - Arguments: /c "C:\path\to\Taxentia-AI\scripts\schedule-weekly-update.bat"
REM    - Start in: C:\path\to\Taxentia-AI
REM

echo ========================================
echo Taxentia-AI Weekly Authority Update
echo Started: %date% %time%
echo ========================================

cd /d "%~dp0.."

REM Verify Node.js is available
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH!
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

REM Update recent IRS bulletins (last 5)
echo.
echo Updating IRS Bulletins...
echo.
call npm run ingest:authorities irb 5
if errorlevel 1 (
  echo.
  echo ERROR: IRS Bulletin update failed!
  echo.
  pause
  exit /b 1
)

echo.
echo ========================================
echo Weekly update completed: %date% %time%
echo ========================================

REM Optional: Update USC and CFR monthly (uncomment on first Sunday of month)
REM echo.
REM echo Updating US Code Title 26...
REM call npm run ingest:authorities usc
REM if errorlevel 1 goto error
REM echo.
REM echo Updating CFR Title 26...
REM call npm run ingest:authorities cfr
REM if errorlevel 1 goto error
REM exit /b 0

REM :error
REM echo ERROR: Update failed!
REM pause
REM exit /b 1
