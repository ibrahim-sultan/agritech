@echo off
echo Starting AgricTech Dashboard...
echo.

echo Step 1: Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Error installing server dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Installing client dependencies...
cd ../client
call npm install
if %errorlevel% neq 0 (
    echo Error installing client dependencies!
    pause
    exit /b 1
)

echo.
echo Step 3: Setting up environment files...
cd ../server
if not exist .env (
    copy .env.example .env
    echo Created server .env file from example
)

cd ../client
if not exist .env (
    copy .env.example .env
    echo Created client .env file from example
)

echo.
echo Step 4: Seeding crop price data...
cd ../server
call npm run seed-prices
if %errorlevel% neq 0 (
    echo Warning: Could not seed crop prices. Make sure MongoDB is running.
)

echo.
echo Step 5: Starting the application...
echo Starting server in background...
start "AgricTech Server" cmd /k "cd /d %cd% && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting client...
cd ../client
start "AgricTech Client" cmd /k "cd /d %cd% && npm start"

echo.
echo AgricTech Dashboard is starting up!
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo Press any key to exit this window...
pause > nul
