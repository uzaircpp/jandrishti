@echo off
REM ============================================================
REM JanDrishti - start backend + frontend, open the browser
REM (run setup.bat once first)
REM ============================================================
cd /d "%~dp0"
echo Starting the FastAPI backend (port 8000)...
start "JanDrishti API" cmd /k "cd /d %~dp0backend && python app.py"
echo Waiting for the API to come up...
timeout /t 4 >nul
echo Starting the web app (port 5174)...
start "JanDrishti Web" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 5 >nul
start "" http://localhost:5174
echo.
echo JanDrishti is starting. Two terminal windows opened:
echo   - JanDrishti API  (backend)
echo   - JanDrishti Web  (frontend)
echo Close those windows to stop the app.
