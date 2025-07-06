// Production startup script for AsphaltTracker
// Starts both the main application and Restack services

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting AsphaltTracker in Production Mode...');

// Function to start a process
function startProcess(command, args, name, color = '\x1b[36m') {
  const process = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    cwd: __dirname
  });

  // Add colored output
  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${name}]\x1b[0m ${line}`);
    });
  });

  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`\x1b[31m[${name} ERROR]\x1b[0m ${line}`);
    });
  });

  process.on('close', (code) => {
    console.log(`\x1b[33m[${name}]\x1b[0m Process exited with code ${code}`);
    if (code !== 0) {
      console.log(`\x1b[31m❌ ${name} failed to start\x1b[0m`);
      // Don't exit immediately, let other processes continue
    }
  });

  return process;
}

// Check if dist/services.js exists
const servicesPath = path.join(__dirname, 'dist', 'services.js');

if (!fs.existsSync(servicesPath)) {
  console.log('📦 Building services first...');
  
  // Build services
  const buildProcess = spawn('npm', ['run', 'services:build'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Services built successfully');
      startServices();
    } else {
      console.log('❌ Failed to build services');
      process.exit(1);
    }
  });
} else {
  startServices();
}

function startServices() {
  console.log('🎯 Starting AsphaltTracker services...');

  // Start the main application
  console.log('🌐 Starting main application...');
  const appProcess = startProcess('npm', ['run', 'start'], 'APP', '\x1b[32m');

  // Wait a bit for the app to start, then start services
  setTimeout(() => {
    console.log('🤖 Starting Restack services...');
    const servicesProcess = startProcess('node', ['dist/services.js'], 'SERVICES', '\x1b[34m');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      appProcess.kill('SIGTERM');
      servicesProcess.kill('SIGTERM');
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down gracefully...');
      appProcess.kill('SIGTERM');
      servicesProcess.kill('SIGTERM');
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });

  }, 3000); // Wait 3 seconds for app to start

  console.log('✅ AsphaltTracker started successfully!');
  console.log('📊 Main App: http://localhost:5000');
  console.log('🤖 Restack Dashboard: http://localhost:5233');
  console.log('📡 WebSocket: ws://localhost:5001');
  console.log('\nPress Ctrl+C to stop all services');
}
