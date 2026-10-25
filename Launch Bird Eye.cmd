@echo off
rem Bird Eye - Parham (Leon) Faraji - leon-executes
cd /d "%~dp0"
if not exist "runtime\electron\electron.exe" (
  echo Run Build Windows.cmd to prepare the desktop runtime.
  pause
  exit /b 1
)
start "" "runtime\electron\electron.exe" "%~dp0."
