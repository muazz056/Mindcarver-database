@echo off
echo Installing CSV Database Manager Dependencies...
echo.

echo Installing root dependencies...
powershell -ExecutionPolicy Bypass -Command "npm install"

echo.
echo Installing server dependencies...
cd server
powershell -ExecutionPolicy Bypass -Command "npm install"

echo.
echo Installing client dependencies...
cd ../client
powershell -ExecutionPolicy Bypass -Command "npm install"

cd ..

echo.
echo All dependencies installed successfully!
echo.
echo You can now run the application by:
echo 1. Double-clicking "start-app.bat"
echo 2. Or running "npm start" in the terminal
echo.

pause 