@echo off
REM Quick start script for TryOnAI Backend (Windows)
REM Handles both PostgreSQL and SQLite fallback automatically

echo ==========================================
echo TryOnAI Backend - Quick Start
echo ==========================================
echo.

REM Check if venv exists
if not exist "venv" (
    echo Virtual environment not found. Creating...
    python -m venv venv
    echo [OK] Virtual environment created
)

REM Activate venv
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies if needed
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo [OK] Dependencies installed
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo [OK] .env created (you can edit this file to configure PostgreSQL^)
)

echo.
echo ==========================================
echo Starting backend...
echo ==========================================
echo.
echo Note: If PostgreSQL connection fails, backend will automatically
echo fall back to SQLite for local development.
echo.

REM Run the server
python run.py
