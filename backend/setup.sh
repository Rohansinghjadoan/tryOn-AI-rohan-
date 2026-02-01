#!/bin/bash

echo "🚀 Setting up TryOnAI Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL 14+"
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Copy env file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your database credentials"
fi

# Initialize database
echo "🗄️  Initializing database..."
python scripts/init_db.py

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "To start the backend:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run: cd app && python main.py"
echo ""
echo "API will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/api/docs"
