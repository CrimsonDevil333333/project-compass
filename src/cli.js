#!/usr/bin/env node
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {render, Box, Text, useApp, useInput} from 'ink';
import fastGlob from 'fast-glob';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import kleur from 'kleur';
import {execa} from 'execa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const create = React.createElement;

const IGNORE_PATTERNS = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/target/**'];

const SCHEMAS = [
  {
    type: 'node',
    label: 'Node.js',
    icon: '🟢',
    priority: 90,
    files: ['package.json'],
    async build(projectPath) {
      const pkgPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        return null;
      }
      const pkgContent = await fs.promises.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
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
        description: pkg.description || ''
      };
    }
  },
  {
    type: 'python',
    label: 'Python',
    icon: '🐍',
    priority: 80,
    files: ['pyproject.toml', 'requirements.txt', 'setup.py'],
    async build(projectPath) {
      const commands = {};
      const hasPyproject = fs.existsSync(path.join(projectPath, 'pyproject.toml'));
      if (hasPyproject) {
        commands.test = {label: 'Pytest', command: ['pytest']};
      } else {
        commands.test = {label: 'Unittest', command: ['python', '-m', 'unittest', 'discover']};
      }

      const entryPoint = await findPythonEntry(projectPath);
      if (entryPoint) {
        commands.run = {label: 'Run', command: ['python', entryPoint]};
      }

      return {
        id: `${projectPath}::python`,
        path: projectPath,
        name: path.basename(projectPath),
        type: 'Python',
        icon: '🐍',
        priority: this.priority,
        commands,
        description: ''
      };
    }
  },
  {
    type: 'rust',
    label: 'Rust',
    icon: '🦀',
    priority: 85,
    files: ['Cargo.toml'],
    async build(projectPath) {
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
        description: ''
      };
    }
  },
  {
    type: 'go',
    label: 'Go',
    icon: '🐹',
    priority: 80,
    files: ['go.mod'],
    async build(projectPath) {
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
        description: ''
      };
    }
  },
  {
    type: 'java',
    label: 'Java',
    icon: '☕️',
    priority: 75,
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    async build(projectPath) {
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
        description: ''
      };
    }
  },
  {
    type: 'scala',
    label: 'Scala',
    icon: '🔵',
    priority: 70,
    files: ['build.sbt'],
    async build(projectPath) {
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
        description: ''
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
      const entry = await schema.build(projectDir);
      if (!entry) {
        continue;
      }
      projectMap.set(projectDir, entry);
    }
  }
  const projects = Array.from(projectMap.values());
  projects.sort((a, b) => b.priority - a.priority);
  return projects;
}

const ACTION_KEYS = {
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

function Compass({rootPath}) {
  const {exit} = useApp();
  const {projects, loading, error} = useScanner(rootPath);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const selectedProject = projects[selectedIndex] || null;

  const addLog = useCallback((line) => {
    setLogLines((prev) => [...prev.slice(-200), line]);
  }, []);

  const runProjectCommand = useCallback(async (action) => {
    if (!selectedProject) {
      return;
    }
    if (running) {
      addLog(kleur.yellow('→ Wait for the current task to finish.'));
      return;
    }
    const commandMeta = selectedProject.commands[action];
    if (!commandMeta || !commandMeta.command?.length) {
      addLog(kleur.gray(`(no ${action} command available for ${selectedProject.type})`));
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
  }, [addLog, running, selectedProject]);

  useInput((input, key) => {
    if (key.upArrow && projects.length > 0) {
      setSelectedIndex((prev) => (prev - 1 + projects.length) % projects.length);
    } else if (key.downArrow && projects.length > 0) {
      setSelectedIndex((prev) => (prev + 1) % projects.length);
    } else if (input === 'q') {
      exit();
    } else if (ACTION_KEYS[input]) {
      runProjectCommand(ACTION_KEYS[input]);
    }
  });

  const actionHints = useMemo(() => {
    if (!selectedProject) {
      return 'Waiting for projects to appear...';
    }
    const available = Object.entries(ACTION_KEYS)
      .map(([key, actionName]) => {
        const meta = selectedProject.commands[actionName];
        return `${key.toUpperCase()}:${meta ? meta.label : '—'}`;
      })
      .join('  ');
    return `Actions: ${available}  |  q: quit  |  arrows: pick project`;
  }, [selectedProject]);

  const projectRows = [];
  if (loading) {
    projectRows.push(create(Text, {dimColor: true}, 'Searching for projects…'));
  }
  if (error) {
    projectRows.push(create(Text, {color: 'red'}, `Unable to list projects: ${error}`));
  }
  if (!loading && !error && projects.length === 0) {
    projectRows.push(create(Text, {dimColor: true}, 'Nothing recognized yet. Make sure the workspace contains known manifest files (package.json, pyproject.toml, etc.).'));
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

  const logNodes = logLines.length
    ? logLines.map((line, index) => create(Text, {key: `${line}-${index}`}, line))
    : [create(Text, {dimColor: true}, 'Logs will appear here when you run a command.')];

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
        create(Text, null, loading ? 'Scanning for repositories...' : `${projects.length} projects detected in ${rootPath}`)
      ),
      create(
        Box,
        {flexDirection: 'column', alignItems: 'flex-end'},
        create(Text, null, running ? 'Busy 🔁' : lastAction ? `Last: ${lastAction}` : 'Idle'),
        create(Text, {dimColor: true}, actionHints)
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
        {flexDirection: 'column', flexGrow: 1, borderStyle: 'round', borderColor: 'gray'},
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
    if (token === '--mode' && tokens[i + 1]) {
      args.mode = tokens[i + 1];
      i += 1;
    } else if ((token === '--dir' || token === '--path') && tokens[i + 1]) {
      args.root = tokens[i + 1];
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
