import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

function parseGemfile(content) {
  const gems = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('gem ') || trimmed.startsWith('gem(')) {
      const match = trimmed.match(/gem\s+['"]([^'"]+)['"]/);
      if (match) gems.push(match[1]);
    }
  }
  
  return gems;
}

function detectRubyFrameworks(gems) {
  const frameworks = [];
  const gemStr = gems.join(' ').toLowerCase();
  
  if (gemStr.includes('rails')) frameworks.push({ name: 'Ruby on Rails', icon: '🛤️' });
  if (gemStr.includes('sinatra')) frameworks.push({ name: 'Sinatra', icon: '🎷' });
  if (gemStr.includes('padrino')) frameworks.push({ name: 'Padrino', icon: '🎩' });
  if (gemStr.includes('hanami') || gemStr.includes('lotus')) frameworks.push({ name: 'Hanami', icon: '🌸' });
  if (gemStr.includes('grape')) frameworks.push({ name: 'Grape', icon: '🍇' });
  if (gemStr.includes('roda')) frameworks.push({ name: 'Roda', icon: '🎣' });
  if (gemStr.includes('cuba')) frameworks.push({ name: 'Cuba', icon: '🎵' });
  if (gemStr.includes('rspec')) frameworks.push({ name: 'RSpec', icon: '✅' });
  if (gemStr.includes('minitest')) frameworks.push({ name: 'MiniTest', icon: '🔬' });
  if (gemStr.includes('sidekiq')) frameworks.push({ name: 'Sidekiq', icon: '🥬' });
  if (gemStr.includes('activerecord')) frameworks.push({ name: 'ActiveRecord', icon: '🗄️' });
  
  return frameworks;
}

export default {
  type: 'ruby',
  label: 'Ruby',
  icon: '💎',
  priority: 65,
  files: ['Gemfile', 'Gemfile.lock'],
  binaries: ['ruby', 'bundle'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    let gems = [];
    let frameworks = [];
    
    const gemfilePath = path.join(projectPath, 'Gemfile');
    if (fs.existsSync(gemfilePath)) {
      const content = fs.readFileSync(gemfilePath, 'utf-8');
      gems = parseGemfile(content);
      frameworks = detectRubyFrameworks(gems);
    }
    
    const commands = {
      install: { label: 'Bundle install', command: ['bundle', 'install'], source: 'builtin' },
      update: { label: 'Bundle update', command: ['bundle', 'update'], source: 'builtin' },
      console: { label: 'Ruby console', command: ['ruby', '-e', 'puts "IRB"'], source: 'builtin' }
    };
    
    if (hasProjectFile(projectPath, 'bin/rails')) {
      commands.run = { label: 'Rails server', command: ['bin/rails', 'server'], source: 'builtin' };
      commands.test = { label: 'Rails test', command: ['bin/rails', 'test'], source: 'builtin' };
      commands.migrate = { label: 'Rails migrate', command: ['bin/rails', 'db:migrate'], source: 'builtin' };
      commands.console = { label: 'Rails console', command: ['bin/rails', 'console'], source: 'builtin' };
    }
    
    if (hasProjectFile(projectPath, 'config.ru') && !hasProjectFile(projectPath, 'bin/rails')) {
      commands.run = { label: 'Rackup', command: ['rackup'], source: 'builtin' };
    }
    
    if (gems.includes('rspec')) {
      commands.test = { label: 'RSpec', command: ['bundle', 'exec', 'rspec'], source: 'builtin' };
    }

    const setupHints = [];
    if (missingBinaries.includes('bundle')) {
      setupHints.push('Install Bundler: gem install bundler');
    }
    if (gems.length > 0) {
      setupHints.push('Run bundle install to fetch dependencies');
    }
    if (hasProjectFile(projectPath, '.ruby-version')) {
      const version = fs.readFileSync(path.join(projectPath, '.ruby-version'), 'utf-8').trim();
      setupHints.push(`Requires Ruby ${version}`);
    }

    return {
      id: `${projectPath}::ruby`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Ruby',
      icon: '💎',
      priority: this.priority,
      commands,
      metadata: {
        dependencies: gems,
        packageManager: 'bundler'
      },
      manifest: path.basename(manifest),
      description: frameworks.map(f => f.name).join(', '),
      missingBinaries,
      frameworks,
      extra: {
        setupHints,
        gems
      }
    };
  }
};