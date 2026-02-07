#!/usr/bin/env node
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {render, Box, Text, useApp, useInput} from 'ink';
import fastGlob from 'fast-glob';
import path from 'path';
import fs from 'fs';
import os from 'os';
import {fileURLToPath} from 'url';
import kleur from 'kleur';
import {execa} from 'execa';

const create = React.createElement;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG_DIR = path.join(os.homedir(), '.project-compass');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const PLUGIN_FILE = path.join(CONFIG_DIR, 'plugins.json');
const DEFAULT_CONFIG = {customCommands: {}};
const DEFAULT_PLUGIN_CONFIG = {plugins: []};

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, {recursive: true});
  }
}

function saveConfig(config) {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Unable to persist config: ${error.message}`);
  }
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const payload = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(payload || '{}');
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        customCommands: {
          ...DEFAULT_CONFIG.customCommands,
          ...(parsed.customCommands || {})
        }
      };
    }
  } catch (error) {
    console.error(`Ignoring corrupt config: ${error.message}`);
  }
  return {...DEFAULT_CONFIG};
}

function parseCommandTokens(value) {
  if (Array.isArray(value)) {
    return value.map((token) => String(token));
  }
  if (typeof value === 'string') {
    return value.trim().split(/\s+/).filter(Boolean);
  }
  return [];
}

function resolveScriptCommand(project, scriptName, fallback = null) {
  const scripts = project.metadata?.scripts || {};
  if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
    return ['npm', 'run', scriptName];
  }
  if (typeof fallback === 'function') {
    return fallback();
  }
  return fallback;
}

function gatherNodeDependencies(pkg) {
  const deps = new Set();
  ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].forEach((key) => {
    if (pkg[key]) {
      Object.keys(pkg[key]).forEach((name) => deps.add(name));
    }
  });
  return Array.from(deps);
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
  const pyproject = path.join(projectPath, 'pyproject.toml');
  if (fs.existsSync(pyproject)) {
    const content = fs.readFileSync(pyproject, 'utf-8').toLowerCase();
    const matches = content.match(/\b[a-z0-9-_/]+\b/g);
    (matches || []).forEach((match) => {
      if (match) {
        set.add(match);
      }
    });
  }
  return Array.from(set);
}

function dependencyMatches(project, needle) {
  const dependencies = (project.metadata?.dependencies || []).map((dep) => dep.toLowerCase());
  const target = needle.toLowerCase();
  return dependencies.some((value) => value === target || value.startsWith(`${target}@`) || value.includes(`/${target}`));
}

const builtInFrameworks = [
  {
    id: 'next',
    name: 'Next.js',
    icon: '🧭',
    description: 'React + Next.js (SSR/SSG) apps',
    languages: ['Node.js'],
    priority: 115,
    match(project) {
      const hasNextConfig = fs.existsSync(path.join(project.path, 'next.config.js'));
      return dependencyMatches(project, 'next') || hasNextConfig;
    },
    commands(project) {
      const commands = {};
      const add = (key, label, fallback) => {
        const tokens = resolveScriptCommand(project, key, fallback);
        if (tokens) {
          commands[key] = {label, command: tokens, source: 'framework'};
        }
      };
      const buildFallback = () => ['npx', 'next', 'build'];
      const startFallback = () => ['npx', 'next', 'start'];
      const devFallback = () => ['npx', 'next', 'dev'];
      add('run', 'Next dev', devFallback);
      add('build', 'Next build', buildFallback);
      add('test', 'Next test', () => ['npm', 'run', 'test']);
      add('start', 'Next start', startFallback);
      return commands;
    }
  },
  {
    id: 'django',
    name: 'Django',
    icon: '🌿',
    description: 'Django web application',
    languages: ['Python'],
    priority: 110,
    match(project) {
      return dependencyMatches(project, 'django') || fs.existsSync(path.join(project.path, 'manage.py'));
    },
    commands(project) {
      const managePath = path.join(project.path, 'manage.py');
      if (!fs.existsSync(managePath)) {
        return {};
      }
      return {
        run: {label: 'Django runserver', command: ['python', 'manage.py', 'runserver'], source: 'framework'},
        test: {label: 'Django test', command: ['python', 'manage.py', 'test'], source: 'framework'},
        migrate: {label: 'Django migrate', command: ['python', 'manage.py', 'migrate'], source: 'framework'}
      };
    }
  }
];

function loadUserFrameworks() {
  ensureConfigDir();
  try {
    if (!fs.existsSync(PLUGIN_FILE)) {
      return [];
    }
    const payload = JSON.parse(fs.readFileSync(PLUGIN_FILE, 'utf-8') || '{}');
    const plugins = payload.plugins || [];
    return plugins.map((entry) => {
      const normalizedId = entry.id || (entry.name ? entry.name.toLowerCase().replace(/\s+/g, '-') : `plugin-${Math.random().toString(36).slice(2, 8)}`);
      const commands = {};
      Object.entries(entry.commands || {}).forEach(([key, value]) => {
        const command = parseCommandTokens(typeof value === 'object' ? value.command : value);
        if (!command.length) {
          return;
        }
        commands[key] = {
          label: typeof value === 'object' ? value.label || key : key,
          command,
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
    })
    .filter((plugin) => plugin.name && plugin.commands && Object.keys(plugin.commands).length);
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
    const hit = plugin.files.some((file) => fs.existsSync(path.join(project.path, file)));
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
  let commands = {...project.commands};
  const frameworks = [];
  let maxPriority = project.priority || 0;
  for (const plugin of plugins) {
    if (!matchesPlugin(project, plugin)) {
      continue;
    }
    frameworks.push({id: plugin.id, name: plugin.name, icon: plugin.icon, description: plugin.description});
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
  return {...project, commands, frameworks, priority: maxPriority};
}

const IGNORE_PATTERNS = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/target/**'];

const SCHEMAS = [
  {
    type: 'node',
    label: 'Node.js',
    icon: '🟢',
    priority: 90,
    files: ['package.json'],
    async build(projectPath, manifest) {
      const pkgPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        return null;
      }
      const content = await fs.promises.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);
      const scripts = pkg.scripts || {};
      const commands = {};
      const preferScript = (targetKey, names, label) => {
        for (const name of names) {
          if (Object.prototype.hasOwnProperty.call(scripts, name)) {
            commands[targetKey] = {label, command: ['npm', 'run', name]};
            break;
          }
        }
      };
      preferScript('build', ['build', 'compile', 'dist'], 'Build');
      preferScript('test', ['test', 'check', 'spec'], 'Test');
      preferScript('run', ['start', 'dev', 'serve', 'run'], 'Start');

      const metadata = {
        dependencies: gatherNodeDependencies(pkg),
        scripts,
        packageJson: pkg
      };

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
        extra: {
          scripts: Object.keys(scripts)
        }
      };
    }
  },
  {
    type: 'python',
    label: 'Python',
    icon: '🐍',
    priority: 80,
    files: ['pyproject.toml', 'requirements.txt', 'setup.py'],
    async build(projectPath, manifest) {
      const commands = {};
      if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
        commands.test = {label: 'Pytest', command: ['pytest']};
      } else {
        commands.test = {label: 'Unittest', command: ['python', '-m', 'unittest', 'discover']};
      }

      const entry = await findPythonEntry(projectPath);
      if (entry) {
        commands.run = {label: 'Run', command: ['python', entry]};
      }

      const metadata = {
        dependencies: gatherPythonDependencies(projectPath)
      };

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
        extra: {
          entry
        }
      };
    }
  },
  {
    type: 'rust',
    label: 'Rust',
    icon: '🦀',
    priority: 85,
    files: ['Cargo.toml'],
    async build(projectPath, manifest) {
      return {
        id: `${projectPath}::rust`,
        path: projectPath,
        name: path.basename(projectPath),
        type: 'Rust',
        icon: '🦀',
        priority: this.priority,
        commands: {
          build: {label: 'Cargo build', command: ['cargo', 'build']},
          test: {label: 'Cargo test', command: ['cargo', 'test']},
          run: {label: 'Cargo run', command: ['cargo', 'run']}
        },
        metadata: {},
        manifest: path.basename(manifest),
        description: '',
        extra: {}
      };
    }
  },
  {
    type: 'go',
    label: 'Go',
    icon: '🐹',
    priority: 80,
    files: ['go.mod'],
    async build(projectPath, manifest) {
      return {
        id: `${projectPath}::go`,
        path: projectPath,
        name: path.basename(projectPath),
        type: 'Go',
        icon: '🐹',
        priority: this.priority,
        commands: {
          build: {label: 'Go build', command: ['go', 'build', './...']},
          test: {label: 'Go test', command: ['go', 'test', './...']},
          run: {label: 'Go run', command: ['go', 'run', '.']}
        },
        metadata: {},
        manifest: path.basename(manifest),
        description: '',
        extra: {}
      };
    }
  },
  {
    type: 'java',
    label: 'Java',
    icon: '☕️',
    priority: 75,
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    async build(projectPath, manifest) {
      const hasMvnw = fs.existsSync(path.join(projectPath, 'mvnw'));
      const hasGradlew = fs.existsSync(path.join(projectPath, 'gradlew'));
      const commands = {};
      if (hasGradlew) {
        commands.build = {label: 'Gradle build', command: ['./gradlew', 'build']};
        commands.test = {label: 'Gradle test', command: ['./gradlew', 'test']};
      } else if (hasMvnw) {
        commands.build = {label: 'Maven package', command: ['./mvnw', 'package']};
        commands.test = {label: 'Maven test', command: ['./mvnw', 'test']};
      } else {
        commands.build = {label: 'Maven package', command: ['mvn', 'package']};
        commands.test = {label: 'Maven test', command: ['mvn', 'test']};
      }

      return {
        id: `${projectPath}::java`,
        path: projectPath,
        name: path.basename(projectPath),
        type: 'Java',
        icon: '☕️',
        priority: this.priority,
        commands,
        metadata: {},
        manifest: path.basename(manifest),
        description: '',
        extra: {}
      };
    }
  },
  {
    type: 'scala',
    label: 'Scala',
    icon: '🔵',
    priority: 70,
    files: ['build.sbt'],
    async build(projectPath, manifest) {
      return {
        id: `${projectPath}::scala`,
        path: projectPath,
        name: path.basename(projectPath),
        type: 'Scala',
        icon: '🔵',
        priority: this.priority,
        commands: {
          build: {label: 'sbt compile', command: ['sbt', 'compile']},
          test: {label: 'sbt test', command: ['sbt', 'test']},
          run: {label: 'sbt run', command: ['sbt', 'run']}
        },
        metadata: {},
        manifest: path.basename(manifest),
        description: '',
        extra: {}
      };
    }
  }
];

async function findPythonEntry(projectPath) {
  const candidates = ['main.py', 'app.py', 'src/main.py', 'src/app.py'];
  for (const candidate of candidates) {
    const candidatePath = path.join(projectPath, candidate);
    if (fs.existsSync(candidatePath)) {
      return candidate;
    }
  }
  return null;
}

async function discoverProjects(root) {
  const projectMap = new Map();
  for (const schema of SCHEMAS) {
    const patterns = schema.files.map((file) => `**/${file}`);
    const matches = await fastGlob(patterns, {
      cwd: root,
      ignore: IGNORE_PATTERNS,
      onlyFiles: true,
      deep: 5
    });

    for (const match of matches) {
      const projectDir = path.resolve(root, path.dirname(match));
      const existing = projectMap.get(projectDir);
      if (existing && existing.priority >= schema.priority) {
        continue;
      }
      const entry = await schema.build(projectDir, match);
      if (!entry) {
        continue;
      }
      const withFrameworks = applyFrameworkPlugins(entry);
      projectMap.set(projectDir, withFrameworks);
    }
  }
  return Array.from(projectMap.values()).sort((a, b) => b.priority - a.priority);
}

const ACTION_MAP = {
  b: 'build',
  t: 'test',
  r: 'run'
};

function useScanner(rootPath) {
  const [state, setState] = useState({projects: [], loading: true, error: null});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const projects = await discoverProjects(rootPath);
        if (!cancelled) {
          setState({projects, loading: false, error: null});
        }
      } catch (error) {
        if (!cancelled) {
          setState({projects: [], loading: false, error: error.message});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rootPath]);

  return state;
}

function buildDetailCommands(project, config) {
  if (!project) {
    return [];
  }
  const builtins = Object.entries(project.commands || {}).map(([key, command]) => ({
    label: command.label || key,
    command: command.command,
    source: command.source || 'builtin'
  }));
  const custom = (config.customCommands?.[project.path] || []).map((entry) => ({
    label: entry.label,
    command: entry.command,
    source: 'custom'
  }));
  return [...builtins, ...custom];
}

function Compass({rootPath}) {
  const {exit} = useApp();
  const {projects, loading, error} = useScanner(rootPath);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [logLines, setLogLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [config, setConfig] = useState(() => loadConfig());

  const selectedProject = projects[selectedIndex] || null;

  const addLog = useCallback((line) => {
    setLogLines((prev) => [...prev.slice(-200), typeof line === 'string' ? line : JSON.stringify(line)]);
  }, []);

  const detailCommands = useMemo(() => buildDetailCommands(selectedProject, config), [selectedProject, config]);
  const detailedIndexed = useMemo(() => detailCommands.map((command, index) => ({
    ...command,
    shortcut: `${index + 1}`
  })), [detailCommands]);
  const detailShortcutMap = useMemo(() => {
    const map = new Map();
    detailedIndexed.forEach((cmd) => map.set(cmd.shortcut, cmd));
    return map;
  }, [detailedIndexed]);

  const runProjectCommand = useCallback(async (commandMeta) => {
    if (!selectedProject) {
      return;
    }
    if (!commandMeta || !Array.isArray(commandMeta.command) || commandMeta.command.length === 0) {
      addLog(kleur.gray('(no command configured)'));
      return;
    }
    if (running) {
      addLog(kleur.yellow('→ Wait for the current task to finish.'));
      return;
    }

    setRunning(true);
    setLastAction(`${selectedProject.name} · ${commandMeta.label}`);
    const fullCmd = commandMeta.command;
    addLog(kleur.cyan(`> ${fullCmd.join(' ')}`));

    try {
      const subprocess = execa(fullCmd[0], fullCmd.slice(1), {
        cwd: selectedProject.path,
        env: process.env
      });

      subprocess.stdout?.on('data', (chunk) => {
        addLog(chunk.toString().trimEnd());
      });
      subprocess.stderr?.on('data', (chunk) => {
        addLog(kleur.red(chunk.toString().trimEnd()));
      });

      await subprocess;
      addLog(kleur.green(`✓ ${commandMeta.label} finished`));
    } catch (error) {
      addLog(kleur.red(`✗ ${commandMeta.label} failed: ${error.shortMessage || error.message}`));
    } finally {
      setRunning(false);
    }
  }, [selectedProject, addLog, running]);

  const handleAddCustomCommand = useCallback((label, commandTokens) => {
    if (!selectedProject) {
      return;
    }
    setConfig((prev) => {
      const projectKey = selectedProject.path;
      const existing = prev.customCommands?.[projectKey] || [];
      const nextCustom = [...existing, {label, command: commandTokens}];
      const nextConfig = {
        ...prev,
        customCommands: {
          ...prev.customCommands,
          [projectKey]: nextCustom
        }
      };
      saveConfig(nextConfig);
      return nextConfig;
    });
    addLog(kleur.yellow(`Saved custom command "${label}" for ${selectedProject.name}`));
  }, [selectedProject, addLog]);

  const handleCustomSubmit = useCallback(() => {
    const raw = customInput.trim();
    if (!selectedProject) {
      setCustomMode(false);
      return;
    }
    if (!raw) {
      addLog(kleur.gray('Canceled custom command (empty).'));
      setCustomMode(false);
      setCustomInput('');
      return;
    }
    const [labelPart, commandPart] = raw.split('|');
    const commandTokens = (commandPart || labelPart).trim().split(/\s+/).filter(Boolean);
    if (!commandTokens.length) {
      addLog(kleur.red('Custom command needs at least one token.'));
      setCustomMode(false);
      setCustomInput('');
      return;
    }
    const label = commandPart ? labelPart.trim() : `Custom ${selectedProject.name}`;
    handleAddCustomCommand(label || 'Custom', commandTokens);
    setCustomMode(false);
    setCustomInput('');
  }, [customInput, selectedProject, handleAddCustomCommand, addLog]);

  useInput((input, key) => {
    if (customMode) {
      if (key.return) {
        handleCustomSubmit();
        return;
      }
      if (key.escape) {
        setCustomMode(false);
        setCustomInput('');
        return;
      }
      if (key.backspace) {
        setCustomInput((prev) => prev.slice(0, -1));
        return;
      }
      if (input) {
        setCustomInput((prev) => prev + input);
      }
      return;
    }

    if (key.upArrow && projects.length > 0) {
      setSelectedIndex((prev) => (prev - 1 + projects.length) % projects.length);
      return;
    }
    if (key.downArrow && projects.length > 0) {
      setSelectedIndex((prev) => (prev + 1) % projects.length);
      return;
    }
    if (key.return) {
      if (!selectedProject) {
        return;
      }
      setViewMode((prev) => (prev === 'detail' ? 'list' : 'detail'));
      return;
    }
    if (input === 'q') {
      exit();
      return;
    }
    if (input === 'c' && viewMode === 'detail' && selectedProject) {
      setCustomMode(true);
      setCustomInput('');
      return;
    }
    if (ACTION_MAP[input]) {
      const commandMeta = selectedProject?.commands?.[ACTION_MAP[input]];
      runProjectCommand(commandMeta);
      return;
    }
    if (viewMode === 'detail' && detailShortcutMap.has(input)) {
      runProjectCommand(detailShortcutMap.get(input));
    }
  });

  const projectRows = [];
  if (loading) {
    projectRows.push(create(Text, {dimColor: true}, 'Scanning for projects…'));
  }
  if (error) {
    projectRows.push(create(Text, {color: 'red'}, `Unable to scan: ${error}`));
  }
  if (!loading && !error && projects.length === 0) {
    projectRows.push(create(Text, {dimColor: true}, 'No recognizable project manifests found.'));
  }
  if (!loading) {
    projects.forEach((project, index) => {
      const frameworkBadges = (project.frameworks || []).map((frame) => `${frame.icon} ${frame.name}`).join(', ');
      projectRows.push(
        create(
          Box,
          {key: project.id, flexDirection: 'column', marginBottom: 1},
          create(
            Box,
            {flexDirection: 'row'},
            create(
              Text,
              {
                color: index === selectedIndex ? 'green' : undefined,
                bold: index === selectedIndex
              },
              `${project.icon} ${project.name}`
            ),
            create(Text, {dimColor: true}, `  ${project.type} · ${path.relative(rootPath, project.path) || '.'}`)
          ),
          frameworkBadges && create(Text, {dimColor: true}, `   ${frameworkBadges}`)
        )
      );
    });
  }

  const detailContent = [];
  if (viewMode === 'detail' && selectedProject) {
    detailContent.push(
      create(Text, {color: 'yellow', bold: true}, `${selectedProject.icon} ${selectedProject.name}`),
      create(Text, {dimColor: true}, `${selectedProject.type} · ${selectedProject.manifest || 'detected manifest'}`),
      create(Text, {dimColor: true}, `Location: ${path.relative(rootPath, selectedProject.path) || '.'}`)
    );
    if (selectedProject.description) {
      detailContent.push(create(Text, null, selectedProject.description));
    }
    const frameworks = (selectedProject.frameworks || []).map((lib) => `${lib.icon} ${lib.name}`).join(', ');
    if (frameworks) {
      detailContent.push(create(Text, {dimColor: true}, `Frameworks: ${frameworks}`));
    }
    if (selectedProject.extra?.scripts && selectedProject.extra.scripts.length) {
      detailContent.push(create(Text, {dimColor: true}, `Scripts: ${selectedProject.extra.scripts.join(', ')}`));
    }
    detailContent.push(create(Text, {dimColor: true}, `Custom commands stored in ${CONFIG_PATH}`));
    detailContent.push(create(Text, {dimColor: true, marginBottom: 1}, `Extend frameworks via ${PLUGIN_FILE}`));
    detailContent.push(create(Text, {bold: true, marginTop: 1}, 'Commands'));
    detailedIndexed.forEach((command) => {
      detailContent.push(
        create(Text, {key: `${command.shortcut}-${command.label}`}, `${command.shortcut}. ${command.label} ${command.source === 'custom' ? kleur.magenta('(custom)') : command.source === 'framework' ? kleur.cyan('(framework)') : ''}`)
      );
      detailContent.push(create(Text, {dimColor: true}, `   ↳ ${command.command.join(' ')}`));
    });
    if (!detailedIndexed.length) {
      detailContent.push(create(Text, {dimColor: true}, 'No built-in commands yet. Add a custom command with C.'));
    }
    detailContent.push(create(Text, {dimColor: true}, 'Press C → label|cmd to save custom actions, Enter to close detail view.'));
  } else {
    detailContent.push(create(Text, {dimColor: true}, 'Press Enter on a project to reveal details (icons, commands, frameworks, custom actions).'));
  }

  if (customMode) {
    detailContent.push(create(Text, {color: 'cyan'}, `Type label|cmd (Enter to save, Esc to cancel): ${customInput}`));
  }

  const logNodes = logLines.length
    ? logLines.map((line, index) => create(Text, {key: `${line}-${index}`}, line))
    : [create(Text, {dimColor: true}, 'Logs will appear here once you run a command.')];

  const headerHint = viewMode === 'detail'
    ? `Detail mode · 1-${Math.max(detailedIndexed.length, 1)} to execute, C: add custom commands, Enter: back to list, q: quit`
    : `Quick run · B/T/R to build/test/run, Enter: view details, q: quit`;

  return create(
    Box,
    {flexDirection: 'column', padding: 1},
    create(
      Box,
      {justifyContent: 'space-between'},
      create(
        Box,
        {flexDirection: 'column'},
        create(Text, {color: 'cyan', bold: true}, 'Project Compass'),
        create(Text, null, loading ? 'Scanning workspaces…' : `${projects.length} project(s) detected in ${rootPath}`)
      ),
      create(
        Box,
        {flexDirection: 'column', alignItems: 'flex-end'},
        create(Text, null, running ? 'Busy 🔁' : lastAction ? `Last: ${lastAction}` : 'Idle'),
        create(Text, {dimColor: true}, headerHint)
      )
    ),
    create(
      Box,
      {marginTop: 1},
      create(
        Box,
        {flexDirection: 'column', width: 60, marginRight: 2},
        create(Text, {bold: true}, 'Projects'),
        create(Box, {flexDirection: 'column', marginTop: 1}, ...projectRows)
      ),
      create(
        Box,
        {
          flexDirection: 'column',
          width: 44,
          marginRight: 2,
          borderStyle: 'round',
          borderColor: 'gray',
          padding: 1
        },
        create(Text, {bold: true}, 'Details'),
        ...detailContent
      ),
      create(
        Box,
        {
          flexDirection: 'column',
          flexGrow: 1,
          borderStyle: 'round',
          borderColor: 'gray'
        },
        create(Text, {bold: true}, 'Output'),
        create(Box, {flexDirection: 'column', marginTop: 1, height: 12, overflow: 'hidden'}, ...logNodes)
      )
    )
  );
}

function parseArgs() {
  const args = {};
  const tokens = process.argv.slice(2);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if ((token === '--dir' || token === '--path') && tokens[i + 1]) {
      args.root = tokens[i + 1];
      i += 1;
    } else if (token === '--mode' && tokens[i + 1]) {
      args.mode = tokens[i + 1];
      i += 1;
    } else if (token === '--help' || token === '-h') {
      args.help = true;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log('Project Compass · Ink project runner');
    console.log('Usage: project-compass [--dir <path>] [--mode test]');
    return;
  }
  const rootPath = args.root ? path.resolve(args.root) : process.cwd();
  if (args.mode === 'test') {
    const projects = await discoverProjects(rootPath);
    console.log(`Detected ${projects.length} project(s) under ${rootPath}`);
    projects.forEach((project) => {
      console.log(` • [${project.type}] ${project.name} (${project.path})`);
    });
    return;
  }

  render(create(Compass, {rootPath}));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
