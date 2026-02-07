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
const DEFAULT_CONFIG = {customCommands: {}};

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
      const preferScript = (names) => {
        for (const name of names) {
          if (Object.prototype.hasOwnProperty.call(scripts, name)) {
            return ['npm', 'run', name];
          }
        }
        return null;
      };

      const commands = {};
      const buildCmd = preferScript(['build', 'compile', 'bundle', 'dist']);
      if (buildCmd) {
        commands.build = {label: 'Build', command: buildCmd};
      }
      const testCmd = preferScript(['test', 'check', 'spec']);
      if (testCmd) {
        commands.test = {label: 'Test', command: testCmd};
      }
      const runCmd = preferScript(['start', 'dev', 'serve', 'run']);
      if (runCmd) {
        commands.run = {label: 'Start', command: runCmd};
      }

      return {
        id: `${projectPath}::node`,
        path: projectPath,
        name: pkg.name || path.basename(projectPath),
        type: 'Node.js',
        icon: '🟢',
        priority: this.priority,
        commands,
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

      return {
        id: `${projectPath}::python`,
        path: projectPath,
        name: path.basename(projectPath),
        type: 'Python',
        icon: '🐍',
        priority: this.priority,
        commands,
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
      projectMap.set(projectDir, entry);
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
  const builtins = Object.values(project.commands || {}).map((command) => ({
    ...command,
    source: 'builtin'
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
      projectRows.push(
        create(
          Box,
          {key: project.id, flexDirection: 'row'},
          create(
            Text,
            {
              color: index === selectedIndex ? 'green' : undefined,
              bold: index === selectedIndex
            },
            `${project.icon} ${project.name}`
          ),
          create(Text, {dimColor: true}, `  ${project.type} · ${path.relative(rootPath, project.path) || '.'}`)
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
    if (selectedProject.extra?.scripts && selectedProject.extra.scripts.length) {
      detailContent.push(create(Text, {dimColor: true}, `Scripts: ${selectedProject.extra.scripts.join(', ')}`));
    }
    detailContent.push(create(Text, {dimColor: true}, `Custom commands stored in ${CONFIG_PATH}`));
    detailContent.push(create(Text, {bold: true, marginTop: 1}, 'Commands')); // show label
    detailedIndexed.forEach((command) => {
      detailContent.push(
        create(Text, {key: `${command.shortcut}-${command.label}`}, `${command.shortcut}. ${command.label} ${command.source === 'custom' ? kleur.magenta('(custom)') : ''}`)
      );
      detailContent.push(create(Text, {dimColor: true}, `   ↳ ${command.command.join(' ')}`));
    });
    if (!detailedIndexed.length) {
      detailContent.push(create(Text, {dimColor: true}, 'No built-in commands yet. Add a custom command with C.'));
    }
    detailContent.push(create(Text, {dimColor: true}, 'Press C → label|cmd to save custom actions, Enter to close detail view.'));
  } else {
    detailContent.push(create(Text, {dimColor: true}, 'Press Enter on a project to reveal details (icons, info, commands, customizations).'));
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
