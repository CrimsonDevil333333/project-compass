import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

function parseCargoToml(content) {
  const metadata = {
    name: '',
    version: '',
    description: '',
    dependencies: [],
    binaries: []
  };
  
  const lines = content.split('\n');
  let inDependencies = false;
  let inBin = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('name') && !inDependencies && !inBin) {
      metadata.name = trimmed.split('=')[1]?.replace(/"/g, '').trim() || '';
    }
    if (trimmed.startsWith('version') && !inDependencies && !inBin) {
      metadata.version = trimmed.split('=')[1]?.replace(/"/g, '').trim() || '';
    }
    if (trimmed.startsWith('description') && !inDependencies && !inBin) {
      metadata.description = trimmed.split('=')[1]?.replace(/"/g, '').trim() || '';
    }
    
    if (trimmed === '[dependencies]') {
      inDependencies = true;
      inBin = false;
      continue;
    }
    if (trimmed.startsWith('[')) {
      inDependencies = false;
      inBin = trimmed === '[bin]';
      continue;
    }
    
    if (inDependencies && trimmed && !trimmed.startsWith('#')) {
      const depName = trimmed.split(/[={]/)[0]?.trim();
      if (depName && !depName.startsWith('#')) metadata.dependencies.push(depName);
    }
    
    if (inBin && trimmed.startsWith('name')) {
      const binName = trimmed.split('=')[1]?.replace(/"/g, '').trim();
      if (binName) metadata.binaries.push(binName);
    }
  }
  
  return metadata;
}

function detectRustFrameworks(deps) {
  const frameworks = [];
  const depStr = deps.join(' ').toLowerCase();
  
  if (depStr.includes('actix-web')) frameworks.push({ name: 'Actix Web', icon: '🎭' });
  if (depStr.includes('rocket')) frameworks.push({ name: 'Rocket', icon: '🚀' });
  if (depStr.includes('axum')) frameworks.push({ name: 'Axum', icon: '🗡️' });
  if (depStr.includes('warp')) frameworks.push({ name: 'Warp', icon: '🌀' });
  if (depStr.includes('tokio')) frameworks.push({ name: 'Tokio', icon: '⚡' });
  if (depStr.includes('serde')) frameworks.push({ name: 'Serde', icon: '🔄' });
  if (depStr.includes('sqlx')) frameworks.push({ name: 'SQLx', icon: '🗄️' });
  if (depStr.includes('diesel')) frameworks.push({ name: 'Diesel', icon: '🛢️' });
  if (depStr.includes('tonic')) frameworks.push({ name: 'Tonic', icon: '🎵' });
  if (depStr.includes('tower')) frameworks.push({ name: 'Tower', icon: '🏰' });
  
  return frameworks;
}

export default {
  type: 'rust',
  label: 'Rust',
  icon: '🦀',
  priority: 90,
  files: ['Cargo.toml'],
  binaries: ['cargo', 'rustc'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    const cargoPath = path.join(projectPath, 'Cargo.toml');
    let metadata = { name: '', version: '', description: '', dependencies: [], binaries: [] };
    let frameworks = [];
    
    if (fs.existsSync(cargoPath)) {
      const content = fs.readFileSync(cargoPath, 'utf-8');
      metadata = parseCargoToml(content);
      frameworks = detectRustFrameworks(metadata.dependencies);
    }
    
    const commands = {
      install: { label: 'Cargo fetch', command: ['cargo', 'fetch'], source: 'builtin' },
      build: { label: 'Cargo build', command: ['cargo', 'build'], source: 'builtin' },
      test: { label: 'Cargo test', command: ['cargo', 'test'], source: 'builtin' },
      run: { label: 'Cargo run', command: ['cargo', 'run'], source: 'builtin' },
      check: { label: 'Cargo check', command: ['cargo', 'check'], source: 'builtin' },
      doc: { label: 'Cargo doc', command: ['cargo', 'doc', '--open'], source: 'builtin' }
    };
    
    if (hasProjectFile(projectPath, 'Cargo.toml')) {
      commands.update = { label: 'Cargo update', command: ['cargo', 'update'], source: 'builtin' };
    }

    const setupHints = [];
    if (missingBinaries.length > 0) {
      setupHints.push('Install Rust: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh');
    }
    if (metadata.dependencies.length > 0) {
      setupHints.push('Run cargo fetch to download dependencies');
    }

    return {
      id: `${projectPath}::rust`,
      path: projectPath,
      name: metadata.name || path.basename(projectPath),
      type: 'Rust',
      icon: '🦀',
      priority: this.priority,
      commands,
      metadata: {
        ...metadata,
        packageManager: 'cargo'
      },
      manifest: path.basename(manifest),
      description: metadata.description || frameworks.map(f => f.name).join(', '),
      missingBinaries,
      frameworks,
      extra: {
        setupHints,
        binaries: metadata.binaries
      }
    };
  }
};
