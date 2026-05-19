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
  
  // 1. requirements.txt & requirements-dev.txt
  ['requirements.txt', 'requirements-dev.txt'].forEach(file => {
    const fullPath = path.join(projectPath, file);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      raw.split(/\r?\n/).forEach((line) => {
        const clean = line.trim().split('#')[0].trim();
        if (!clean || clean.startsWith('-') || clean.startsWith('"') || clean.startsWith("'")) return;
        const match = clean.match(/^([a-zA-Z0-9_.-]+)/);
        if (match) deps.add(match[1].toLowerCase());
      });
    }
  });
  
  // 2. pyproject.toml
  const pyproject = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyproject)) {
    const content = fs.readFileSync(pyproject, 'utf-8');
    
    // Standard PEP 621 dependencies
    const standardDeps = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (standardDeps) {
      const matches = standardDeps[1].match(/["']([^"']+)/g);
      if (matches) matches.forEach(m => {
        const d = m.replace(/["']/g, '').split(/[>=<=~!\[]/)[0].trim();
        if (d) deps.add(d.toLowerCase());
      });
    }

    // Poetry dependencies
    const poetrySection = content.match(/\[tool\.poetry\.(?:group\..+\.)?dependencies\]([\s\S]*?)(?=\n\[|$)/g);
    if (poetrySection) {
      poetrySection.forEach(section => {
        const lines = section.split('\n').slice(1);
        lines.forEach(line => {
          const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=/);
          if (match && match[1] !== 'python') deps.add(match[1].toLowerCase());
        });
      });
    }
  }
  
  // 3. Pipfile
  const pipfile = path.join(projectPath, 'Pipfile');
  if (fs.existsSync(pipfile)) {
    const content = fs.readFileSync(pipfile, 'utf-8');
    const sections = content.match(/\[(?:packages|dev-packages)\]([\s\S]*?)(?=\n\[|$)/g);
    if (sections) {
      sections.forEach(section => {
        const lines = section.split('\n').slice(1);
        lines.forEach(line => {
          const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=/);
          if (match) deps.add(match[1].toLowerCase());
        });
      });
    }
  }
  
  return Array.from(deps);
}

function gatherPythonScripts(projectPath) {
  const scripts = {};
  const pyproject = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyproject)) {
    const content = fs.readFileSync(pyproject, 'utf-8');
    
    // Standard project.scripts
    const stdScripts = content.match(/\[project\.scripts\]([\s\S]*?)(?=\n\[|$)/);
    if (stdScripts) {
      stdScripts[1].split('\n').forEach(line => {
        const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=\s*["'](.+)["']/);
        if (match) scripts[match[1]] = match[2];
      });
    }

    // Poetry scripts
    const poetryScripts = content.match(/\[tool\.poetry\.scripts\]([\s\S]*?)(?=\n\[|$)/);
    if (poetryScripts) {
      poetryScripts[1].split('\n').forEach(line => {
        const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=\s*["'](.+)["']/);
        if (match) scripts[match[1]] = match[2];
      });
    }
  }
  return scripts;
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
  binaries: ['python3', 'python', 'uv'],
   async build(projectPath, manifest) {
     const hasPython3 = checkBinary('python3');
     const hasPython = checkBinary('python');
     const hasUv = checkBinary('uv');
     const hasRuntime = hasPython3 || hasPython || hasUv;
     const missingBinaries = [];
     if (!hasRuntime) {
       missingBinaries.push('python');
     }
     const pkgManager = getPythonPackageManager(projectPath);
    const isUV = pkgManager === 'uv';
    const isPoetry = pkgManager === 'poetry';
    const isPipenv = pkgManager === 'pipenv';
    
    const allDeps = gatherPythonDependencies(projectPath);
    const detectedFrameworks = detectPythonFramework(allDeps);
    const pythonScripts = gatherPythonScripts(projectPath);
    
    const commands = {};
    const pmPrefix = isUV ? ['uv', 'run'] : isPoetry ? ['poetry', 'run'] : isPipenv ? ['pipenv', 'run'] : [];
    
    // Add detected scripts to commands
    Object.entries(pythonScripts).forEach(([name, target]) => {
      commands[name] = { 
        label: `Py Script: ${name}`, 
        command: [...pmPrefix, ...(pmPrefix.length ? [] : ['python', '-c']), target],
        source: 'builtin'
      };
    });

    if (isUV) {
      commands.install = { label: 'UV Sync', command: ['uv', 'sync'], source: 'builtin' };
      commands.add = { label: 'UV Add', command: ['uv', 'add'], source: 'builtin' };
      if (!commands.run) commands.run = { label: 'UV Run', command: ['uv', 'run', 'python'], source: 'builtin' };
    } else if (isPoetry) {
      commands.install = { label: 'Poetry Install', command: ['poetry', 'install'], source: 'builtin' };
      commands.add = { label: 'Poetry Add', command: ['poetry', 'add'], source: 'builtin' };
      if (!commands.run) commands.run = { label: 'Poetry Run', command: ['poetry', 'run', 'python'], source: 'builtin' };
    } else if (isPipenv) {
      commands.install = { label: 'Pipenv Install', command: ['pipenv', 'install'], source: 'builtin' };
      if (!commands.run) commands.run = { label: 'Pipenv Run', command: ['pipenv', 'run', 'python'], source: 'builtin' };
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
      packageManager: pkgManager,
      scripts: pythonScripts
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
