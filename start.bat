@echo off

:: credits to openai's o3-mini

where deno >nul 2>&1
if errorlevel 1 (
    echo installing deno...
    call setup.bat
)

if not exist ".env" (
    echo making .env...
    copy example.env .env
)

call run.bat
