@echo off
echo 🚀 Starting E-Commerce Backend Server...
echo.

cd /d "E:\MINI PROJECT\ECommerceApp\backend"

echo 📍 Current directory: %cd%
echo.

echo 🔍 Checking if Node.js is available...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo 📦 Installing/updating dependencies...
npm install

echo.
echo 🎯 Starting the server...
npm start

pause