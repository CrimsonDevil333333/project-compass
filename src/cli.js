#!/usr/bin/env node
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {render, Box, Text, useApp, useInput} from 'ink';
import path from 'path';
import fs from 'fs';
import kleur from 'kleur';
import {execa} from 'execa';
import {discoverProjects, SCHEMA_GUIDE, checkBinary} from './projectDetection.js';
import {CONFIG_PATH, ensureConfigDir} from './configPaths.js';

const create = React.createElement;
const DEFAULT_CONFIG = {customCommands: {}};
const ART_CHARS = ['▁', '▃', '▄', '▅', '▇'];
const ART_COLORS = ['magenta', 'blue', 'cyan', 'yellow', 'red'];
const OUTPUT_WINDOW_SIZE = 8;
const OUTPUT_WINDOW_HEIGHT = OUTPUT_WINDOW_SIZE + 2;
const PROJECTS_MIN_WIDTH = 32;
const DETAILS_MIN_WIDTH = 44;
const HELP_CARD_MIN_WIDTH = 28;
const ACTION_MAP = {
  b: 'build',
  t: 'test',
  r: 'run'
};

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

function Studio() {
  const [runtimes, setRuntimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checks = [
      {name: 'Node.js', binary: 'node', versionCmd: ['-v']},
      {name: 'npm', binary: 'npm', versionCmd: ['-v']},
      {name: 'Python', binary: process.platform === 'win32' ? 'python' : 'python3', versionCmd: ['--version']},
      {name: 'Rust (Cargo)', binary: 'cargo', versionCmd: ['--version']},
      {name: 'Go', binary: 'go', versionCmd: ['version']},
      {name: 'Java', binary: 'java', versionCmd: ['-version']},
      {name: 'PHP', binary: 'php', versionCmd: ['-v']},
      {name: 'Ruby', binary: 'ruby', versionCmd: ['-v']},
      {name: '.NET', binary: 'dotnet', versionCmd: ['--version']}
    ];

    (async () => {
      const results = await Promise.all(checks.map(async (lang) => {
        if (!checkBinary(lang.binary)) {
          return {...lang, status: 'missing', version: 'not installed'};
        }
        try {
          const {stdout, stderr} = await execa(lang.binary, lang.versionCmd);
          const version = (stdout || stderr || '').split('\n')[0].trim();
          return {...lang, status: 'ok', version};
        } catch {
          return {...lang, status: 'error', version: 'failed to check'};
        }
      }));
      setRuntimes(results);
      setLoading(false);
    })();
  }, []);

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'double', borderColor: 'blue', padding: 1},
    create(Text, {bold: true, color: 'blue'}, '💎 Omni-Studio | Environment Intelligence'),
    create(Text, {dimColor: true, marginBottom: 1}, 'Overview of installed languages and build tools.'),
    loading
      ? create(Text, {dimColor: true}, 'Gathering intelligence...')
      : create(
          Box,
          {flexDirection: 'column'},
          ...runtimes.map(r => create(
            Box,
            {key: r.name, marginBottom: 0},
            create(Text, {width: 20, color: r.status === 'ok' ? 'green' : 'red'}, `${r.status === 'ok' ? '✓' : '✗'} ${r.name}`),
            create(Text, {dimColor: r.status !== 'ok'}, `:  ${r.version}`)
          )),
          create(Text, {marginTop: 1, color: 'yellow'}, '🛠️ Interactive Project Creator coming soon in v3.0'),
          create(Text, {dimColor: true}, 'Press Shift+A to return to Navigator.')
        )
  );
}

function CursorText({value, cursorIndex, active = true}) {
  const before = value.slice(0, cursorIndex);
  const charAt = value[cursorIndex] || ' ';
  const after = value.slice(cursorIndex + 1);

  return create(
    Text,
    null,
    before,
    active ? create(Text, {backgroundColor: 'white', color: 'black'}, charAt) : charAt,
    after
  );
}

