#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Get the directory of this script
const rootDir = __dirname;
const serverPath = path.join(rootDir, 'server', 'server.js');

console.log('🚀 Starting AgriTech Dashboard...');
console.log('📁 Root directory:', rootDir);
console.log('🔍 Server path:', serverPath);

// Check if server file exists
const fs = require('fs');
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server file not found at:', serverPath);
  console.log('📂 Available files:');
  try {
    const files = fs.readdirSync(rootDir);
    files.forEach(file => {
      const filePath = path.join(rootDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${file}`);
    });
  } catch (err) {
    console.error('Error reading directory:', err.message);
  }
  process.exit(1);
}

// Start the server
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: rootDir
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🔄 Server process exited with code ${code}`);
  process.exit(code);
});
