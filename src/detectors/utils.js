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

export function getPackageManager(projectPath) {
  if (hasProjectFile(projectPath, 'bun.lockb') || hasProjectFile(projectPath, 'bun.lock')) return 'bun';
  if (hasProjectFile(projectPath, 'pnpm-lock.yaml')) return 'pnpm';
  if (hasProjectFile(projectPath, 'yarn.lock')) return 'yarn';
  return 'npm';
}

export function resolveScriptCommand(project, scriptName, fallback = null) {
  const scripts = project.metadata?.scripts || {};
  const pm = project.metadata?.packageManager || 'npm';
  if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
    return [pm, 'run', scriptName];
  }
  if (typeof fallback === 'function') {
    return fallback(pm);
  }
  return fallback;
}

export function dependencyMatches(project, needle) {
  const dependencies = (project.metadata?.dependencies || []).map((dep) => dep.toLowerCase());
  const target = needle.toLowerCase();
  return dependencies.some((value) => value === target || value.startsWith(`${target}@`) || value.includes(`/${target}`));
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
