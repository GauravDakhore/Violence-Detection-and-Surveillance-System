#!/bin/bash
# start-all.sh - Start both backend and frontend

echo "==========================================="
echo "Surveillance Dashboard - ML Integration"
echo "==========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+"
    exit 1
fi

echo "✓ Python found"

# Install backend dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

echo "✓ Python dependencies installed"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✓ Node.js found"

# Install frontend dependencies
echo ""
echo "📦 Installing Node dependencies..."
cd surveillance-dashboard
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Node dependencies"
    exit 1
fi

echo "✓ Node dependencies installed"
cd ..

echo ""
echo "==========================================="
echo "✓ Setup complete!"
echo "==========================================="
echo ""
echo "To start the services:"
echo "  Backend:  python backend.py"
echo "  Frontend: cd surveillance-dashboard && npm run dev"
echo ""
echo "Make sure modelnew.h5 is in the root directory!"
echo ""
