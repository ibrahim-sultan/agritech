#!/bin/bash

echo "🔧 Starting AgriTech build process..."
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

echo ""
echo "🏗️ Step 1: Installing server dependencies..."
cd server
echo "📍 Server directory: $(pwd)"
npm install
cd ..

echo ""
echo "🏗️ Step 2: Installing root dependencies..."
npm install

echo ""
echo "🏗️ Step 3: Building React client..."
cd client
echo "📍 Client directory: $(pwd)"
echo "📁 Client directory contents:"
ls -la

npm install
npm run build

echo ""
echo "📍 Back to root: $(pwd)"
cd ..

echo ""
echo "🔍 Checking if React build was created..."
if [ -d "client/build" ]; then
    echo "✅ React build found at client/build"
    echo "📁 Build contents:"
    ls -la client/build/
    if [ -f "client/build/index.html" ]; then
        echo "✅ index.html found in build directory"
    else
        echo "❌ index.html NOT found in build directory"
    fi
else
    echo "❌ React build NOT found at client/build"
fi

echo ""
echo "🔍 Full project structure:"
find . -name "index.html" -type f
echo ""
echo "🎉 Build process completed!"