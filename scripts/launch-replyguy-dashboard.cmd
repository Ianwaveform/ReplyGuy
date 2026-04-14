@echo off
setlocal

set "ROOT=C:\Users\ianfo\Documents\ReplyGuy"

for %%P in (3001 4173) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    taskkill /PID %%I /F >nul 2>nul
  )
)

start "ReplyGuy Backend" /min cmd /k "cd /d %ROOT% && npm.cmd run dev:backend"
start "ReplyGuy Frontend" /min cmd /k "cd /d %ROOT% && npm.cmd run dev"

timeout /t 5 /nobreak >nul
start "" http://127.0.0.1:4173

endlocal
