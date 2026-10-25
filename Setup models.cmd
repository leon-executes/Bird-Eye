@echo off
rem Bird Eye - Parham (Leon) Faraji - leon-executes
cd /d "%~dp0"
echo Installs the complete council: EarthDial, Qwen3.5, CapRL and RemoteCLIP.
echo Uses local model parts first; otherwise downloads from leon-executes/bird-eye.
echo Model licences: docs\THIRD_PARTY.md. Detector is a separate optional add-on.
choice /C YN /N /M "Install or verify the complete council? [Y/N] "
if errorlevel 2 exit /b 0
runtime\node.exe scripts\install-model-parts.mjs
if errorlevel 1 goto failed
echo Setup complete. Restart Bird Eye.
pause
exit /b 0
:failed
echo Setup stopped. Verified downloads are retained. Read the error above.
pause
exit /b 1
