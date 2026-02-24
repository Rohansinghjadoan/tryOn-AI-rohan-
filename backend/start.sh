#!/bin/bash
# Quick start script for TryOnAI Backend
# Handles both PostgreSQL and SQLite fallback automatically

echo "=========================================="
echo "TryOnAI Backend - Quick Start"
echo "=========================================="
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate venv
echo "Activating virtual environment..."
source venv/Scripts/activate || source venv/bin/activate

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo "✓ Dependencies installed"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env created (you can edit this file to configure PostgreSQL)"
fi

echo ""
echo "=========================================="
echo "Starting backend..."
echo "=========================================="
echo ""
echo "Note: If PostgreSQL connection fails, backend will automatically"
echo "fall back to SQLite for local development."
echo ""

# Run the server
python run.py
