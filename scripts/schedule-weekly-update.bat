@echo off
REM Weekly Authority Update Script for Taxentia-AI
REM Run this with Windows Task Scheduler every Sunday at 2 AM

echo ========================================
echo Taxentia-AI Weekly Authority Update
echo Started: %date% %time%
echo ========================================

cd /d "%~dp0.."

REM Update recent IRS bulletins (last 5)
echo.
echo Updating IRS Bulletins...
call npm run ingest:irb 5

REM Optional: Update USC and CFR monthly (uncomment on first Sunday of month)
REM echo.
REM echo Updating US Code Title 26...
REM call npm run ingest:usc
REM echo.
REM echo Updating CFR Title 26...
REM call npm run ingest:cfr

echo.
echo ========================================
echo Weekly update completed: %date% %time%
echo ========================================

REM Keep window open on error
if errorlevel 1 (
  echo.
  echo ERROR: Update failed!
  pause
)
