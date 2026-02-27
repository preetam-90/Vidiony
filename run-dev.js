/**
 * Futuristic Next.js development server starter
 * Colorful, animated CLI while preserving original behavior
 */

const { execSync, spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const cleanMode = process.argv.includes('clean');
const isWindows = os.platform() === 'win32';

// ANSI color helpers
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  fg: {
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
  }
};

function color(text, code) {
  return `${code}${text}${ANSI.reset}`;
}

// Spinner animation utility
function spinner(message) {
  const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${color(frames[i % frames.length], ANSI.fg.cyan)} ${color(message, ANSI.fg.magenta)}   `);
    i++;
  }, 80);
  return () => {
    clearInterval(id);
    process.stdout.write('\r');
  };
}

// Fancy header (explicit project name)
function header() {
  console.log('\n');
  const art = [
    "__   __  ___   ___  _   _  ____  _   _",
    "\\ \ / / / _ \\ / _ \\| \\ | |/ __ \\| \\ | |",
    " \\ V / | | | | | | |  \\| | |  | |  \\| |",
    "  | |  | | | | | | | . ` | |  | | . ` |",
    "  | |  | |_| | |_| | |\\  | |__| | |\\  |",
    "  |_|   \\___/ \\___/|_| \\_|\\____/|_| \\_|"
  ];

  const colors = [ANSI.fg.magenta, ANSI.fg.cyan, ANSI.fg.blue, ANSI.fg.yellow, ANSI.fg.green, ANSI.fg.magenta];
  art.forEach((ln, idx) => console.log(color(ANSI.bold + ln, colors[idx % colors.length])));
  const subtitle = color(' — Dev Runner', ANSI.fg.cyan);
  const port = color('Port 3000', ANSI.fg.yellow);
  console.log('\n' + subtitle + '   ' + port + '\n');
  console.log(color('Initializing — please wait...', ANSI.fg.magenta));
}

header();

try {
  // Check and kill processes with animated spinner
  if (isWindows) {
    const stop = spinner('Checking Windows ports...');
    try {
      const output = execSync('netstat -ano | findstr ":3000"', { encoding: 'utf8' });
      stop();
      if (output) {
        console.log(color('🔴 Port 3000 is in use — attempting graceful shutdown', ANSI.fg.red));
        const pids = output.split('\n')
          .filter(line => line.includes(':3000'))
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return parts[parts.length - 1];
          })
          .filter(Boolean);

        pids.forEach(pid => {
          console.log(color(`🔪 Killing process ${pid}`, ANSI.fg.yellow));
          try { execSync(`taskkill /F /PID ${pid}`); } catch (err) { console.log(color(`⚠️  Could not kill ${pid}: ${err.message}`, ANSI.fg.red)); }
        });
        console.log(color('⏳ Waiting for ports to be released...', ANSI.fg.cyan));
        execSync('timeout /t 2 /nobreak');
      } else {
        console.log(color('✅ No server found on port 3000', ANSI.fg.green));
      }
    } catch (err) {
      stop();
      console.log(color('✅ No existing server found on port 3000', ANSI.fg.green));
    }

    if (cleanMode) {
      console.log(color('🧹 Clean mode: Terminating all Node.js processes...', ANSI.fg.magenta));
      try { execSync('taskkill /F /IM node.exe', { stdio: 'ignore' }); console.log(color('✅ All Node.js processes terminated', ANSI.fg.green)); }
      catch (err) { console.log(color('ℹ️  No Node.js processes were running', ANSI.fg.yellow)); }
    }

  } else {
    const stop = spinner('Scanning UNIX ports...');
    try {
      const output = execSync("ss -tulpn | grep ':3000'", { encoding: 'utf8' });
      stop();
      if (output) {
        console.log(color('🔴 Port 3000 is in use — attempting graceful shutdown', ANSI.fg.red));
        const regex = /pid=(\d+)/g;
        let match; const pids = [];
        while ((match = regex.exec(output)) !== null) pids.push(match[1]);

        pids.forEach(pid => {
          console.log(color(`🔪 Killing process ${pid}`, ANSI.fg.yellow));
          try { execSync(`kill -9 ${pid}`); } catch (err) { console.log(color(`⚠️  Could not kill ${pid}: ${err.message}`, ANSI.fg.red)); }
        });
        console.log(color('⏳ Waiting for ports to be released...', ANSI.fg.cyan));
        execSync('sleep 2');
      } else {
        console.log(color('✅ No server found on port 3000', ANSI.fg.green));
      }
    } catch (err) {
      stop();
      console.log(color('✅ No existing server found on port 3000', ANSI.fg.green));
    }

    if (cleanMode) {
      console.log(color('🧹 Clean mode: Terminating all Next.js processes...', ANSI.fg.magenta));
      try { execSync('pkill -f "next"', { stdio: 'ignore' }); console.log(color('✅ All Next.js processes terminated', ANSI.fg.green)); }
      catch (err) { console.log(color('ℹ️  No Next.js processes were running', ANSI.fg.yellow)); }
    }
  }

  // Verify port free — stylized
  console.log(color('🔍 Verifying port 3000 — one moment...', ANSI.fg.cyan));
  const checkPortCommand = isWindows ? 'netstat -ano | findstr ":3000"' : "ss -tulpn | grep ':3000'";
  try {
    execSync(checkPortCommand);
    console.log(color('❌ Port 3000 is still in use! Please check manually and try again.', ANSI.fg.red));
    process.exit(1);
  } catch (err) {
    console.log(color('🟢 Port 3000 is free — ready', ANSI.fg.green));
  }

  // Display Next.js info box (version, URLs, env)
  function getNetworkIP() {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
    return null;
  }

  function showNextInfo() {
    let nextVersion = 'unknown';
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
      nextVersion = (pkg.dependencies && pkg.dependencies.next) || (pkg.devDependencies && pkg.devDependencies.next) || nextVersion;
    } catch (e) {}

    const netIP = getNetworkIP();
    const local = color('Local:   ', ANSI.fg.cyan) + color('http://localhost:3000', ANSI.fg.yellow);
    const network = color('Network: ', ANSI.fg.cyan) + color(netIP ? `http://${netIP}:3000` : 'n/a', ANSI.fg.yellow);
    const envInfo = color('Environments:', ANSI.fg.cyan) + ' ' + (fs.existsSync(path.join(__dirname, '.env')) ? color('.env', ANSI.fg.green) : color('none', ANSI.fg.red));

    console.log('');
    console.log(color('┌─────────────────────────────── Next.js ───────────────────────────────┐', ANSI.fg.magenta));
    console.log(color(`│  ▲ Next.js ${nextVersion}`.padEnd(69) + '│', ANSI.fg.cyan));
    console.log(color(`│  ${local.padEnd(67) }│`, ANSI.fg.cyan));
    console.log(color(`│  ${network.padEnd(67)}│`, ANSI.fg.cyan));
    console.log(color(`│  ${envInfo.padEnd(67)}│`, ANSI.fg.cyan));
    console.log(color('└──────────────────────────────────────────────────────────────────────┘', ANSI.fg.magenta));
    console.log('');
  }

  showNextInfo();

  // Launch Next.js and capture output to render a unified UI
  console.log(color('🚀 Launching Next.js development server...', ANSI.fg.cyan));
  const nextBin = require.resolve('next/dist/bin/next');
  const preload = path.join(__dirname, 'scripts', 'node-webstorage-polyfill.cjs');
  const nextProcess = spawn(process.execPath, ['-r', preload, nextBin, 'dev', '-p', '3000'], { stdio: ['ignore', 'pipe', 'pipe'] });

  // Track parsed info
  const parsed = {
    version: null,
    local: null,
    network: null,
    envs: null,
    starting: false,
    ready: false,
    readyTime: null
  };
  let redrawTimer;
  let lastRender = '';

  function redrawInfo() {
    // Small inline summary to avoid spam
    const ver = parsed.version ? `Next.js ${parsed.version}` : 'Next.js';
    const local = parsed.local || 'http://localhost:3000';
    const net = parsed.network || 'n/a';
    const envs = parsed.envs || 'none';

    const lines = [];
    lines.push('');
    lines.push(color('┌─────────────────────────────── Server ───────────────────────────────┐', ANSI.fg.magenta));
    lines.push(color(`│  ▲ ${ver}`.padEnd(69) + '│', ANSI.fg.cyan));
    lines.push(color(`│  Local:   ${local}`.padEnd(67) + '│', ANSI.fg.cyan));
    lines.push(color(`│  Network: ${net}`.padEnd(67) + '│', ANSI.fg.cyan));
    lines.push(color(`│  Environments: ${envs}`.padEnd(60) + '│', ANSI.fg.cyan));
    lines.push(color('└──────────────────────────────────────────────────────────────────────┘', ANSI.fg.magenta));
    if (parsed.ready) {
      lines.push(color(`\n✓ Ready${parsed.readyTime ? ` in ${parsed.readyTime}` : ''} — serving on ${local}\n`, ANSI.fg.green));
    } else if (parsed.starting) {
      lines.push(color('… Starting Next.js — compiling and preparing routes', ANSI.fg.yellow));
    } else {
      lines.push(color('… Waiting for Next.js output...', ANSI.fg.yellow));
    }

    const out = lines.join('\n');
    if (out === lastRender) return; // nothing changed, skip printing
    lastRender = out;
    console.log(out);
  }

  // parse output lines for key info
  function handleLine(line) {
    line = line.trim();
    if (!line) return;

    const vMatch = line.match(/Next\.js\s*([0-9]+\.[0-9]+\.[0-9]+)/i);
    if (vMatch) parsed.version = vMatch[1];

    const localMatch = line.match(/Local:\s*(https?:\/\/[^\s]+)/i);
    if (localMatch) parsed.local = localMatch[1];

    const netMatch = line.match(/Network:\s*(https?:\/\/[^\s]+)/i);
    if (netMatch) parsed.network = netMatch[1];

    const envMatch = line.match(/Environments?:\s*(.+)/i);
    if (envMatch) parsed.envs = envMatch[1].trim();

    if (/Starting|starting/i.test(line)) parsed.starting = true;

    const readyMatch = line.match(/Ready in\s*([0-9\.]+s)/i);
    if (readyMatch) {
      parsed.ready = true;
      parsed.readyTime = readyMatch[1];
    }

    // debounce redraws so rapid multi-line output doesn't spam the UI
    if (typeof redrawTimer !== 'undefined' && redrawTimer) clearTimeout(redrawTimer);
    redrawTimer = setTimeout(redrawInfo, 120);
  }

  // consume stdout
  nextProcess.stdout.on('data', (buf) => {
    const text = buf.toString('utf8');
    text.split(/\r?\n/).forEach(handleLine);
  });

  // consume stderr as well
  nextProcess.stderr.on('data', (buf) => {
    const text = buf.toString('utf8');
    text.split(/\r?\n/).forEach(line => {
      if (!line.trim()) return;
      // forward important errors
      if (/ERR!|Error|failed|warning/i.test(line)) console.error(color(line, ANSI.fg.red));
      handleLine(line);
    });
  });

  nextProcess.on('close', (code) => {
    if (!parsed.ready) console.log(color(`✖ Next.js server exited with code ${code}`, ANSI.fg.red));
    else console.log(color(`✖ Next.js stopped (code ${code})`, ANSI.fg.yellow));
  });

  process.on('SIGINT', () => { nextProcess.kill('SIGINT'); });

} catch (err) {
  console.error(color('❌ Error starting development server:', ANSI.fg.red), err);
  process.exit(1);
}

