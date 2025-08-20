#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Get the directory of this script
const rootDir = __dirname;
const serverDir = path.join(rootDir, 'server');
const serverPath = path.join(serverDir, 'server.js');

console.log('🚀 Starting AgriTech Dashboard...');
console.log('📁 Root directory:', rootDir);
console.log('📁 Server directory:', serverDir);
console.log('🔍 Server path:', serverPath);

// Check if server file exists
const fs = require('fs');
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server file not found at:', serverPath);
  console.log('📂 Available files in root:');
  try {
    const files = fs.readdirSync(rootDir);
    files.forEach(file => {
      const filePath = path.join(rootDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${file}`);
    });
    
    if (fs.existsSync(serverDir)) {
      console.log('📂 Available files in server directory:');
      const serverFiles = fs.readdirSync(serverDir);
      serverFiles.forEach(file => {
        const filePath = path.join(serverDir, file);
        const stats = fs.statSync(filePath);
        console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${file}`);
      });
    }
  } catch (err) {
    console.error('Error reading directory:', err.message);
  }
  process.exit(1);
}

// Check if server dependencies are installed
const serverNodeModules = path.join(serverDir, 'node_modules');
if (!fs.existsSync(serverNodeModules)) {
  console.error('❌ Server dependencies not found. Please run: cd server && npm install');
  process.exit(1);
}

console.log('✅ Server dependencies found');

// Start the server with correct working directory
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: serverDir  // Set working directory to server folder
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🔄 Server process exited with code ${code}`);
  process.exit(code);
});
