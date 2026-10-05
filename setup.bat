@echo off
REM ============================================================
REM JanDrishti - one-time setup (installs deps, trains model)
REM ============================================================
cd /d "%~dp0"
echo.
echo [1/4] Installing Python backend dependencies...
python -m pip install -r backend\requirements.txt || goto :err
echo.
echo [2/4] Installing frontend dependencies...
call npm install || goto :err
echo.
echo [3/4] Training the emotion model...
cd backend
python emotion_model.py || goto :err
echo.
echo [4/4] Building the analysis snapshot...
python pipeline.py || goto :err
cd ..
echo.
echo ============================================================
echo  Setup complete.  Double-click run.bat to start JanDrishti.
echo ============================================================
pause
exit /b 0
:err
echo.
echo Setup failed. See the error above.
pause
exit /b 1
