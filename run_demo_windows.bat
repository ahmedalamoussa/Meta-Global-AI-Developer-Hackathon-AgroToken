@echo off
setlocal
cd /d "%~dp0backend"
echo Installing/checking Python requirements...
python -m pip install -r requirements.txt
if errorlevel 1 (
  echo Could not install Python dependencies. Check Python and internet connection.
  pause
  exit /b 1
)
echo.
echo AgroToken is opening at http://localhost:8000/
echo Close this window or press Ctrl+C to stop.
python -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
