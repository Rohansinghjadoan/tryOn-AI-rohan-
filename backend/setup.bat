@echo off
echo Setting up TryOnAI Backend...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.10+
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Copy env file if not exists
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo Please edit .env with your database credentials
)

REM Initialize database
echo Initializing database...
python scripts\init_db.py

echo.
echo Backend setup complete!
echo.
echo To start the backend:
echo   1. Activate virtual environment: venv\Scripts\activate
echo   2. Run: cd app ^&^& python main.py
echo.
echo API will be available at: http://localhost:8000
echo API docs at: http://localhost:8000/api/docs
pause
