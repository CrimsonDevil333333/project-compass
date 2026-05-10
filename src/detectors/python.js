import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

const PYTHON_ENTRY_FILES = [
  'main.py', 'app.py', 'src/main.py', 'src/app.py',
  'manage.py', 'wsgi.py', 'asgi.py', 'api.py', 'run.py'
];

function findPythonEntry(projectPath) {
  return PYTHON_ENTRY_FILES.find((file) => hasProjectFile(projectPath, file)) || null;
}

function getPythonPackageManager(projectPath) {
  if (hasProjectFile(projectPath, 'uv.lock') || hasProjectFile(projectPath, 'pyproject.toml')) {
    if (checkBinary('uv')) return 'uv';
  }
  if (hasProjectFile(projectPath, 'Pipfile.lock')) return 'pipenv';
  if (hasProjectFile(projectPath, 'poetry.lock')) return 'poetry';
  if (hasProjectFile(projectPath, 'requirements.txt')) return 'pip';
  return 'pip';
}

function gatherPythonDependencies(projectPath) {
  const deps = new Set();
  
  // Only read requirements.txt
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    const raw = fs.readFileSync(reqPath, 'utf-8');
    raw.split(/\r?\n/).forEach((line) => {
      const clean = line.trim().split('#')[0].trim();
      if (!clean || clean.startsWith('-') || clean.startsWith('"') || clean.startsWith("'")) return;
      const match = clean.match(/^([a-zA-Z0-9_.-]+)/);
      if (match) deps.add(match[1].toLowerCase());
    });
  }
  
  // Only read requirements-dev.txt
  const reqDevPath = path.join(projectPath, 'requirements-dev.txt');
  if (fs.existsSync(reqDevPath)) {
    const raw = fs.readFileSync(reqDevPath, 'utf-8');
    raw.split(/\r?\n/).forEach((line) => {
      const clean = line.trim().split('#')[0].trim();
      if (!clean || clean.startsWith('-') || clean.startsWith('"') || clean.startsWith("'")) return;
      const match = clean.match(/^([a-zA-Z0-9_.-]+)/);
      if (match) deps.add(match[1].toLowerCase());
    });
  }
  
  // Only read pyproject.toml dependencies section
  const pyproject = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyproject)) {
    const content = fs.readFileSync(pyproject, 'utf-8');
    const depSection = content.match(/(?:dependencies|requires)\s*=\s*\[([^\]]+)\]/g);
    if (depSection) {
      depSection.forEach((section) => {
        const matches = section.match(/["']([^"']+)/g);
        if (matches) {
          matches.forEach((m) => {
            const dep = m.replace(/["']/g, '').split(/[>=<=~!]/)[0].trim();
            if (dep) deps.add(dep.toLowerCase());
          });
        }
      });
    }
  }
  
  // Only read Pipfile
  const pipfile = path.join(projectPath, 'Pipfile');
  if (fs.existsSync(pipfile)) {
    const content = fs.readFileSync(pipfile, 'utf-8');
    const matches = content.match(/["']([^"']+)/g);
    if (matches) {
      matches.forEach((m) => {
        const dep = m.replace(/["']/g, '').split(/[>=<=~!]/)[0].trim();
        if (dep) deps.add(dep.toLowerCase());
      });
    }
  }
  
  return Array.from(deps);
}

function detectPythonFramework(deps) {
  const frameworks = [];
  
  const hasDep = (pattern) => {
    return deps.some((dep) => {
      const depLower = dep.toLowerCase();
      return depLower === pattern.toLowerCase() ||
             depLower.startsWith(pattern.toLowerCase() + '==') ||
             depLower.startsWith(pattern.toLowerCase() + '>=') ||
             depLower.startsWith(pattern.toLowerCase() + '<=') ||
             depLower.startsWith(pattern.toLowerCase() + '~=');
    });
  };
  
  if (hasDep('fastapi')) frameworks.push({ name: 'FastAPI', icon: '⚡' });
  if (hasDep('flask')) frameworks.push({ name: 'Flask', icon: '🌶️' });
  if (hasDep('django')) frameworks.push({ name: 'Django', icon: '🌿' });
  if (hasDep('tornado')) frameworks.push({ name: 'Tornado', icon: '🌪️' });
  if (hasDep('aiohttp')) frameworks.push({ name: 'AioHTTP', icon: '🔄' });
  if (hasDep('sanic')) frameworks.push({ name: 'Sanic', icon: '🚀' });
  if (hasDep('pyramid')) frameworks.push({ name: 'Pyramid', icon: '🔺' });
  if (hasDep('falcon')) frameworks.push({ name: 'Falcon', icon: '🦅' });
  if (hasDep('starlette')) frameworks.push({ name: 'Starlette', icon: '⭐' });
  if (hasDep('pandas')) frameworks.push({ name: 'Pandas', icon: '🐼' });
  if (hasDep('numpy')) frameworks.push({ name: 'NumPy', icon: '🔢' });
  if (hasDep('scipy')) frameworks.push({ name: 'SciPy', icon: '🔬' });
  if (hasDep('torch') || hasDep('pytorch')) frameworks.push({ name: 'PyTorch', icon: '🔥' });
  if (hasDep('tensorflow')) frameworks.push({ name: 'TensorFlow', icon: '🧠' });
  if (hasDep('sqlalchemy')) frameworks.push({ name: 'SQLAlchemy', icon: '🗄️' });
  if (hasDep('pytest')) frameworks.push({ name: 'Pytest', icon: '✅' });
  if (hasDep('celery')) frameworks.push({ name: 'Celery', icon: '🥬' });
  
  return frameworks;
}

export default {
  type: 'python',
  label: 'Python',
  icon: '🐍',
  priority: 95,
  files: ['pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile', 'manage.py'],
  binaries: ['python3', 'python', 'uv'].filter(Boolean),
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    const pkgManager = getPythonPackageManager(projectPath);
    const isUV = pkgManager === 'uv';
    const isPoetry = pkgManager === 'poetry';
    const isPipenv = pkgManager === 'pipenv';
    
    const allDeps = gatherPythonDependencies(projectPath);
    const detectedFrameworks = detectPythonFramework(allDeps);
    
    const commands = {};
    if (isUV) {
      commands.install = { label: 'UV Sync', command: ['uv', 'sync'], source: 'builtin' };
      commands.add = { label: 'UV Add', command: ['uv', 'add'], source: 'builtin' };
      commands.run = { label: 'UV Run', command: ['uv', 'run', 'python'], source: 'builtin' };
    } else if (isPoetry) {
      commands.install = { label: 'Poetry Install', command: ['poetry', 'install'], source: 'builtin' };
      commands.add = { label: 'Poetry Add', command: ['poetry', 'add'], source: 'builtin' };
      commands.run = { label: 'Poetry Run', command: ['poetry', 'run', 'python'], source: 'builtin' };
    } else if (isPipenv) {
      commands.install = { label: 'Pipenv Install', command: ['pipenv', 'install'], source: 'builtin' };
      commands.run = { label: 'Pipenv Run', command: ['pipenv', 'run', 'python'], source: 'builtin' };
    } else {
      commands.install = { label: 'Pip Install', command: ['pip', 'install', '-r', 'requirements.txt'], source: 'builtin' };
    }

    if (hasProjectFile(projectPath, 'pyproject.toml') || hasProjectFile(projectPath, 'setup.py')) {
      commands.test = { label: 'Pytest', command: [isUV ? 'uv' : 'python', ...(isUV ? ['run'] : []), 'pytest'], source: 'builtin' };
    } else {
      commands.test = { label: 'Unittest', command: ['python', '-m', 'unittest', 'discover'], source: 'builtin' };
    }

    const entry = findPythonEntry(projectPath);
    if (entry) {
      const runCmd = isUV ? ['uv', 'run', 'python', entry] :
                     isPoetry ? ['poetry', 'run', 'python', entry] :
                     isPipenv ? ['pipenv', 'run', 'python', entry] :
                     ['python', entry];
      commands.run = { label: 'Run', command: runCmd, source: 'builtin' };
    }

    if (hasProjectFile(projectPath, 'manage.py')) {
      const djangoCmd = isUV ? ['uv', 'run', 'python', 'manage.py'] :
                         ['python', 'manage.py'];
      commands['runserver'] = { label: 'Django Runserver', command: [...djangoCmd, 'runserver'], source: 'builtin' };
      commands['migrate'] = { label: 'Django Migrate', command: [...djangoCmd, 'migrate'], source: 'builtin' };
      commands['test'] = { label: 'Django Test', command: [...djangoCmd, 'test'], source: 'builtin' };
    }

    const metadata = {
      dependencies: allDeps,
      frameworks: detectedFrameworks,
      packageManager: pkgManager
    };

    const setupHints = [];
    if (isUV) setupHints.push('uv sync');
    else if (isPoetry) setupHints.push('poetry install');
    else if (isPipenv) setupHints.push('pipenv install');
    else if (hasProjectFile(projectPath, 'requirements.txt')) setupHints.push('pip install -r requirements.txt');

    return {
      id: `${projectPath}::python`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Python',
      icon: '🐍',
      priority: this.priority,
      commands,
      metadata,
      manifest: path.basename(manifest),
      description: detectedFrameworks.map(f => f.name).join(', '),
      missingBinaries,
      frameworks: detectedFrameworks,
      extra: {
        entry,
        setupHints,
        packageManager: pkgManager
      }
    };
  }
};
