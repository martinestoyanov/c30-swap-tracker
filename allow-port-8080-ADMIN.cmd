@echo off
REM One-time: allow inbound TCP 8080 so Tailscale devices can reach the dev server.
REM Right-click this file and choose "Run as administrator".
netsh advfirewall firewall delete rule name="C30 Swap Tracker (Tailscale 8080)" >nul 2>&1
netsh advfirewall firewall add rule name="C30 Swap Tracker (Tailscale 8080)" dir=in action=allow protocol=TCP localport=8080 profile=any
echo.
echo Done. You can close this window.
pause
