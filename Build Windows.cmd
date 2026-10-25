@echo off
rem Bird Eye - Parham (Leon) Faraji - leon-executes
cd /d "%~dp0"
set "BIRD_NODE=node"
if exist runtime\node.exe set "BIRD_NODE=runtime\node.exe"
"%BIRD_NODE%" scripts\setup-runtime.mjs
if errorlevel 1 goto failed
"%BIRD_NODE%" scripts\download-desktop.mjs
if errorlevel 1 goto failed
"%BIRD_NODE%" scripts\download-build-tool.mjs
if errorlevel 1 goto failed
"%BIRD_NODE%" scripts\render-icon.mjs
if errorlevel 1 goto failed
"%BIRD_NODE%" --test tests/*.test.mjs
if errorlevel 1 goto failed
"%BIRD_NODE%" scripts\build-desktop.mjs %*
if errorlevel 1 goto failed
echo Release ZIPs are in dist.
pause
exit /b 0
:failed
echo Build stopped; inspect the preceding error.
pause
exit /b 1
