const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting BalanceVault Development Environment...\n');

const backend = spawn('npm', ['--workspace=backend', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('npm', ['--workspace=frontend', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  backend.kill();
  frontend.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

