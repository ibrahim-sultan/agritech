#!/bin/bash

echo "Starting AgricTech Dashboard..."
echo

echo "Step 1: Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Error installing server dependencies!"
    exit 1
fi

echo
echo "Step 2: Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "Error installing client dependencies!"
    exit 1
fi

echo
echo "Step 3: Setting up environment files..."
cd ../server
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created server .env file from example"
fi

cd ../client
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created client .env file from example"
fi

echo
echo "Step 4: Seeding crop price data..."
cd ../server
npm run seed-prices
if [ $? -ne 0 ]; then
    echo "Warning: Could not seed crop prices. Make sure MongoDB is running."
fi

echo
echo "Step 5: Starting the application..."
echo "Starting server in background..."

# Start server in background
npm run dev &
SERVER_PID=$!

sleep 3

echo "Starting client..."
cd ../client
npm start &
CLIENT_PID=$!

echo
echo "AgricTech Dashboard is starting up!"
echo "Server: http://localhost:5000"
echo "Client: http://localhost:3000"
echo
echo "Press Ctrl+C to stop both server and client"

# Wait for user to stop
trap "kill $SERVER_PID $CLIENT_PID; exit" INT
wait
