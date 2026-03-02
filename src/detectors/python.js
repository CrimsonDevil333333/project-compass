import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

const PYTHON_ENTRY_FILES = ['main.py', 'app.py', 'src/main.py', 'src/app.py'];

function findPythonEntry(projectPath) {
  return PYTHON_ENTRY_FILES.find((file) => hasProjectFile(projectPath, file)) || null;
}

function gatherPythonDependencies(projectPath) {
  const set = new Set();
  const addFromFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
      return;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    raw.split(/\r?\n/).forEach((line) => {
      const clean = line.trim().split('#')[0].trim();
      if (clean) {
        const token = clean.split(/[>=<=~!]/)[0].trim().toLowerCase();
        if (token) {
          set.add(token);
        }
      }
    });
  };
  addFromFile(path.join(projectPath, 'requirements.txt'));
  addFromFile(path.join(projectPath, 'Pipfile'));
  const pyproject = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyproject)) {
    const content = fs.readFileSync(pyproject, 'utf-8').toLowerCase();
    const matches = content.match(/\b[a-z0-9-_/.]+\b/g);
    (matches || []).forEach((match) => {
      if (match) {
        set.add(match);
      }
    });
  }
  return Array.from(set);
}

export default {
  type: 'python',
  label: 'Python',
  icon: '🐍',
  priority: 95,
  files: ['pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile'],
  binaries: [process.platform === 'win32' ? 'python' : 'python3', 'pip'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    const commands = {};
    if (hasProjectFile(projectPath, 'requirements.txt')) {
      commands.install = { label: 'Pip Install', command: ['pip', 'install', '-r', 'requirements.txt'] };
    }
    if (hasProjectFile(projectPath, 'pyproject.toml')) {
      commands.test = { label: 'Pytest', command: ['pytest'] };
    } else {
      commands.test = { label: 'Unittest', command: ['python', '-m', 'unittest', 'discover'] };
    }

    const entry = findPythonEntry(projectPath);
    if (entry) {
      commands.run = { label: 'Run', command: ['python', entry] };
    }

    const metadata = {
      dependencies: gatherPythonDependencies(projectPath)
    };

    const setupHints = [];
    if (hasProjectFile(projectPath, 'requirements.txt')) {
      setupHints.push('pip install -r requirements.txt');
    }
    if (hasProjectFile(projectPath, 'Pipfile')) {
      setupHints.push('Use pipenv install --dev or poetry install');
    }

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
      description: '',
      missingBinaries,
      extra: {
        entry,
        setupHints
      }
    };
  }
};
