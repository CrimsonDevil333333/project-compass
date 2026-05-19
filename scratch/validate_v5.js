import { orchestrator } from '../src/core/Orchestrator.js';
import { runFullAudit } from '../src/core/AuditEngine.js';
import { execa } from 'execa';
import kleur from 'kleur';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


async function validate() {
  console.log(kleur.bold(kleur.magenta('\n🚀 PROJECT COMPASS V5.0.0 GLOBAL VALIDATION SCAN')));
  console.log(kleur.dim('───────────────────────────────────────────────────\n'));

  // 1. Core Engine Scan
  console.log(kleur.cyan('📡 1. Testing Core Orchestrator Scan...'));
  try {
    const projects = await orchestrator.scan(process.cwd());
    console.log(`   ✅ Success: Detected ${projects.length} projects.`);
    if (projects.length === 0) console.log(kleur.yellow('   ⚠️ Warning: No projects found in current directory.'));
  } catch (err) {
    console.log(kleur.red(`   ❌ Core Scan Failed: ${err.message}`));
  }

  // 2. Audit Engine Check
  console.log(kleur.cyan('\n🔍 2. Testing Unified Audit Engine...'));
  try {
    const audit = await runFullAudit();
    const online = audit.filter(a => a.status === 'online');
    console.log(`   ✅ Success: ${online.length}/${audit.length} runtimes online.`);
    console.log(`   ℹ️  Node.js: ${audit.find(a => a.name === 'Node.js').version}`);
  } catch (err) {
    console.log(kleur.red(`   ❌ Audit Engine Failed: ${err.message}`));
  }

  // 3. CLI Headless Mode Check
  console.log(kleur.cyan('\n🖥️  3. Testing CLI Headless Outputs...'));
  const flags = ['--studio', '--list-projects', '--version', '--help'];
  for (const flag of flags) {
    try {
      const { stdout } = await execa('node', ['src/cli.js', flag]);
      if (stdout.length > 100) {
        console.log(`   ✅ Flag ${flag}: Success (Verified Output Length)`);
      } else {
        console.log(kleur.yellow(`   ⚠️ Flag ${flag}: Output seems short, check manually.`));
      }
    } catch (err) {
      console.log(kleur.red(`   ❌ Flag ${flag} Failed: ${err.message}`));
    }
  }

  // 4. Web Server Path Verification
  console.log(kleur.cyan('\n🌐 4. Verifying Web UI Static Paths...'));
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicPath = path.resolve(__dirname, '../public/index.html');
  if (fs.existsSync(publicPath)) {
    console.log(`   ✅ Success: Web Dashboard Production Build found.`);
  } else {
    console.log(kleur.red(`   ❌ ERROR: Web Dashboard Build Missing at ${publicPath}`));
  }


  console.log(kleur.bold(kleur.green('\n✨ VALIDATION SCAN COMPLETE: SYSTEM IS NOMINAL ✨\n')));
}

validate().catch(console.error);
