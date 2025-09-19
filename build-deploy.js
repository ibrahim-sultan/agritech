const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Clean dist directory
if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

console.log('Building React dashboard...');
// Build the React app
execSync('cd client && npm install && npm run build', { stdio: 'inherit' });

console.log('Copying files...');

// Copy landing page files to dist root
const landingFiles = fs.readdirSync('landing-page');
landingFiles.forEach(file => {
    const sourcePath = path.join('landing-page', file);
    const destPath = path.join('dist', file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
        fs.cpSync(sourcePath, destPath, { recursive: true });
    } else {
        fs.copyFileSync(sourcePath, destPath);
    }
});

// Create dashboard directory and copy React build files
const dashboardDir = path.join('dist', 'dashboard');
fs.mkdirSync(dashboardDir);

const clientBuildFiles = fs.readdirSync('client/build');
clientBuildFiles.forEach(file => {
    const sourcePath = path.join('client/build', file);
    const destPath = path.join(dashboardDir, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
        fs.cpSync(sourcePath, destPath, { recursive: true });
    } else {
        fs.copyFileSync(sourcePath, destPath);
    }
});

console.log('Build complete! Structure:');
console.log('dist/');
console.log('  ├── index.html (landing page)');
console.log('  ├── styles.css');
console.log('  ├── script.js');
console.log('  └── dashboard/');
console.log('      ├── index.html (React app)');
console.log('      ├── static/');
console.log('      └── ...');