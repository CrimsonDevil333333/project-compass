#!/usr/bin/env node
import React, {useCallback, useEffect, useMemo, useRef, useState, memo} from 'react';
import {render, Box, Text, useApp, useInput} from 'ink';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs';
import kleur from 'kleur';
import {execa} from 'execa';
import {discoverProjects, SCHEMA_GUIDE} from './projectDetection.js';
import {CONFIG_PATH, ensureConfigDir} from './configPaths.js';

// Modular Components
import Studio from './components/Studio.js';
import TaskManager from './components/TaskManager.js';
import PackageRegistry from './components/PackageRegistry.js';
import ProjectArchitect from './components/ProjectArchitect.js';

const create = React.createElement;
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
        customCommands: {},
        showArtBoard: true,
        showHelpCards: false,
        showStructureGuide: false,
        ...parsed,
      };
    }
  } catch (error) {
    console.error(`Ignoring corrupt config: ${error.message}`);
  }
  return {customCommands: {}, showArtBoard: true, showHelpCards: false, showStructureGuide: false};
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
  if (!project) return [];
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

const OutputPanel = memo(({activeTask, logOffset}) => {
  const logs = activeTask?.logs || [];
  const logWindowStart = Math.max(0, logs.length - OUTPUT_WINDOW_SIZE - logOffset);
  const logWindowEnd = Math.max(0, logs.length - logOffset);
  const visibleLogs = logs.slice(logWindowStart, logWindowEnd);
  
  const logNodes = visibleLogs.length 
    ? visibleLogs.map((line, i) => create(Text, {key: i}, line)) 
    : [create(Text, {key: 'empty', dimColor: true}, 'Select a task or run a command to see logs.')];

  return create(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'yellow',
      padding: 1,
      minHeight: OUTPUT_WINDOW_HEIGHT,
      maxHeight: OUTPUT_WINDOW_HEIGHT,
      height: OUTPUT_WINDOW_HEIGHT,
      overflow: 'hidden'
    },
    ...logNodes
  );
});

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
  const [renameMode, setRenameMode] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renameCursor, setRenameCursor] = useState(0);
  const [quitConfirm, setQuitConfirm] = useState(false);
  const [config, setConfig] = useState(() => loadConfig());
  const [stdinBuffer, setStdinBuffer] = useState('');
  const [stdinCursor, setStdinCursor] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const runningProcessMap = useRef(new Map());
  const lastCommandRef = useRef(null);

  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId]);
  const running = activeTask?.status === 'running';
  const hasRunningTasks = useMemo(() => tasks.some(t => t.status === 'running'), [tasks]);
  const selectedProject = useMemo(() => projects[selectedIndex] || null, [projects, selectedIndex]);

  const addLogToTask = useCallback((taskId, line) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === taskId);
      if (idx === -1) return prev;
      const t = prev[idx];
      const normalized = typeof line === 'string' ? line : JSON.stringify(line);
      const newLines = normalized.split(/\r?\n/).filter(l => l.trim().length > 0);
      const nextLogs = [...t.logs, ...newLines];
      const updatedTask = { ...t, logs: nextLogs.length > 500 ? nextLogs.slice(-500) : nextLogs };
      const nextTasks = [...prev];
      nextTasks[idx] = updatedTask;
      return nextTasks;
    });
  }, []);

  const detailedIndexed = useMemo(() => buildDetailCommands(selectedProject, config).map((command, index) => {
    const isOver9 = index >= 9;
    const shortcut = isOver9 ? `S+${String.fromCharCode(65 + index - 9)}` : `${index + 1}`;
    return { ...command, shortcut };
  }), [selectedProject, config]);

  const detailShortcutMap = useMemo(() => {
    const map = new Map();
    detailedIndexed.forEach((cmd) => {
      if (cmd.shortcut.startsWith('S+')) {
        map.set(cmd.shortcut.slice(2).toLowerCase(), cmd);
      } else {
        map.set(cmd.shortcut, cmd);
      }
    });
    return map;
  }, [detailedIndexed]);

  const handleKillTask = useCallback((taskId) => {
    const proc = runningProcessMap.current.get(taskId);
    if (proc) {
      addLogToTask(taskId, kleur.yellow('! Triggering emergency kill sequence...'));
      try {
        if (process.platform === 'win32') {
          execa('taskkill', ['/pid', proc.pid, '/f', '/t']);
        } else if (proc.pid) {
          process.kill(-proc.pid, 'SIGKILL');
        } else {
          proc.kill('SIGKILL');
        }
      } catch (e) {
        addLogToTask(taskId, kleur.red(`✗ Kill failed: ${e.message}`));
      }
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (activeTaskId === taskId) setActiveTaskId(null);
    }
  }, [activeTaskId, addLogToTask]);

  const killAllTasks = useCallback(() => {
    runningProcessMap.current.forEach((proc, tid) => {
      handleKillTask(tid);
    });
    runningProcessMap.current.clear();
  }, [handleKillTask]);

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
        stdin: 'pipe',
        detached: process.platform !== 'win32',
        cleanup: true
      });
      runningProcessMap.current.set(taskId, subprocess);

      subprocess.stdout?.on('data', (chunk) => addLogToTask(taskId, chunk.toString()));
      subprocess.stderr?.on('data', (chunk) => addLogToTask(taskId, kleur.red(chunk.toString())));

      await subprocess;
      setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: 'finished'} : t));
      addLogToTask(taskId, kleur.green(`✓ ${commandLabel} finished`));
    } catch (error) {
      if (error.isCanceled || error.killed || error.signal === 'SIGKILL' || error.signal === 'SIGINT') {
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: 'killed'} : t));
        addLogToTask(taskId, kleur.yellow(`! Task killed forcefully`));
      } else {
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: 'failed'} : t));
        addLogToTask(taskId, kleur.red(`✗ ${commandLabel} failed: ${error.shortMessage || error.message}`));
      }
    } finally {
      runningProcessMap.current.delete(taskId);
    }
  }, [addLogToTask, selectedProject]);

  const exportLogs = useCallback(() => {
    const taskToExport = tasks.find(t => t.id === activeTaskId);
    if (!taskToExport || !taskToExport.logs.length) return;
    try {
      const exportPath = path.resolve(process.cwd(), `compass-${taskToExport.id}.txt`);
      fs.writeFileSync(exportPath, taskToExport.logs.join('\n'));
      addLogToTask(activeTaskId, kleur.green(`✓ Logs exported to ${exportPath}`));
    } catch {
      addLogToTask(activeTaskId, kleur.red('✗ Export failed'));
    }
  }, [tasks, activeTaskId, addLogToTask]);

    useInput((input, key) => {
    if (quitConfirm) {
      if (input?.toLowerCase() === 'y') { killAllTasks(); exit(); return; }
      if (input?.toLowerCase() === 'n' || key.escape) { setQuitConfirm(false); return; }
      return;
    }

    const isCtrlC = (key.ctrl && input === 'c') || input === '\u0003';

    if (customMode) {
      if (key.return) {
        const raw = customInput.trim();
        const selProj = selectedProject;
        if (selProj && raw) {
          const [labelPart, commandPart] = raw.split('|');
          const commandTokens = (commandPart || labelPart).trim().split(/\s+/).filter(Boolean);
          if (commandTokens.length) {
            const label = commandPart ? labelPart.trim() : `Custom ${selProj.name}`;
            setConfig((prev) => {
              const projectKey = selProj.path;
              const existing = prev.customCommands?.[projectKey] || [];
              const nextConfig = { ...prev, customCommands: { ...prev.customCommands, [projectKey]: [...existing, {label, command: commandTokens}] } };
              saveConfig(nextConfig);
              return nextConfig;
            });
          }
        }
        setCustomMode(false); setCustomInput(''); setCustomCursor(0);
        return;
      }
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

    if (renameMode) {
      if (key.return) {
        setTasks(prev => prev.map(t => t.id === activeTaskId ? {...t, name: renameInput} : t));
        setRenameMode(false); setRenameInput(''); setRenameCursor(0);
        return;
      }
      if (key.escape) { setRenameMode(false); setRenameInput(''); setRenameCursor(0); return; }
      if (key.backspace || key.delete) {
        if (renameCursor > 0) {
          setRenameInput((prev) => prev.slice(0, renameCursor - 1) + prev.slice(renameCursor));
          setRenameCursor(c => Math.max(0, c - 1));
        }
        return;
      }
      if (key.leftArrow) { setRenameCursor(c => Math.max(0, c - 1)); return; }
      if (key.rightArrow) { setRenameCursor(c => Math.min(renameInput.length, c + 1)); return; }
      if (input) {
        setRenameInput((prev) => prev.slice(0, renameCursor) + input + prev.slice(renameCursor));
        setRenameCursor(c => c + input.length);
      }
      return;
    }

    const normalizedInput = input?.toLowerCase();
    const shiftCombo = (char) => key.shift && normalizedInput === char;

    const clearAndSwitch = (view) => {
      console.clear();
      setMainView(view);
      setViewMode('list');
      setShowHelp(false);
    };
    
    if (shiftCombo('h')) { console.clear(); setConfig(prev => { const next = {...prev, showHelpCards: !prev.showHelpCards}; saveConfig(next); return next; }); return; }
    if (shiftCombo('s')) { console.clear(); setConfig(prev => { const next = {...prev, showStructureGuide: !prev.showStructureGuide}; saveConfig(next); return next; }); return; }
    if (shiftCombo('a')) { clearAndSwitch(mainView === 'navigator' ? 'studio' : 'navigator'); return; }
    if (shiftCombo('p')) { clearAndSwitch(mainView === 'navigator' ? 'registry' : 'navigator'); return; }
    if (shiftCombo('n')) { clearAndSwitch(mainView === 'navigator' ? 'architect' : 'navigator'); return; }
    if (shiftCombo('x')) { console.clear(); setTasks(prev => prev.map(t => t.id === activeTaskId ? {...t, logs: []} : t)); setLogOffset(0); return; }
    if (shiftCombo('e')) { exportLogs(); return; }
    if (shiftCombo('d')) { console.clear(); setActiveTaskId(null); return; }
    if (shiftCombo('b')) { console.clear(); setConfig(prev => { const next = {...prev, showArtBoard: !prev.showArtBoard}; saveConfig(next); return next; }); return; }
    
    if (shiftCombo('t')) { 
      setMainView((prev) => {
        console.clear();
        if (prev === 'tasks') return 'navigator';
        if (tasks.length > 0 && !activeTaskId) setActiveTaskId(tasks[0].id);
        return 'tasks';
      });
      setViewMode('list');
      setShowHelp(false);
      return; 
    }
    
    if (key.escape) {
      if (mainView !== 'navigator') {
        clearAndSwitch('navigator');
        return;
      }
    }

    const scrollLogs = (delta) => {
      setLogOffset((prev) => {
        const logs = activeTask?.logs || [];
        const maxScroll = Math.max(0, logs.length - OUTPUT_WINDOW_SIZE);
        return Math.max(0, Math.min(maxScroll, prev + delta));
      });
    };

    if (mainView === 'tasks') {
      if (tasks.length > 0) {
        if (key.upArrow) { setActiveTaskId(prev => tasks[(tasks.findIndex(t => t.id === prev) - 1 + tasks.length) % tasks.length]?.id); return; }
        if (key.downArrow) { setActiveTaskId(prev => tasks[(tasks.findIndex(t => t.id === prev) + 1) % tasks.length]?.id); return; }
        if (shiftCombo('k') && activeTaskId) { handleKillTask(activeTaskId); return; }
        if (shiftCombo('r') && activeTaskId) { setRenameMode(true); setRenameInput(activeTask.name); setRenameCursor(activeTask.name.length); return; }
        if (isCtrlC) { handleKillTask(activeTaskId); return; }
      }
      if (key.return) { setMainView('navigator'); return; }
      return;
    }

    if (mainView === 'registry' || mainView === 'architect') {
      return;
    }

    if (running && activeTaskId && runningProcessMap.current.has(activeTaskId)) {
      if (isCtrlC) { handleKillTask(activeTaskId); setStdinBuffer(''); setStdinCursor(0); return; }
      if (key.return) {
        const proc = runningProcessMap.current.get(activeTaskId);
        proc?.stdin?.write(stdinBuffer + '\n'); setStdinBuffer(''); setStdinCursor(0); return;
      }
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

    if (key.shift && key.upArrow) { scrollLogs(1); return; }
    if (key.shift && key.downArrow) { scrollLogs(-1); return; }

    if (normalizedInput === '?') { console.clear(); setShowHelp((prev) => !prev); return; }
    if (shiftCombo('l') && lastCommandRef.current) { runProjectCommand(lastCommandRef.current.commandMeta, lastCommandRef.current.project); return; }

    if (key.upArrow && !key.shift && projects.length > 0) { console.clear(); setSelectedIndex((prev) => (prev - 1 + projects.length) % projects.length); return; }
    if (key.downArrow && !key.shift && projects.length > 0) { console.clear(); setSelectedIndex((prev) => (prev + 1) % projects.length); return; }
    if (key.return) {
      if (!selectedProject) return;
      console.clear();
      setViewMode((prev) => (prev === 'detail' ? 'list' : 'detail'));
      return;
    }
    if (shiftCombo('q') || isCtrlC) {
      if (hasRunningTasks) setQuitConfirm(true); else exit();
      return;
    }
    if (shiftCombo('c') && viewMode === 'detail' && selectedProject) { setCustomMode(true); setCustomInput(''); setCustomCursor(0); return; }
    
    const actionKey = normalizedInput && ACTION_MAP[normalizedInput];
    if (actionKey) {
      const commandMeta = selectedProject?.commands?.[actionKey];
      runProjectCommand(commandMeta, selectedProject);
      return;
    }
    if (viewMode === 'detail' && normalizedInput && detailShortcutMap.has(normalizedInput)) {
      if (!isNaN(parseInt(normalizedInput))) {
        runProjectCommand(detailShortcutMap.get(normalizedInput), selectedProject);
        return;
      }
      const reserved = ['a', 'p', 'n', 'x', 'e', 'd', 'b', 't', 'q', 'h', 's', 'l', 'c'];
      if (key.shift && !reserved.includes(normalizedInput)) {
        runProjectCommand(detailShortcutMap.get(normalizedInput), selectedProject);
        return;
      }
    }
  });

  const projectCountLabel = useMemo(() => `${projects.length} project${projects.length === 1 ? '' : 's'}`, [projects.length]);
  const toggleHint = config.showHelpCards ? 'Shift+H hide help' : 'Shift+H show help';
  const statusHint = activeTask ? `[${activeTask.status.toUpperCase()}] ${activeTask.name}` : 'Idle Navigator';
  const orbitHint = mainView === 'tasks' ? 'Tasks View' : `Orbit: ${tasks.length} tasks`;
  const artHint = config.showArtBoard ? 'Shift+B hide art' : 'Shift+B show art';

  const projectRows = useMemo(() => {
    if (loading) return [create(Text, {key: 'scanning', dimColor: true}, 'Scanning projects…')];
    if (error) return [create(Text, {key: 'error', color: 'red'}, `Unable to scan: ${error}`)];
    if (projects.length === 0) return [create(Text, {key: 'empty', dimColor: true}, 'No recognizable project manifests found.')];
    
    return projects.map((project, index) => {
      const isSelected = index === selectedIndex;
      const frameworkBadges = (project.frameworks || []).map((frame) => `${frame.icon} ${frame.name}`).join(', ');
      const hasMissingRuntime = project.missingBinaries && project.missingBinaries.length > 0;
      return create(
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
      );
    });
  }, [loading, error, projects, selectedIndex, rootPath]);

  const detailContent = useMemo(() => {
    if (viewMode !== 'detail' || !selectedProject) {
      return [create(Text, {key: 'e-h', dimColor: true}, 'Press Enter on a project to reveal details.')];
    }
    
    const content = [
      create(Box, {key: 'title-row', flexDirection: 'row'}, 
        create(Text, {color: 'cyan', bold: true}, `${selectedProject.icon} ${selectedProject.name}`),
        selectedProject.missingBinaries && selectedProject.missingBinaries.length > 0 && create(Text, {color: 'red', bold: true}, '  ⚠️ MISSING RUNTIME')
      ),
      create(Text, {key: 'manifest', dimColor: true}, `${selectedProject.type} · ${selectedProject.manifest || 'detected manifest'}`),
      create(Text, {key: 'loc', dimColor: true}, `Location: ${path.relative(rootPath, selectedProject.path) || '.'}`)
    ];
    if (selectedProject.description) content.push(create(Text, {key: 'desc'}, selectedProject.description));
    const frameworks = (selectedProject.frameworks || []).map((lib) => `${lib.icon} ${lib.name}`).join(', ');
    if (frameworks) content.push(create(Text, {key: 'frames', dimColor: true}, `Frameworks: ${frameworks}`));
    
    if (selectedProject.missingBinaries && selectedProject.missingBinaries.length > 0) {
      content.push(
        create(Text, {key: 'm-t', color: 'red', bold: true, marginTop: 1}, 'MISSING BINARIES:'),
        create(Text, {key: 'm-l', color: 'red'}, `Please install: ${selectedProject.missingBinaries.join(', ')}`)
      );
    }

    content.push(create(Text, {key: 'cmd-header', bold: true, marginTop: 1}, 'Commands'));
    detailedIndexed.forEach((command) => {
      content.push(
        create(Text, {key: `d-${command.shortcut}`}, `${command.shortcut}. ${command.label} ${command.source === 'custom' ? kleur.magenta('(custom)') : command.source === 'framework' ? kleur.cyan('(framework)') : ''}`),
        create(Text, {key: `dl-${command.shortcut}`, dimColor: true}, `   ↳ ${command.command.join(' ')}`)
      );
    });
    content.push(create(Text, {key: 'h-l', dimColor: true, marginTop: 1}, 'Press Shift+C → label|cmd to save custom actions, Enter to close detail view.'));
    return content;
  }, [viewMode, selectedProject, rootPath, detailedIndexed]);

  const artTileNodes = useMemo(() => [
    {label: 'Pulse', detail: projectCountLabel, accent: 'magenta', icon: '●', subtext: `Workspace · ${path.basename(rootPath) || rootPath}`},
    {label: 'Focus', detail: selectedProject?.name || 'Selection', accent: 'cyan', icon: '◆', subtext: `${selectedProject?.type || 'Stack'}`},
    {label: 'Orbit', detail: `${tasks.length} tasks`, accent: 'yellow', icon: '■', subtext: running ? 'Busy streaming...' : 'Idle'}
  ].map(tile => create(Box, {key: tile.label, flexDirection: 'column', padding: 1, marginRight: 1, borderStyle: 'single', borderColor: tile.accent, minWidth: 24},
    create(Text, {color: tile.accent, bold: true}, `${tile.icon} ${tile.label}`),
    create(Text, {bold: true}, tile.detail),
    create(Text, {dimColor: true}, tile.subtext)
  )), [projectCountLabel, rootPath, selectedProject, tasks.length, running]);

  if (quitConfirm) {
    return create(Box, {flexDirection: 'column', borderStyle: 'round', borderColor: 'red', padding: 1}, create(Text, {bold: true, color: 'red'}, '⚠️ Confirm Exit'), create(Text, null, `There are ${tasks.filter(t=>t.status==='running').length} tasks still running in the background.`), create(Text, null, 'Are you sure you want to quit and stop all processes?'), create(Text, {marginTop: 1}, kleur.bold('Y') + ' to Quit, ' + kleur.bold('N') + ' to Cancel'));
  }

  const renderView = () => {
    switch (mainView) {
      case 'studio': return create(Studio);
      case 'tasks': return create(TaskManager, {tasks, activeTaskId, renameMode, renameInput, renameCursor, CursorText});
      case 'registry': return create(PackageRegistry, {selectedProject, projects, onRunCommand: runProjectCommand, CursorText, onSelectProject: (idx) => setSelectedIndex(idx)});
      case 'architect': return create(ProjectArchitect, {rootPath, onRunCommand: runProjectCommand, CursorText, onReturn: () => setMainView('navigator')});
      default: {
        const navigatorBody = [
          create(Box, {key: 'header', justifyContent: 'space-between'},
            create(Box, {flexDirection: 'column'}, create(Text, {color: 'magenta', bold: true}, 'Project Compass'), create(Text, {dimColor: true}, `${projectCountLabel} detected in ${rootPath}`)),
            create(Box, {flexDirection: 'column', alignItems: 'flex-end'}, 
              create(Text, {color: running ? 'yellow' : 'green'}, statusHint), 
              create(Text, {dimColor: true}, `${toggleHint} · ${orbitHint} · ${artHint} · Shift+Q: Quit`)
            )
          ),
          config.showArtBoard && create(Box, {key: 'artboard', flexDirection: 'column', marginTop: 1, borderStyle: 'round', borderColor: 'gray', padding: 1},
            create(Box, {flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {color: 'magenta', bold: true}, 'Art-coded build atlas'), create(Text, {dimColor: true}, 'press ? for overlay help')),
            create(Box, {flexDirection: 'row', marginTop: 1}, ...ART_CHARS.map((char, i) => create(Text, {key: i, color: ART_COLORS[i % ART_COLORS.length]}, char.repeat(2)))),
            create(Box, {flexDirection: 'row', marginTop: 1}, ...artTileNodes)
          ),
          create(Box, {key: 'projects-row', marginTop: 1, flexDirection: 'row', alignItems: 'stretch', width: '100%', flexWrap: 'wrap'},
            create(Box, {flexGrow: 1, flexBasis: 0, minWidth: PROJECTS_MIN_WIDTH, marginRight: 1, borderStyle: 'round', borderColor: 'magenta', padding: 1}, create(Text, {bold: true, color: 'magenta'}, 'Projects'), create(Box, {flexDirection: 'column', marginTop: 1}, ...projectRows)),
            create(Box, {flexGrow: 1.3, flexBasis: 0, minWidth: DETAILS_MIN_WIDTH, borderStyle: 'round', borderColor: 'cyan', padding: 1, flexDirection: 'column'}, create(Text, {bold: true, color: 'cyan'}, 'Details'), ...detailContent)
          ),
          create(Box, {key: 'output-row', marginTop: 1, flexDirection: 'column'},
            create(Box, {flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {bold: true, color: 'yellow'}, `Output: ${activeTask?.name || 'None'}`), create(Text, {dimColor: true}, logOffset ? `Scrolled ${logOffset} lines` : 'Live log view')),
            create(OutputPanel, {activeTask, logOffset}),
            create(Box, {marginTop: 1, flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {dimColor: true}, running ? 'Type to feed stdin; Enter: submit.' : 'Run a command or press Shift+T to switch tasks.'), create(Text, {dimColor: true}, `${toggleHint}, Shift+S: Structure Guide`)),
            create(Box, {marginTop: 1, flexDirection: 'row', borderStyle: 'round', borderColor: running ? 'green' : 'gray', paddingX: 1}, create(Text, {bold: true, color: running ? 'green' : 'white'}, running ? ' Stdin buffer ' : ' Input ready '), create(Box, {marginLeft: 1}, create(CursorText, {value: stdinBuffer || (running ? '' : 'Start a command to feed stdin'), cursorIndex: stdinCursor, active: running})))
          ),
          config.showHelpCards && create(Box, {key: 'help-cards', marginTop: 1, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'}, [
            {label: 'Navigation', color: 'magenta', body: ['↑ / ↓ move focus, Enter: details', 'Shift+↑ / ↓ scroll output', 'Shift+H toggle help cards', 'Shift+D detach from task']},
            {label: 'Management', color: 'cyan', body: ['Shift+P Package Registry', 'Shift+N Project Architect', 'Shift+X clear / Shift+E export']},
            {label: 'Orbit & Studio', color: 'yellow', body: ['Shift+T task manager', 'Shift+A studio / Shift+B art board', 'Shift+S structure / Shift+Q quit']}
          ].map((card, idx) => create(Box, {key: card.label, flexGrow: 1, flexBasis: 0, minWidth: HELP_CARD_MIN_WIDTH, marginRight: idx < 2 ? 1 : 0, marginBottom: 1, borderStyle: 'round', borderColor: card.color, padding: 1, flexDirection: 'column'}, create(Text, {color: card.color, bold: true, marginBottom: 1}, card.label), ...card.body.map((line, lidx) => create(Text, {key: lidx, dimColor: card.color === 'yellow'}, line))))),
          config.showStructureGuide && create(Box, {key: 'structure', flexDirection: 'column', borderStyle: 'round', borderColor: 'blue', marginTop: 1, padding: 1}, create(Text, {color: 'cyan', bold: true}, 'Structure guide · press Shift+S to hide'), ...SCHEMA_GUIDE.map(e => create(Text, {key: e.type, dimColor: true}, `• ${e.icon} ${e.label}: ${e.files.join(', ')}`))),
          showHelp && create(Box, {key: 'overlay', flexDirection: 'column', borderStyle: 'double', borderColor: 'cyan', marginTop: 1, padding: 1}, create(Text, {color: 'cyan', bold: true}, 'Help overlay'), create(Text, null, 'Shift+↑/↓ scrolls logs; Shift+X clears; Shift+E exports; Shift+A Studio; Shift+T Tasks; Shift+D Detach; Shift+B Toggle Art Board; Shift+P Packages; Shift+N Creator.'))
        ];
        return create(Box, {flexDirection: 'column'}, ...navigatorBody);
      }
    }
  };

  return create(Box, {flexDirection: 'column', padding: 1, width: '100%'}, renderView());
}


function parseArgs() {
  const args = {};
  const tokens = process.argv.slice(2);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if ((token === '--dir' || token === '--path') && tokens[i + 1]) { args.root = tokens[i + 1]; i += 1; }
    else if (token === '--mode' && tokens[i + 1]) { args.mode = tokens[i + 1]; i += 1; }
    else if (token === '--help' || token === '-h') args.help = true;
    else if (token === '--version' || token === '-v') args.version = true;
    else if (token === '--studio') args.view = 'studio';
  }
  return args;
}

async function main() {
  const args = parseArgs();
  if (args.version) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
    console.log(`v${pkg.version}`);
    return;
  }
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
    console.log('  Shift+P               Open Package Registry (Add/Remove packages)');
    console.log('  Shift+N               Open Project Architect (Scaffold new projects)');
    console.log('  Shift+D               Detach from active task (Keep it running in background)');
    console.log('  Shift+B               Toggle Art Board visibility');
    console.log('  Shift+H               Toggle Help Cards visibility');
    console.log('  Shift+S               Toggle Structure Guide visibility');
    console.log('  Shift+X               Clear active task output log');
    console.log('  Shift+E               Export current logs to a .txt file');
    console.log('  Shift+↑ / ↓           Scroll the output logs');
    console.log('  Shift+Q               Quit application (with confirmation if tasks run)');
    console.log('');
    console.log(kleur.bold('Task Manager (Shift+T):'));
    console.log('  Shift+K               Kill active/selected task');
    console.log('  Shift+R               Rename selected task');
    console.log('');
    console.log(kleur.bold('Execution shortcuts:'));
    console.log('  B / T / R             Quick run: Build / Test / Run');
    console.log('  1-9 / S+A-Z           Run numbered commands in detail view');
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
