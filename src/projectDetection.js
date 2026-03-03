import fs from 'fs';
import path from 'path';
import fastGlob from 'fast-glob';
import { ensureConfigDir, PLUGIN_FILE } from './configPaths.js';
import { dependencyMatches, hasProjectFile, parseCommandTokens, checkBinary } from './detectors/utils.js';
import nodeDetector from './detectors/node.js';
import pythonDetector from './detectors/python.js';
import rustDetector from './detectors/rust.js';
import goDetector from './detectors/go.js';
import javaDetector from './detectors/java.js';
import phpDetector from './detectors/php.js';
import rubyDetector from './detectors/ruby.js';
import dotnetDetector from './detectors/dotnet.js';
import genericDetector from './detectors/generic.js';
import { builtInFrameworks } from './detectors/frameworks.js';

const IGNORE_PATTERNS = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/target/**'];

const detectors = [
  nodeDetector,
  pythonDetector,
  rustDetector,
  goDetector,
  javaDetector,
  phpDetector,
  rubyDetector,
  dotnetDetector,
  genericDetector
];

function loadUserFrameworks() {
  ensureConfigDir();
  if (!fs.existsSync(PLUGIN_FILE)) {
    return [];
  }
  try {
    const payload = JSON.parse(fs.readFileSync(PLUGIN_FILE, 'utf-8') || '{}');
    const plugins = payload.plugins || [];
    return plugins.map((entry) => {
      const normalizedId = entry.id || (entry.name ? entry.name.toLowerCase().replace(/\s+/g, '-') : `plugin-${Math.random().toString(36).slice(2, 8)}`);
      const commands = {};
      Object.entries(entry.commands || {}).forEach(([key, value]) => {
        const tokens = parseCommandTokens(typeof value === 'object' ? value.command : value);
        if (!tokens.length) {
          return;
        }
        commands[key] = {
          label: typeof value === 'object' ? value.label || key : key,
          command: tokens,
          source: 'plugin'
        };
      });
      return {
        id: normalizedId,
        name: entry.name || normalizedId,
        icon: entry.icon || '🧩',
        description: entry.description || '',
        languages: entry.languages || [],
        files: entry.files || [],
        dependencies: entry.dependencies || [],
        scripts: entry.scripts || [],
        priority: Number.isFinite(entry.priority) ? entry.priority : 70,
        commands,
        match: entry.match
      };
    }).filter((plugin) => plugin.name && plugin.commands && Object.keys(plugin.commands).length);
  } catch (error) {
    console.error(`Failed to parse plugins.json: ${error.message}`);
    return [];
  }
}

let cachedFrameworkPlugins = null;

function getFrameworkPlugins() {
  if (cachedFrameworkPlugins) {
    return cachedFrameworkPlugins;
  }
  cachedFrameworkPlugins = [...builtInFrameworks, ...loadUserFrameworks()];
  return cachedFrameworkPlugins;
}

function matchesPlugin(project, plugin) {
  if (plugin.languages && plugin.languages.length > 0 && !plugin.languages.includes(project.type)) {
    return false;
  }
  if (plugin.files && plugin.files.length > 0) {
    const hit = plugin.files.some((file) => hasProjectFile(project.path, file));
    if (!hit) {
      return false;
    }
  }
  if (plugin.dependencies && plugin.dependencies.length > 0) {
    const hit = plugin.dependencies.some((dep) => dependencyMatches(project, dep));
    if (!hit) {
      return false;
    }
  }
  if (plugin.scripts && plugin.scripts.length > 0) {
    const scripts = project.metadata?.scripts || {};
    const hit = plugin.scripts.some((name) => Object.prototype.hasOwnProperty.call(scripts, name));
    if (!hit) {
      return false;
    }
  }
  if (typeof plugin.match === 'function') {
    if (!plugin.match(project)) {
      return false;
    }
  }
  return true;
}

function applyFrameworkPlugins(project) {
  const plugins = getFrameworkPlugins();
  let commands = { ...project.commands };
  const frameworks = [];
  let maxPriority = project.priority || 0;
  for (const plugin of plugins) {
    if (!matchesPlugin(project, plugin)) {
      continue;
    }
    frameworks.push({ id: plugin.id, name: plugin.name, icon: plugin.icon, description: plugin.description });
    if (plugin.priority && plugin.priority > maxPriority) {
      maxPriority = plugin.priority;
    }
    const pluginCommands = typeof plugin.commands === 'function' ? plugin.commands(project) : plugin.commands;
    if (pluginCommands) {
      Object.entries(pluginCommands).forEach(([key, command]) => {
        if (!Array.isArray(command.command) || command.command.length === 0) {
          return;
        }
        commands = {
          ...commands,
          [key]: {
            ...command,
            source: command.source || 'framework'
          }
        };
      });
    }
  }
  return { ...project, commands, frameworks, priority: maxPriority };
}

export async function discoverProjects(root) {
  const projectMap = new Map();
  for (const detector of detectors) {
    try {
      const patterns = detector.files.map((file) => `**/${file}`);
      const matches = await fastGlob(patterns, {
        cwd: root,
        ignore: IGNORE_PATTERNS,
        onlyFiles: true,
        deep: 5
      });

      for (const match of matches) {
        try {
          const projectDir = path.resolve(root, path.dirname(match));
          const existing = projectMap.get(projectDir);
          if (existing && existing.priority >= detector.priority) {
            continue;
          }
          const entry = await detector.build(projectDir, match);
          if (!entry) {
            continue;
          }
          const withFrameworks = applyFrameworkPlugins(entry);
          projectMap.set(projectDir, withFrameworks);
        } catch (innerError) {
          console.error(`Error building project for ${match}: ${innerError.message}`);
        }
      }
    } catch (error) {
      console.error(`Error in detector ${detector.type}: ${error.message}`);
    }
  }
  return Array.from(projectMap.values()).sort((a, b) => b.priority - a.priority);
}

export const SCHEMA_GUIDE = detectors.map((d) => ({
  type: d.type,
  label: d.label || d.type,
  icon: d.icon || '⚙',
  files: d.files
}));

export { checkBinary };
