import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

function parseComposerJson(content) {
  try {
    const pkg = JSON.parse(content);
    return {
      name: pkg.name || '',
      description: pkg.description || '',
      dependencies: [
        ...Object.keys(pkg.require || {}),
        ...Object.keys(pkg['require-dev'] || {})
      ],
      scripts: pkg.scripts || {}
    };
  } catch {
    return { name: '', description: '', dependencies: [], scripts: {} };
  }
}

function detectPhpFrameworks(deps) {
  const frameworks = [];
  const depStr = deps.join(' ').toLowerCase();
  
  if (depStr.includes('laravel/framework')) frameworks.push({ name: 'Laravel', icon: '🧡' });
  if (depStr.includes('symfony/symfony') || depStr.includes('symfony/framework-bundle')) frameworks.push({ name: 'Symfony', icon: '🎵' });
  if (depStr.includes('codeigniter4/framework')) frameworks.push({ name: 'CodeIgniter', icon: '🔥' });
  if (depStr.includes('cakephp/cakephp')) frameworks.push({ name: 'CakePHP', icon: '🍰' });
  if (depStr.includes('slim/slim')) frameworks.push({ name: 'Slim', icon: '🍃' });
  if (depStr.includes('lumen')) frameworks.push({ name: 'Lumen', icon: '💡' });
  if (depStr.includes('phpunit/phpunit')) frameworks.push({ name: 'PHPUnit', icon: '✅' });
  if (depStr.includes('laravel/octane')) frameworks.push({ name: 'Laravel Octane', icon: '🚀' });
  return frameworks;
}

export default {
  type: 'php',
  label: 'PHP',
  icon: '🐘',
  priority: 65,
  files: ['composer.json'],
  binaries: ['php', 'composer'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    let metadata = { name: '', description: '', dependencies: [], scripts: {} };
    let frameworks = [];
    
    const composerPath = path.join(projectPath, 'composer.json');
    if (fs.existsSync(composerPath)) {
      const content = fs.readFileSync(composerPath, 'utf-8');
      metadata = parseComposerJson(content);
      frameworks = detectPhpFrameworks(metadata.dependencies);
    }
    
    const commands = {
      install: { label: 'Composer install', command: ['composer', 'install'], source: 'builtin' },
      update: { label: 'Composer update all', command: ['composer', 'update'], source: 'builtin' }
    };
    
    if (hasProjectFile(projectPath, 'artisan')) {
      commands.run = { label: 'Artisan serve', command: ['php', 'artisan', 'serve'], source: 'builtin' };
      commands.test = { label: 'Artisan test', command: ['php', 'artisan', 'test'], source: 'builtin' };
      commands.migrate = { label: 'Artisan migrate', command: ['php', 'artisan', 'migrate'], source: 'builtin' };
    }
    
    if (hasProjectFile(projectPath, 'bin/phpunit') || metadata.dependencies.includes('phpunit/phpunit')) {
      commands.test = { label: 'PHPUnit', command: ['php', 'bin/phpunit'], source: 'builtin' };
    }
    
    if (hasProjectFile(projectPath, 'symfony.lock')) {
      commands.run = { label: 'Symfony server', command: ['symfony', 'server:start'], source: 'builtin' };
      commands.test = { label: 'Symfony test', command: ['php', 'bin/phpunit'], source: 'builtin' };
    }

    const setupHints = [];
    if (missingBinaries.includes('composer')) {
      setupHints.push('Install Composer: https://getcomposer.org/');
    }
    if (metadata.dependencies.length > 0) {
      setupHints.push('Run composer install to fetch dependencies');
    }

    return {
      id: `${projectPath}::php`,
      path: projectPath,
      name: metadata.name || path.basename(projectPath),
      type: 'PHP',
      icon: '🐘',
      priority: this.priority,
      commands,
      metadata: {
        ...metadata,
        packageManager: 'composer'
      },
      manifest: path.basename(manifest),
      description: metadata.description || frameworks.map(f => f.name).join(', '),
      missingBinaries,
      frameworks,
      extra: {
        setupHints,
        scripts: Object.keys(metadata.scripts)
      }
    };
  }
};