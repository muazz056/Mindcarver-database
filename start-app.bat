@echo off
echo Starting CSV Database Manager...
echo.
echo This will start both the backend server (port 5000) and frontend (port 3000)
echo.
echo Backend API: http://localhost:5000
echo Frontend App: http://localhost:3000
echo.
echo Press Ctrl+C to stop the servers
echo.

powershell -ExecutionPolicy Bypass -Command "npm start"

pause 