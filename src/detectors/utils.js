import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function checkBinary(name) {
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function hasProjectFile(projectPath, file) {
  return fs.existsSync(path.join(projectPath, file));
}

export function hasProjectFilePattern(projectPath, pattern) {
  try {
    const files = fs.readdirSync(projectPath);
    return files.some(f => new RegExp(pattern).test(f));
  } catch {
    return false;
  }
}

export function getPackageManager(projectPath, language = 'node') {
  // Node.js package managers
  if (language === 'node' || language === 'Node.js') {
    if (hasProjectFile(projectPath, 'bun.lockb') || hasProjectFile(projectPath, 'bun.lock')) return 'bun';
    if (hasProjectFile(projectPath, 'pnpm-lock.yaml')) return 'pnpm';
    if (hasProjectFile(projectPath, 'yarn.lock')) return 'yarn';
    if (hasProjectFile(projectPath, 'package-lock.json')) return 'npm';
    return 'npm';
  }
  
  // Python package managers
  if (language === 'python' || language === 'Python') {
    if (hasProjectFile(projectPath, 'uv.lock') && checkBinary('uv')) return 'uv';
    if (hasProjectFile(projectPath, 'poetry.lock')) return 'poetry';
    if (hasProjectFile(projectPath, 'Pipfile.lock')) return 'pipenv';
    if (hasProjectFile(projectPath, 'requirements.txt')) return 'pip';
    return 'pip';
  }
  
  // Go - uses go modules
  if (language === 'go' || language === 'Go') {
    return 'go';
  }
  
  // Rust - uses cargo
  if (language === 'rust' || language === 'Rust') {
    return 'cargo';
  }
  
  // Java - maven or gradle
  if (language === 'java' || language === 'Java') {
    if (hasProjectFile(projectPath, 'pom.xml')) return 'maven';
    if (hasProjectFile(projectPath, 'build.gradle') || hasProjectFile(projectPath, 'build.gradle.kts')) return 'gradle';
    return 'maven';
  }
  
  // PHP - uses composer
  if (language === 'php' || language === 'PHP') {
    return 'composer';
  }
  
  // Ruby - uses bundler
  if (language === 'ruby' || language === 'Ruby') {
    return 'bundler';
  }
  
  // .NET - uses dotnet
  if (language === '.net' || language === '.NET') {
    return 'dotnet';
  }
  
  return 'npm';
}

export function resolveScriptCommand(project, scriptName, fallback = null) {
  const scripts = project.metadata?.scripts || {};
  const pm = project.metadata?.packageManager || getPackageManager(project.path, project.type);
  if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
    return [pm, 'run', scriptName];
  }
  if (typeof fallback === 'function') {
    return fallback(pm);
  }
  return fallback;
}

export function dependencyMatches(project, needle) {
  const dependencies = (project.metadata?.dependencies || []).map((dep) => {
    if (typeof dep === 'string') return dep.toLowerCase();
    if (dep && typeof dep === 'object' && dep.name) return dep.name.toLowerCase();
    return '';
  }).filter(Boolean);
  const target = needle.toLowerCase();
  return dependencies.some((value) => {
    if (value === target) return true;
    if (value.startsWith(`${target}@`) || value.startsWith(`${target}==`) || value.startsWith(`${target}>=`) || value.startsWith(`${target}~=`)) return true;
    if (value.startsWith(`${target}/`) || value.endsWith(`/${target}`)) return true;
    return false;
  });
}

export function parseCommandTokens(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value.command)) {
      return value.command;
    }
    if (typeof value.command === 'string') {
      return value.command.trim().split(/\s+/).filter(Boolean);
    }
  }
  if (typeof value === 'string') {
    return value.trim().split(/\s+/).filter(Boolean);
  }
  return [];
}

export function getLockfileInfo(projectPath) {
  const lockfiles = [
    { file: 'package-lock.json', pm: 'npm' },
    { file: 'yarn.lock', pm: 'yarn' },
    { file: 'pnpm-lock.yaml', pm: 'pnpm' },
    { file: 'bun.lockb', pm: 'bun' },
    { file: 'uv.lock', pm: 'uv' },
    { file: 'poetry.lock', pm: 'poetry' },
    { file: 'Pipfile.lock', pm: 'pipenv' },
    { file: 'composer.lock', pm: 'composer' },
    { file: 'Cargo.lock', pm: 'cargo' },
    { file: 'go.sum', pm: 'go' }
  ];
  
  for (const { file, pm } of lockfiles) {
    if (hasProjectFile(projectPath, file)) {
      return { lockfile: file, packageManager: pm };
    }
  }
  return { lockfile: null, packageManager: null };
}
