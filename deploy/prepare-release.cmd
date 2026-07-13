@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0prepare-release.ps1"
if errorlevel 1 exit /b %errorlevel%
pause
