import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

function parseGoMod(content) {
  const metadata = {
    module: '',
    goVersion: '',
    dependencies: []
  };
  
  const lines = content.split('\n');
  let inRequire = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('module ')) {
      metadata.module = trimmed.split(/\s+/)[1]?.replace(/"/g, '') || '';
    }
    if (trimmed.startsWith('go ')) {
      metadata.goVersion = trimmed.split(/\s+/)[1] || '';
    }
    
    if (trimmed === 'require (') {
      inRequire = true;
      continue;
    }
    if (trimmed === ')') {
      inRequire = false;
      continue;
    }
    
    if (inRequire || (trimmed.includes(' ') && !trimmed.startsWith('//'))) {
      const parts = trimmed.split(/\s+/);
      if (parts[0] && !parts[0].startsWith('//')) {
        metadata.dependencies.push(parts[0].replace(/"/g, ''));
      }
    }
  }
  
  return metadata;
}

function detectGoFrameworks(deps) {
  const frameworks = [];
  const depStr = deps.join(' ').toLowerCase();
  
  if (depStr.includes('gin') || depStr.includes('gin-gonic')) frameworks.push({ name: 'Gin', icon: '🍸' });
  if (depStr.includes('echo') || depStr.includes('labstack/echo')) frameworks.push({ name: 'Echo', icon: '🔊' });
  if (depStr.includes('fiber') || depStr.includes('gofiber')) frameworks.push({ name: 'Fiber', icon: '🔥' });
  if (depStr.includes('chi')) frameworks.push({ name: 'Chi', icon: '🤝' });
  if (depStr.includes('gorilla')) frameworks.push({ name: 'Gorilla', icon: '🦍' });
  if (depStr.includes('iris')) frameworks.push({ name: 'Iris', icon: '🌺' });
  if (depStr.includes('beego')) frameworks.push({ name: 'Beego', icon: '🐝' });
  if (depStr.includes('revel')) frameworks.push({ name: 'Revel', icon: '🎉' });
  if (depStr.includes('gqlgen')) frameworks.push({ name: 'GQLGen', icon: '◼️' });
  if (depStr.includes('grpc')) frameworks.push({ name: 'gRPC', icon: '🔌' });
  
  return frameworks;
}

function findGoEntry(projectPath) {
  const possibleEntries = ['main.go', 'cmd/main.go', 'app.go', 'server.go'];
  for (const entry of possibleEntries) {
    if (hasProjectFile(projectPath, entry)) return entry;
  }
  return 'main.go';
}

export default {
  type: 'go',
  label: 'Go',
  icon: '🐹',
  priority: 85,
  files: ['go.mod'],
  binaries: ['go'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    let metadata = { module: '', goVersion: '', dependencies: [] };
    let frameworks = [];
    let entryPoint = 'main.go';
    
    const goModPath = path.join(projectPath, 'go.mod');
    if (fs.existsSync(goModPath)) {
      const content = fs.readFileSync(goModPath, 'utf-8');
      metadata = parseGoMod(content);
      frameworks = detectGoFrameworks(metadata.dependencies);
    }
    
    entryPoint = findGoEntry(projectPath);
    
    const commands = {
      install: { label: 'Go tidy', command: ['go', 'mod', 'tidy'], source: 'builtin' },
      build: { label: 'Go build', command: ['go', 'build', '-o', 'app', '.'], source: 'builtin' },
      test: { label: 'Go test', command: ['go', 'test', './...'], source: 'builtin' },
      run: { label: 'Go run', command: ['go', 'run', entryPoint], source: 'builtin' },
      fmt: { label: 'Go fmt', command: ['go', 'fmt', './...'], source: 'builtin' },
      vet: { label: 'Go vet', command: ['go', 'vet', './...'], source: 'builtin' }
    };

    const setupHints = [];
    if (missingBinaries.length > 0) {
      setupHints.push('Install Go from https://go.dev/dl/');
    }
    if (metadata.dependencies.length > 0) {
      setupHints.push('Run go mod tidy to ensure dependencies');
    }
    if (metadata.goVersion) {
      setupHints.push(`Requires Go ${metadata.goVersion}+`);
    }

    return {
      id: `${projectPath}::go`,
      path: projectPath,
      name: metadata.module || path.basename(projectPath),
      type: 'Go',
      icon: '🐹',
      priority: this.priority,
      commands,
      metadata: {
        ...metadata,
        packageManager: 'go',
        entryPoint
      },
      manifest: path.basename(manifest),
      description: frameworks.map(f => f.name).join(', ') || `Go ${metadata.goVersion || ''}`,
      missingBinaries,
      frameworks,
      extra: {
        setupHints,
        entryPoint
      }
    };
  }
};
