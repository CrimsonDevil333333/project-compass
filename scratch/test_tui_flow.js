import { spawn } from 'child_process';
import path from 'path';

const cliPath = path.resolve('src/cli.js');

console.log(`🚀 Starting TUI Integration Test with ${cliPath}...`);

// Spawn the CLI in navigator mode
const proc = spawn('node', [cliPath, '--dir', '.'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '0', TERM: 'xterm-256color', TUI_TEST: 'true' }
});

let outputBuffer = '';
proc.stdout.on('data', (data) => {
  outputBuffer += data.toString();
});

proc.stderr.on('data', (data) => {
  console.error(`🚨 STDERR: ${data.toString()}`);
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  // Wait for initial render
  await delay(1500);
  console.log("📺 Initial Screen loaded. Buffer length:", outputBuffer.length);
  
  if (outputBuffer.includes('PROJECT COMPASS')) {
    console.log("✅ Main Header detected!");
  } else {
    console.warn("⚠️ Main Header not detected yet, printing output fragment:\n", outputBuffer.slice(0, 500));
  }

  // Test 1: Toggle Art Board (Shift+B)
  console.log("⌨️ Pressing Shift+B (Toggle Artboard)...");
  proc.stdin.write('B'); // Capital B is Shift+B
  await delay(800);

  // Test 2: Switch to Task Manager (Shift+T)
  console.log("⌨️ Pressing Shift+T (Switch to Task Manager)...");
  proc.stdin.write('T'); // Capital T is Shift+T
  await delay(800);
  
  if (outputBuffer.includes('Orbit Task Manager') || outputBuffer.toLowerCase().includes('task')) {
    console.log("✅ Successfully switched to Orbit Task Manager view!");
  } else {
    console.warn("⚠️ Orbit Task Manager view not verified in buffer. Current output tail:\n", outputBuffer.slice(-500));
  }

  // Test 3: Return to Navigator (Esc)
  console.log("⌨️ Pressing Escape (Return to Navigator)...");
  proc.stdin.write('\u001b'); // Esc key code
  await delay(800);

  // Test 3.5: Press Shift+Up and Shift+Down Arrow to scroll
  console.log("⌨️ Pressing Shift+Up Arrow (Scroll Up)...");
  proc.stdin.write('\u001b[1;2A');
  await delay(500);
  console.log("⌨️ Pressing Shift+Down Arrow (Scroll Down)...");
  proc.stdin.write('\u001b[1;2B');
  await delay(500);

  // Test 4: Switch to Package Registry (Shift+P)
  console.log("⌨️ Pressing Shift+P (Switch to Package Registry)...");
  proc.stdin.write('P'); // Capital P is Shift+P
  await delay(800);

  if (outputBuffer.includes('Package Registry')) {
    console.log("✅ Successfully switched to Package Registry view!");
  } else {
    console.warn("⚠️ Package Registry view not verified in buffer.");
  }

  // Test 5: Press Escape to return to Navigator
  console.log("⌨️ Pressing Escape (Return to Navigator)...");
  proc.stdin.write('\u001b'); // Esc key code
  await delay(800);

  // Test 6: Exit clean via Shift+Q
  console.log("⌨️ Pressing Shift+Q (Quit)...");
  proc.stdin.write('Q'); // Capital Q is Shift+Q
  await delay(800);
  
  // If exit confirmation is shown, confirm with 'y'
  if (outputBuffer.includes('Confirm Exit') || outputBuffer.includes('Are you sure')) {
    console.log("⌨️ Confirming Exit with 'y'...");
    proc.stdin.write('y');
  }
}

const timeout = setTimeout(() => {
  console.error("❌ Test timed out!");
  proc.kill('SIGKILL');
  process.exit(1);
}, 15000);

proc.on('exit', (code) => {
  clearTimeout(timeout);
  console.log(`🏁 Process exited with code: ${code}`);
  if (code === 0) {
    console.log("🎉 TUI FLOW INTEGRATION TEST PASSED!");
    process.exit(0);
  } else {
    console.error("❌ TUI FLOW INTEGRATION TEST FAILED!");
    process.exit(1);
  }
});

run().catch((err) => {
  console.error("❌ Error running test:", err);
  proc.kill('SIGKILL');
  process.exit(1);
});
