@echo off
REM start-all.bat - Start both backend and frontend (Windows)

setlocal enabledelayedexpansion

echo ===========================================
echo Surveillance Dashboard - ML Integration
echo ===========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+
    exit /b 1
)

echo [OK] Python found

REM Install backend dependencies
echo.
echo [*] Installing Python dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    exit /b 1
)

echo [OK] Python dependencies installed

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

echo [OK] Node.js found

REM Install frontend dependencies
echo.
echo [*] Installing Node dependencies...
cd surveillance-dashboard
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node dependencies
    exit /b 1
)

echo [OK] Node dependencies installed
cd ..

echo.
echo ===========================================
echo [OK] Setup complete!
echo ===========================================
echo.
echo To start the services:
echo   Backend:  python backend.py
echo   Frontend: cd surveillance-dashboard ^&^& npm run dev
echo.
echo Make sure modelnew.h5 is in the root directory!
echo.
pause