function Compass({rootPath, initialView = 'navigator'}) {
  const {exit} = useApp();
  const {projects, loading, error} = useScanner(rootPath);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [mainView, setMainView] = useState(initialView);
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [logOffset, setLogOffset] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customCursor, setCustomCursor] = useState(0);
  const [config, setConfig] = useState(() => loadConfig());
  const [showHelpCards, setShowHelpCards] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [stdinBuffer, setStdinBuffer] = useState('');
  const [stdinCursor, setStdinCursor] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const selectedProject = projects[selectedIndex] || null;
  const runningProcessMap = useRef(new Map());
  const lastCommandRef = useRef(null);

  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId]);
  const running = activeTask?.status === 'running';

  const addLogToTask = useCallback((taskId, line) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const normalized = typeof line === 'string' ? line : JSON.stringify(line);
      const lines = normalized.split(/\r?\n/).filter(l => l.trim().length > 0);
      const nextLogs = [...t.logs, ...lines];
      return { ...t, logs: nextLogs.length > 500 ? nextLogs.slice(-500) : nextLogs };
    }));
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

  const runProjectCommand = useCallback(async (commandMeta, targetProject = selectedProject) => {
    const project = targetProject || selectedProject;
    if (!project) return;
    if (!commandMeta || !Array.isArray(commandMeta.command) || commandMeta.command.length === 0) return;

    const commandLabel = commandMeta.label || commandMeta.command.join(' ');
    const taskId = `task-${Date.now()}`;
    const newTask = {
      id: taskId,
      name: `${project.name} · ${commandLabel}`,
      status: 'running',
      logs: [kleur.cyan(`> ${commandMeta.command.join(' ')}`)],
      project: project.name
    };

    setTasks(prev => [...prev, newTask]);
    setActiveTaskId(taskId);
    lastCommandRef.current = {project, commandMeta};

    try {
      const subprocess = execa(commandMeta.command[0], commandMeta.command.slice(1), {
        cwd: project.path,
        env: process.env,
        stdin: 'pipe'
      });
      runningProcessMap.current.set(taskId, subprocess);

      subprocess.stdout?.on('data', (chunk) => addLogToTask(taskId, chunk.toString()));
      subprocess.stderr?.on('data', (chunk) => addLogToTask(taskId, kleur.red(chunk.toString())));

      await subprocess;
      setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: 'finished'} : t));
      addLogToTask(taskId, kleur.green(`✓ ${commandLabel} finished`));
    } catch (error) {
      setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: 'failed'} : t));
      addLogToTask(taskId, kleur.red(`✗ ${commandLabel} failed: ${error.shortMessage || error.message}`));
    } finally {
      runningProcessMap.current.delete(taskId);
    }
  }, [addLogToTask, selectedProject]);

  const handleAddCustomCommand = useCallback((label, commandTokens) => {
    if (!selectedProject) return;
    setConfig((prev) => {
      const projectKey = selectedProject.path;
      const existing = prev.customCommands?.[projectKey] || [];
      const nextConfig = {
        ...prev,
        customCommands: {
          ...prev.customCommands,
          [projectKey]: [...existing, {label, command: commandTokens}]
        }
      };
      saveConfig(nextConfig);
      return nextConfig;
    });
  }, [selectedProject]);

  const handleCustomSubmit = useCallback(() => {
    const raw = customInput.trim();
    if (!selectedProject || !raw) {
      setCustomMode(false);
      setCustomInput('');
      setCustomCursor(0);
      return;
    }
    const [labelPart, commandPart] = raw.split('|');
    const commandTokens = (commandPart || labelPart).trim().split(/\s+/).filter(Boolean);
    if (!commandTokens.length) {
      setCustomMode(false);
      setCustomInput('');
      setCustomCursor(0);
      return;
    }
    const label = commandPart ? labelPart.trim() : `Custom ${selectedProject.name}`;
    handleAddCustomCommand(label, commandTokens);
    setCustomMode(false);
    setCustomInput('');
    setCustomCursor(0);
  }, [customInput, selectedProject, handleAddCustomCommand]);

  const exportLogs = useCallback(() => {
    if (!activeTask || !activeTask.logs.length) return;
    try {
      const exportPath = path.resolve(process.cwd(), `compass-${activeTask.id}.txt`);
      fs.writeFileSync(exportPath, activeTask.logs.join('\n'));
      addLogToTask(activeTaskId, kleur.green(`✓ Logs exported to ${exportPath}`));
    } catch (err) {
      addLogToTask(activeTaskId, kleur.red(`✗ Export failed: ${err.message}`));
    }
  }, [activeTask, activeTaskId, addLogToTask]);

    useInput((input, key) => {
    if (customMode) {
      if (key.return) { handleCustomSubmit(); return; }
      if (key.escape) { setCustomMode(false); setCustomInput(''); setCustomCursor(0); return; }
      if (key.backspace || key.delete) {
        if (customCursor > 0) {
          setCustomInput((prev) => prev.slice(0, customCursor - 1) + prev.slice(customCursor));
          setCustomCursor(c => Math.max(0, c - 1));
        }
        return;
      }
      if (key.leftArrow) { setCustomCursor(c => Math.max(0, c - 1)); return; }
      if (key.rightArrow) { setCustomCursor(c => Math.min(customInput.length, c + 1)); return; }
      if (input) {
        setCustomInput((prev) => prev.slice(0, customCursor) + input + prev.slice(customCursor));
        setCustomCursor(c => c + input.length);
      }
      return;
    }

    const normalizedInput = input?.toLowerCase();
    const shiftCombo = (char) => key.shift && normalizedInput === char;
    
    if (shiftCombo('h')) { setShowHelpCards((prev) => !prev); return; }
    if (shiftCombo('s')) { setShowStructureGuide((prev) => !prev); return; }
    if (shiftCombo('a')) { setMainView((prev) => (prev === 'navigator' ? 'studio' : 'navigator')); return; }
    if (shiftCombo('x')) { setTasks(prev => prev.map(t => t.id === activeTaskId ? {...t, logs: []} : t)); setLogOffset(0); return; }
    if (shiftCombo('e')) { exportLogs(); return; }
    if (shiftCombo('d')) { setActiveTaskId(null); return; }
    if (shiftCombo('t')) { setMainView('tasks'); return; }

    const scrollLogs = (delta) => {
      setLogOffset((prev) => {
        const logs = activeTask?.logs || [];
        const maxScroll = Math.max(0, logs.length - OUTPUT_WINDOW_SIZE);
        return Math.max(0, Math.min(maxScroll, prev + delta));
      });
    };

    if (running && activeTaskId && runningProcessMap.current.has(activeTaskId)) {
      const proc = runningProcessMap.current.get(activeTaskId);
      if (key.ctrl && input === 'c') { proc.kill('SIGINT'); setStdinBuffer(''); setStdinCursor(0); return; }
      if (key.return) { proc.stdin?.write(stdinBuffer + '\n'); setStdinBuffer(''); setStdinCursor(0); return; }
      if (key.backspace || key.delete) {
        if (stdinCursor > 0) {
          setStdinBuffer(prev => prev.slice(0, stdinCursor - 1) + prev.slice(stdinCursor));
          setStdinCursor(c => Math.max(0, c - 1));
        }
        return;
      }
      if (key.leftArrow) { setStdinCursor(c => Math.max(0, c - 1)); return; }
      if (key.rightArrow) { setStdinCursor(c => Math.min(stdinBuffer.length, c + 1)); return; }
      if (input) {
        setStdinBuffer(prev => prev.slice(0, stdinCursor) + input + prev.slice(stdinCursor));
        setStdinCursor(c => c + input.length);
      }
      return;
    }

    if (key.shift && key.upArrow) { scrollLogs(-1); return; }
    if (key.shift && key.downArrow) { scrollLogs(1); return; }

    if (normalizedInput === '?') { setShowHelp((prev) => !prev); return; }
    if (shiftCombo('l') && lastCommandRef.current) { runProjectCommand(lastCommandRef.current.commandMeta, lastCommandRef.current.project); return; }

    if (mainView === 'tasks') {
      if (key.upArrow) { setActiveTaskId(prev => tasks[(tasks.findIndex(t => t.id === prev) - 1 + tasks.length) % tasks.length]?.id); return; }
      if (key.downArrow) { setActiveTaskId(prev => tasks[(tasks.findIndex(t => t.id === prev) + 1) % tasks.length]?.id); return; }
      if (key.return || shiftCombo('t')) { setMainView('navigator'); return; }
      return;
    }

    if (key.upArrow && !key.shift && projects.length > 0) { setSelectedIndex((prev) => (prev - 1 + projects.length) % projects.length); return; }
    if (key.downArrow && !key.shift && projects.length > 0) { setSelectedIndex((prev) => (prev + 1) % projects.length); return; }
    if (key.return) {
      if (!selectedProject) return;
      setViewMode((prev) => (prev === 'detail' ? 'list' : 'detail'));
      return;
    }
    if (shiftCombo('q')) { exit(); return; }
    if (shiftCombo('c') && viewMode === 'detail' && selectedProject) { setCustomMode(true); setCustomInput(''); setCustomCursor(0); return; }
    
    const actionKey = normalizedInput && ACTION_MAP[normalizedInput];
    if (actionKey) {
      const commandMeta = selectedProject?.commands?.[actionKey];
      runProjectCommand(commandMeta, selectedProject);
      return;
    }
    if (viewMode === 'detail' && normalizedInput && detailShortcutMap.has(normalizedInput)) {
      runProjectCommand(detailShortcutMap.get(normalizedInput), selectedProject);
    }
  });

  const projectCountLabel = `${projects.length} project${projects.length === 1 ? '' : 's'}`;

  if (mainView === 'studio') return create(Studio);

  if (mainView === 'tasks') {
    return create(
      Box,
      {flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', padding: 1},
      create(Text, {bold: true, color: 'yellow'}, '🛰️ Task Manager | Background Processes'),
      create(Text, {dimColor: true, marginBottom: 1}, 'Select a task to view its output logs.'),
      ...tasks.map(t => create(
        Box,
        {key: t.id, marginBottom: 0},
        create(Text, {color: t.id === activeTaskId ? 'cyan' : 'white', bold: t.id === activeTaskId}, `${t.id === activeTaskId ? '→' : ' '} [${t.status.toUpperCase()}] ${t.name}`)
      )),
      !tasks.length && create(Text, {dimColor: true}, 'No active or background tasks.'),
      create(Text, {marginTop: 1, dimColor: true}, 'Press Enter/Shift+T to return to Navigator, Up/Down to switch focus.')
    );
  }

  const projectRows = [];
  if (loading) projectRows.push(create(Text, {key: 'scanning', dimColor: true}, 'Scanning projects…'));
  if (error) projectRows.push(create(Text, {key: 'error', color: 'red'}, `Unable to scan: ${error}`));
  if (!loading && !error && projects.length === 0) projectRows.push(create(Text, {key: 'empty', dimColor: true}, 'No recognizable project manifests found.'));
  
  if (!loading) {
    projects.forEach((project, index) => {
      const isSelected = index === selectedIndex;
      const frameworkBadges = (project.frameworks || []).map((frame) => `${frame.icon} ${frame.name}`).join(', ');
      const hasMissingRuntime = project.missingBinaries && project.missingBinaries.length > 0;
      projectRows.push(
        create(
          Box,
          {key: project.id, flexDirection: 'column', marginBottom: 1, padding: 1},
          create(
            Box,
            {flexDirection: 'row'},
            create(Text, {color: isSelected ? 'cyan' : 'white', bold: isSelected}, `${project.icon} ${project.name}`),
            hasMissingRuntime && create(Text, {color: 'red', bold: true}, '  ⚠️ Runtime missing')
          ),
          create(Text, {dimColor: true}, `  ${project.type} · ${path.relative(rootPath, project.path) || '.'}`),
          frameworkBadges && create(Text, {dimColor: true}, `   ${frameworkBadges}`)
        )
      );
    });
  }

  const detailContent = [];
  if (viewMode === 'detail' && selectedProject) {
    detailContent.push(
      create(Box, {key: 'title-row', flexDirection: 'row'}, 
        create(Text, {color: 'cyan', bold: true}, `${selectedProject.icon} ${selectedProject.name}`),
        selectedProject.missingBinaries && selectedProject.missingBinaries.length > 0 && create(Text, {color: 'red', bold: true}, '  ⚠️ MISSING RUNTIME')
      ),
      create(Text, {key: 'manifest', dimColor: true}, `${selectedProject.type} · ${selectedProject.manifest || 'detected manifest'}`),
      create(Text, {key: 'loc', dimColor: true}, `Location: ${path.relative(rootPath, selectedProject.path) || '.'}`)
    );
    if (selectedProject.description) detailContent.push(create(Text, {key: 'desc'}, selectedProject.description));
    const frameworks = (selectedProject.frameworks || []).map((lib) => `${lib.icon} ${lib.name}`).join(', ');
    if (frameworks) detailContent.push(create(Text, {key: 'frames', dimColor: true}, `Frameworks: ${frameworks}`));
    
    if (selectedProject.missingBinaries && selectedProject.missingBinaries.length > 0) {
      detailContent.push(
        create(Text, {key: 'm-t', color: 'red', bold: true, marginTop: 1}, 'MISSING BINARIES:'),
        create(Text, {key: 'm-l', color: 'red'}, `Please install: ${selectedProject.missingBinaries.join(', ')}`)
      );
    }

    detailContent.push(create(Text, {key: 'cmd-header', bold: true, marginTop: 1}, 'Commands'));
    detailedIndexed.forEach((command) => {
      detailContent.push(
        create(Text, {key: `d-${command.shortcut}`}, `${command.shortcut}. ${command.label} ${command.source === 'custom' ? kleur.magenta('(custom)') : command.source === 'framework' ? kleur.cyan('(framework)') : ''}`),
        create(Text, {key: `dl-${command.shortcut}`, dimColor: true}, `   ↳ ${command.command.join(' ')}`)
      );
    });
    detailContent.push(create(Text, {key: 'h-l', dimColor: true, marginTop: 1}, 'Press Shift+C → label|cmd to save custom actions, Enter to close detail view.'));
  } else {
    detailContent.push(create(Text, {key: 'e-h', dimColor: true}, 'Press Enter on a project to reveal details.'));
  }

  if (customMode) {
    detailContent.push(create(Box, {key: 'ci-box', flexDirection: 'row'}, create(Text, {color: 'cyan'}, 'Type label|cmd (Enter: save, Esc: cancel): '), create(CursorText, {value: customInput, cursorIndex: customCursor})));
  }

  const artTileNodes = [
    {label: 'Pulse', detail: projectCountLabel, accent: 'magenta', icon: '●', subtext: `Workspace · ${path.basename(rootPath) || rootPath}`},
    {label: 'Focus', detail: selectedProject?.name || 'Selection', accent: 'cyan', icon: '◆', subtext: `${selectedProject?.type || 'Stack'}`},
    {label: 'Orbit', detail: `${tasks.length} active tasks`, accent: 'yellow', icon: '■', subtext: running ? 'Busy streaming...' : 'Idle'}
  ].map(tile => create(Box, {key: tile.label, flexDirection: 'column', padding: 1, marginRight: 1, borderStyle: 'single', borderColor: tile.accent, minWidth: 24},
    create(Text, {color: tile.accent, bold: true}, `${tile.icon} ${tile.label}`),
    create(Text, {bold: true}, tile.detail),
    create(Text, {dimColor: true}, tile.subtext)
  ));

  const artBoard = create(Box, {flexDirection: 'column', marginTop: 1, borderStyle: 'round', borderColor: 'gray', padding: 1},
    create(Box, {flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {color: 'magenta', bold: true}, 'Art-coded build atlas'), create(Text, {dimColor: true}, 'press ? for overlay help')),
    create(Box, {flexDirection: 'row', marginTop: 1}, ...ART_CHARS.map((char, i) => create(Text, {key: i, color: ART_COLORS[i % ART_COLORS.length]}, char.repeat(2)))),
    create(Box, {flexDirection: 'row', marginTop: 1}, ...artTileNodes)
  );

  const logs = activeTask?.logs || [];
  const logWindowStart = Math.max(0, logs.length - OUTPUT_WINDOW_SIZE - logOffset);
  const logWindowEnd = Math.max(0, logs.length - logOffset);
  const visibleLogs = logs.slice(logWindowStart, logWindowEnd);
  const logNodes = visibleLogs.length ? visibleLogs.map((line, i) => create(Text, {key: i}, line)) : [create(Text, {dimColor: true}, 'Select a task or run a command to see logs.')];

  const helpCards = [
    {label: 'Navigation', color: 'magenta', body: ['↑ / ↓ move focus, Enter: details', 'Shift+↑ / ↓ scroll output', 'Shift+H toggle help cards', 'Shift+D detach from task']},
    {label: 'Commands', color: 'cyan', body: ['B / T / R build/test/run', '1-9 run detail commands', 'Shift+L rerun last command', 'Shift+X clear / Shift+E export']},
    {label: 'Orbit & Studio', color: 'yellow', body: ['Shift+T task manager', 'Shift+A open Omni-Studio', 'Shift+C save custom action', 'Shift+Q quit application']}
  ];

  const toggleHint = showHelpCards ? 'Shift+H hide help' : 'Shift+H show help';
  return create(Box, {flexDirection: 'column', padding: 1},
    create(Box, {justifyContent: 'space-between'},
      create(Box, {flexDirection: 'column'}, create(Text, {color: 'magenta', bold: true}, 'Project Compass'), create(Text, {dimColor: true}, `${projectCountLabel} detected in ${rootPath}`)),
      create(Box, {flexDirection: 'column', alignItems: 'flex-end'}, create(Text, {color: running ? 'yellow' : 'green'}, activeTask ? `[${activeTask.status.toUpperCase()}] ${activeTask.name}` : 'Idle Navigator'), create(Text, {dimColor: true}, `${toggleHint}, Shift+T: Tasks, Shift+Q: Quit`))
    ),
    artBoard,
    create(Box, {marginTop: 1, flexDirection: 'row', alignItems: 'stretch', width: '100%', flexWrap: 'wrap'},
      create(Box, {flexGrow: 1, flexBasis: 0, minWidth: PROJECTS_MIN_WIDTH, marginRight: 1, borderStyle: 'round', borderColor: 'magenta', padding: 1}, create(Text, {bold: true, color: 'magenta'}, 'Projects'), create(Box, {flexDirection: 'column', marginTop: 1}, ...projectRows)),
      create(Box, {flexGrow: 1.3, flexBasis: 0, minWidth: DETAILS_MIN_WIDTH, borderStyle: 'round', borderColor: 'cyan', padding: 1, flexDirection: 'column'}, create(Text, {bold: true, color: 'cyan'}, 'Details'), ...detailContent)
    ),
    create(Box, {marginTop: 1, flexDirection: 'column'},
      create(Box, {flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {bold: true, color: 'yellow'}, `Output: ${activeTask?.name || 'None'}`), create(Text, {dimColor: true}, logOffset ? `Scrolled ${logOffset} lines` : 'Live log view')),
      create(Box, {flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', padding: 1, minHeight: OUTPUT_WINDOW_HEIGHT, maxHeight: OUTPUT_WINDOW_HEIGHT, height: OUTPUT_WINDOW_HEIGHT, overflow: 'hidden'}, ...logNodes),
      create(Box, {marginTop: 1, flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {dimColor: true}, running ? 'Type to feed stdin; Enter: submit, Ctrl+C: abort.' : 'Run a command or press Shift+T to switch tasks.'), create(Text, {dimColor: true}, `${toggleHint}, Shift+S: Structure Guide`)),
      create(Box, {marginTop: 1, flexDirection: 'row', borderStyle: 'round', borderColor: running ? 'green' : 'gray', paddingX: 1}, create(Text, {bold: true, color: running ? 'green' : 'white'}, running ? ' Stdin buffer ' : ' Input ready '), create(Box, {marginLeft: 1}, create(CursorText, {value: stdinBuffer || (running ? '' : 'Start a command to feed stdin'), cursorIndex: stdinCursor, active: running})))
    ),
    showHelpCards && create(Box, {marginTop: 1, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'}, ...helpCards.map((card, idx) => create(Box, {key: card.label, flexGrow: 1, flexBasis: 0, minWidth: HELP_CARD_MIN_WIDTH, marginRight: idx < 2 ? 1 : 0, marginBottom: 1, borderStyle: 'round', borderColor: card.color, padding: 1, flexDirection: 'column'}, create(Text, {color: card.color, bold: true, marginBottom: 1}, card.label), ...card.body.map((line, lidx) => create(Text, {key: lidx, dimColor: card.color === 'yellow'}, line))))),
    showStructureGuide && create(Box, {flexDirection: 'column', borderStyle: 'round', borderColor: 'blue', marginTop: 1, padding: 1}, create(Text, {color: 'cyan', bold: true}, 'Structure guide · press Shift+S to hide'), ...SCHEMA_GUIDE.map(e => create(Text, {key: e.type, dimColor: true}, `• ${e.icon} ${e.label}: ${e.files.join(', ')}`))),
    showHelp && create(Box, {flexDirection: 'column', borderStyle: 'double', borderColor: 'cyan', marginTop: 1, padding: 1}, create(Text, {color: 'cyan', bold: true}, 'Help overlay'), create(Text, null, 'Shift+↑/↓ scrolls logs; Shift+X clears; Shift+E exports; Shift+A Studio; Shift+T Tasks; Shift+D Detach.'))
  );
}


function parseArgs() {
  const args = {};
  const tokens = process.argv.slice(2);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if ((token === '--dir' || token === '--path') && tokens[i + 1]) { args.root = tokens[i + 1]; i += 1; }
    else if (token === '--mode' && tokens[i + 1]) { args.mode = tokens[i + 1]; i += 1; }
    else if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--studio') args.view = 'studio';
  }
  return args;
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log(kleur.cyan('Project Compass · Ink project navigator/runner'));
    console.log('');
    console.log(kleur.bold('Usage:'));
    console.log('  project-compass [--dir <path>] [--studio]');
    console.log('');
    console.log(kleur.bold('Arguments:'));
    console.log('  --dir, --path <path>  Specify root workspace directory to scan');
    console.log('  --studio              Launch directly into Omni-Studio mode');
    console.log('  --help, -h            Show this help menu');
    console.log('');
    console.log(kleur.bold('Core Keybinds:'));
    console.log('  ↑ / ↓                 Move project focus');
    console.log('  Enter                 Toggle detail view for selected project');
    console.log('  Shift+A               Switch to Omni-Studio (Environment Health)');
    console.log('  Shift+T               Open Orbit Task Manager (Manage background processes)');
    console.log('  Shift+D               Detach from active task (Keep it running in background)');
    console.log('  Shift+X               Clear active task output log');
    console.log('  Shift+E               Export current logs to a .txt file');
    console.log('  Shift+↑ / ↓           Scroll the output logs');
    console.log('  Shift+Q               Quit application');
    console.log('');
    console.log(kleur.bold('Execution shortcuts:'));
    console.log('  B / T / R             Quick run: Build / Test / Run');
    console.log('  1-9                   Run numbered commands in detail view');
    console.log('  Shift+L               Rerun the last executed command');
    console.log('  Shift+C               Add a custom command (in detail view)');
    console.log('');
    console.log(kleur.dim('Documentation: https://github.com/CrimsonDevil333333/project-compass'));
    return;
  }
  const rootPath = args.root ? path.resolve(args.root) : process.cwd();
  if (args.mode === 'test') {
    const projects = await discoverProjects(rootPath);
    console.log(`Detected ${projects.length} project(s) under ${rootPath}`);
    projects.forEach((project) => { console.log(` • [${project.type}] ${project.name} (${project.path})`); });
    return;
  }

  render(create(Compass, {rootPath, initialView: args.view || 'navigator'}));
}

main().catch((error) => { console.error(error); process.exit(1); });
