@echo off
title C30 AWD Swap Tracker - dev server (port 8080)
cd /d "C:\Users\marti\Documents\Kimi\Workspaces\C30 Swap\c30-swap-site"

set "NPM=C:\Users\marti\AppData\Local\Programs\kimi-desktop\resources\resources\runtime\npm.cmd"

REM --- Runtime check --------------------------------------------------------
if not exist "%NPM%" (
  echo ERROR: Node runtime not found at:
  echo   %NPM%
  echo The Kimi desktop runtime may have moved - ask the assistant to re-detect it.
  echo.
  pause
  exit /b 1
)

REM --- Port conflict pre-check ---------------------------------------------
netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul
if not errorlevel 1 (
  echo.
  echo *** Port 8080 is already in use by another process: ***
  netstat -ano | findstr /R /C:":8080 .*LISTENING"
  echo.
  echo Take the PID from the last column above and find it in
  echo Task Manager - Details tab to see which program holds the port.
  echo Stop that program, then re-run this script.
  echo.
  pause
  exit /b 1
)

echo Starting C30 AWD Swap Tracker on http://localhost:8080 ...
echo From phone/tablet on Tailscale: http://100.124.10.99:8080
echo Close this window to stop the server.
echo.

"%NPM%" run dev

echo.
echo ---------------------------------------------------------------
echo The server exited (code %errorlevel%).
echo If it died immediately, the error message is printed above.
echo ---------------------------------------------------------------
pause
