@echo off
setlocal
cd /d "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo PowerShell tidak ditemukan.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
if errorlevel 1 (
  echo.
  echo AILO gagal dijalankan. Periksa pesan error di atas.
  pause
  exit /b %errorlevel%
)

endlocal
