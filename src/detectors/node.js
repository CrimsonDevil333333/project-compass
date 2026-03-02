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
  return Array.from(deps);
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
    const commands = {};
    const preferScript = (targetKey, names, labelText) => {
      for (const name of names) {
        if (Object.prototype.hasOwnProperty.call(scripts, name)) {
          commands[targetKey] = { label: labelText, command: [pm, 'run', name] };
          break;
        }
      }
    };
    commands.install = { label: 'Install', command: [pm, 'install'] };
    preferScript('build', ['build', 'compile', 'dist'], 'Build');
    preferScript('test', ['test', 'check', 'spec'], 'Test');
    preferScript('run', ['start', 'dev', 'serve', 'run'], 'Start');
    if (Object.prototype.hasOwnProperty.call(scripts, 'lint')) {
      commands.lint = { label: 'Lint', command: [pm, 'run', 'lint'] };
    }

    const metadata = {
      dependencies: gatherNodeDependencies(pkg),
      scripts,
      packageJson: pkg,
      packageManager: getPackageManager(projectPath)
    };

    const setupHints = [];
    if (metadata.dependencies.length) {
      setupHints.push('Run npm install to fetch dependencies.');
      if (hasProjectFile(projectPath, 'yarn.lock')) {
        setupHints.push('Or run yarn install if you prefer Yarn.');
      }
    }

    return {
      id: `${projectPath}::node`,
      path: projectPath,
      name: pkg.name || path.basename(projectPath),
      type: 'Node.js',
      icon: '🟢',
      priority: this.priority,
      commands,
      metadata,
      manifest: path.basename(manifest),
      description: pkg.description || '',
      missingBinaries,
      extra: {
        scripts: Object.keys(scripts),
        setupHints
      }
    };
  }
};
