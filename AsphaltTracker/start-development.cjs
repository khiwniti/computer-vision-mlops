// Development startup script for AsphaltTracker
// Starts both the main application and Restack services in development mode

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AsphaltTracker in Development Mode...');

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
  });

  return process;
}

function startServices() {
  console.log('🎯 Starting AsphaltTracker development services...');

  // Start the main application in development mode
  console.log('🌐 Starting main application in development mode...');
  const appProcess = startProcess('npm', ['run', 'dev'], 'DEV-APP', '\x1b[32m');

  // Wait a bit for the app to start, then start services
  setTimeout(() => {
    console.log('🤖 Starting Restack services in development mode...');
    const servicesProcess = startProcess('npm', ['run', 'services'], 'DEV-SERVICES', '\x1b[34m');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development environment...');
      appProcess.kill('SIGTERM');
      servicesProcess.kill('SIGTERM');
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down development environment...');
      appProcess.kill('SIGTERM');
      servicesProcess.kill('SIGTERM');
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });

  }, 5000); // Wait 5 seconds for app to start in dev mode

  console.log('✅ AsphaltTracker development environment started!');
  console.log('📊 Main App: http://localhost:5000');
  console.log('🎨 Client Dev: http://localhost:5173');
  console.log('🤖 Restack Dashboard: http://localhost:5233');
  console.log('📡 WebSocket: ws://localhost:5001');
  console.log('\nPress Ctrl+C to stop all services');
  console.log('🔄 Hot reload is enabled for both app and services');
}

startServices();
