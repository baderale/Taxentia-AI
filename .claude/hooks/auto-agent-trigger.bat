@echo off
REM Auto-trigger specialized agents based on file changes
REM This hook runs after Edit/Write tool usage to trigger appropriate review agents

REM Get the tool name and file path from arguments
set TOOL_NAME=%1
set FILE_PATH=%2

REM Determine which agents to trigger based on file patterns
set RUN_TAX=false
set RUN_UI=false
set RUN_BACKEND=false

REM Check for tax-related backend files
echo %FILE_PATH% | findstr /i "server.*service.*\.ts$ server.*query.*\.ts$ shared.*taxResponseSchema.*\.ts$" >nul
if %errorlevel% equ 0 set RUN_TAX=true

REM Check for UI-related files
echo %FILE_PATH% | findstr /i "client.*\.tsx$ client.*\.jsx$ client.*component.*\.ts$" >nul
if %errorlevel% equ 0 set RUN_UI=true

REM Check for backend-related files
echo %FILE_PATH% | findstr /i "server.*\.ts$ server.*routes.*\.ts$ server.*storage.*\.ts$" >nul
if %errorlevel% equ 0 set RUN_BACKEND=true

REM Output agent trigger notifications
if "%RUN_TAX%"=="true" (
    echo [Hook] Tax compliance review recommended for: %FILE_PATH%
    echo [Hook] Run: npx tsx agents/run-agent.ts tax "%FILE_PATH%"
)

if "%RUN_UI%"=="true" (
    echo [Hook] UI/UX review recommended for client changes
    echo [Hook] Run: npx tsx agents/run-agent.ts ui http://localhost:5173
)

if "%RUN_BACKEND%"=="true" (
    echo [Hook] Backend code review recommended for: %FILE_PATH%
    echo [Hook] Run: npx tsx agents/run-agent.ts backend "%FILE_PATH%"
)

REM Exit successfully (don't block the operation)
exit /b 0
