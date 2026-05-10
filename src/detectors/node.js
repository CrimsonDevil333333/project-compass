import fs from 'fs';
import path from 'path';
import { getPackageManager, checkBinary, hasProjectFile } from './utils.js';

function gatherNodeDependencies(pkg) {
  const deps = new Set();
  ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].forEach((key) => {
    if (pkg[key]) {
      Object.keys(pkg[key]).forEach((name) => deps.add(name));
    }
  });
  return Array.from(deps).map(dep => ({ name: dep, version: pkg.dependencies?.[dep] || pkg.devDependencies?.[dep] || 'latest' }));
}

function detectNodeProjectType(pkg) {
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const allDeps = { ...deps, ...devDeps };
  
  if (allDeps['next']) return { type: 'Next.js', icon: '🧭' };
  if (allDeps['react'] && (allDeps['react-scripts'] || allDeps['vite'])) return { type: 'React', icon: '⚛️' };
  if (allDeps['vue']) return { type: 'Vue.js', icon: '🟩' };
  if (allDeps['@nestjs/core']) return { type: 'NestJS', icon: '🛡️' };
  if (allDeps['express']) return { type: 'Express', icon: '🚂' };
  if (allDeps['fastify']) return { type: 'Fastify', icon: '⚡' };
  if (allDeps['koa']) return { type: 'Koa', icon: '🎋' };
  if (allDeps['@sveltejs/kit'] || allDeps['svelte']) return { type: 'Svelte', icon: '🧡' };
  if (allDeps['astro']) return { type: 'Astro', icon: '🚀' };
  if (allDeps['nuxt']) return { type: 'Nuxt', icon: '🟢' };
  if (allDeps['vite']) return { type: 'Vite', icon: '⚡' };
  if (allDeps['electron']) return { type: 'Electron', icon: '⚛️' };
  if (allDeps['typescript']) return { type: 'TypeScript', icon: '🔷' };
  return { type: 'Node.js', icon: '🟢' };
}

function findEntryPoint(projectPath, pkg) {
  const possibleEntries = [
    'src/index.js', 'src/index.ts', 'index.js', 'index.ts',
    'src/main.js', 'src/main.ts', 'main.js', 'main.ts',
    'app.js', 'app.ts', 'server.js', 'server.ts'
  ];
  
  for (const entry of possibleEntries) {
    if (hasProjectFile(projectPath, entry)) return entry;
  }
  
  if (pkg.main) return pkg.main;
  return null;
}

export default {
  type: 'node',
  label: 'Node.js',
  icon: '🟢',
  priority: 100,
  files: ['package.json'],
  binaries: ['node', 'npm'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    const pkgPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      return null;
    }
    const content = await fs.promises.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    const pm = getPackageManager(projectPath);
    const scripts = pkg.scripts || {};
    const projectType = detectNodeProjectType(pkg);
    const entryPoint = findEntryPoint(projectPath, pkg);
    
    const commands = {};
    const preferScript = (targetKey, names, labelText) => {
      for (const name of names) {
        if (Object.prototype.hasOwnProperty.call(scripts, name)) {
          commands[targetKey] = { label: labelText, command: [pm, 'run', name], source: 'builtin' };
          break;
        }
      }
    };
    
    commands.install = { label: `${pm} install`, command: [pm, 'install'], source: 'builtin' };
    preferScript('build', ['build', 'compile', 'dist'], 'Build');
    preferScript('test', ['test', 'check', 'spec'], 'Test');
    preferScript('dev', ['dev', 'start:dev'], 'Dev');
    preferScript('run', ['start', 'serve', 'run'], 'Start');
    
    if (entryPoint && !commands.run && !commands.dev) {
      commands.run = { label: 'Run', command: ['node', entryPoint], source: 'builtin' };
    }
    
    if (Object.prototype.hasOwnProperty.call(scripts, 'lint')) {
      commands.lint = { label: 'Lint', command: [pm, 'run', 'lint'], source: 'builtin' };
    }
    if (Object.prototype.hasOwnProperty.call(scripts, 'format')) {
      commands.format = { label: 'Format', command: [pm, 'run', 'format'], source: 'builtin' };
    }

    const metadata = {
      dependencies: gatherNodeDependencies(pkg),
      scripts,
      packageJson: pkg,
      packageManager: pm,
      projectType: projectType.type,
      entryPoint
    };

    const setupHints = [];
    if (metadata.dependencies.length) {
      setupHints.push(`Run ${pm} install to fetch dependencies.`);
      if (pm === 'npm' && hasProjectFile(projectPath, 'yarn.lock')) {
        setupHints.push('Or run yarn install if you prefer Yarn.');
      }
    }
    
    const workspaces = pkg.workspaces || [];
    if (workspaces.length > 0) {
      setupHints.push('This is a monorepo with workspaces: ' + workspaces.join(', '));
    }

    const detectedFrameworks = projectType.type !== 'Node.js' ? [{ name: projectType.type, icon: projectType.icon }] : [];

    return {
      id: `${projectPath}::node`,
      path: projectPath,
      name: pkg.name || path.basename(projectPath),
      type: 'Node.js',
      icon: projectType.icon,
      priority: this.priority,
      commands,
      metadata,
      manifest: path.basename(manifest),
      description: pkg.description || projectType.type,
      missingBinaries,
      frameworks: detectedFrameworks,
      extra: {
        scripts: Object.keys(scripts),
        setupHints,
        workspaces
      }
    };
  }
};
