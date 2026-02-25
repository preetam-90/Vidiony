/**
 * Cross-platform Next.js development server starter
 * Automatically handles port 3000 conflicts and starts a new server
 */

const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Determine if we're running in clean mode (kill all Node processes)
const cleanMode = process.argv.includes('clean');

// Check if we're on Windows
const isWindows = os.platform() === 'win32';

console.log('🚀 Starting Next.js development server on port 3000');

try {
  // Handle existing processes based on OS
  if (isWindows) {
    console.log('📋 Checking for existing server on Windows...');
    
    try {
      // Find and kill processes using port 3000
      const output = execSync('netstat -ano | findstr ":3000"', { encoding: 'utf8' });
      
      if (output) {
        console.log('🔴 Port 3000 is already in use. Killing processes...');
        
        // Extract PIDs
        const pids = output.split('\n')
          .filter(line => line.includes(':3000'))
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return parts[parts.length - 1];
          })
          .filter(Boolean); // Filter out empty values
        
        // Kill each process
        pids.forEach(pid => {
          console.log(`🔪 Killing process ${pid}`);
          try {
            execSync(`taskkill /F /PID ${pid}`);
          } catch (err) {
            console.log(`⚠️  Could not kill process ${pid}: ${err.message}`);
          }
        });
        
        console.log('⏳ Waiting for ports to be released...');
        // Small delay to ensure ports are freed
        execSync('timeout /t 2 /nobreak');
      }
    } catch (err) {
      // If netstat doesn't find anything or another error occurs
      console.log('✅ No existing server found on port 3000');
    }
    
    // If in clean mode, kill all Node processes
    if (cleanMode) {
      console.log('🧹 Clean mode: Terminating all Node.js processes...');
      try {
        execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
        console.log('✅ All Node.js processes terminated');
      } catch (err) {
        console.log('ℹ️  No Node.js processes were running');
      }
    }
  } else {
    // Unix-like systems (Linux, macOS)
    console.log('📋 Checking for existing server on Unix-like system...');
    
    try {
      // On Linux/macOS, check for processes using port 3000
      const output = execSync("ss -tulpn | grep ':3000'", { encoding: 'utf8' });
      
      if (output) {
        console.log('🔴 Port 3000 is already in use. Killing processes...');
        
        // Extract PIDs - format varies, but we're looking for pid=NUMBER
        const regex = /pid=(\d+)/g;
        let match;
        const pids = [];
        
        while ((match = regex.exec(output)) !== null) {
          pids.push(match[1]);
        }
        
        // Kill each process
        pids.forEach(pid => {
          console.log(`🔪 Killing process ${pid}`);
          try {
            execSync(`kill -9 ${pid}`);
          } catch (err) {
            console.log(`⚠️  Could not kill process ${pid}: ${err.message}`);
          }
        });
        
        console.log('⏳ Waiting for ports to be released...');
        // Small delay to ensure ports are freed
        execSync('sleep 2');
      }
    } catch (err) {
      // If ss/grep doesn't find anything or another error occurs
      console.log('✅ No existing server found on port 3000');
    }
    
    // If in clean mode, kill all node processes by username
    if (cleanMode) {
      console.log('🧹 Clean mode: Terminating all Next.js processes...');
      try {
        execSync('pkill -f "next"', { stdio: 'ignore' });
        console.log('✅ All Next.js processes terminated');
      } catch (err) {
        console.log('ℹ️  No Next.js processes were running');
      }
    }
  }

  // Double-check port is free (cross-platform approach)
  console.log('🔍 Verifying port 3000 is free...');
  const checkPortCommand = isWindows
    ? 'netstat -ano | findstr ":3000"'
    : "ss -tulpn | grep ':3000'";
  
  try {
    execSync(checkPortCommand);
    console.log('❌ Port 3000 is still in use! Please check manually and try again.');
    process.exit(1);
  } catch (err) {
    // If command fails, that means nothing was found - port is free
    console.log('✅ Port 3000 is free and ready to use');
  }

  // Start Next.js development server
  console.log('🚀 Starting Next.js development server...');
  
  // Use spawn without a shell; preload a Node webstorage polyfill.
  // This avoids crashes on Node versions that expose an uninitialized global `localStorage`.
  const nextBin = require.resolve('next/dist/bin/next');
  const preload = path.join(__dirname, 'scripts', 'node-webstorage-polyfill.cjs');
  const nextProcess = spawn(process.execPath, ['-r', preload, nextBin, 'dev', '-p', '3000'], {
    stdio: 'inherit'
  });
  
  // Handle process exit
  nextProcess.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`);
  });
  
  // Forward SIGINT (Ctrl+C) to the child process
  process.on('SIGINT', () => {
    nextProcess.kill('SIGINT');
  });
  
} catch (err) {
  console.error('❌ Error starting development server:', err);
  process.exit(1);
} 
