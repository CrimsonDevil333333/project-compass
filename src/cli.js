#!/usr/bin/env node
import React, {useCallback, useEffect, useMemo, useRef, useState, memo} from 'react';
import {render, Box, Text, useApp, useInput} from 'ink';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs';
import kleur from 'kleur';
import {execa} from 'execa';
import {discoverProjects, SCHEMA_GUIDE} from './projectDetection.js';
import {parseShellWords, peekScriptCommand} from './detectors/utils.js';
import {CONFIG_PATH, ensureConfigDir, loadConfig, saveConfig} from './configPaths.js';

import { orchestrator } from './core/Orchestrator.js';
import { startServer, setupSystemdService } from './server.js';
import { startMcpServer } from './mcp.js';


// Modular Components
import Studio from './components/Studio.js';
import TaskManager from './components/TaskManager.js';
import PackageRegistry from './components/PackageRegistry.js';
import ProjectArchitect from './components/ProjectArchitect.js';
import AIHorizon from './components/AIHorizon.js';
import Navigator from './components/Navigator.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import {getAddCmd, getRemoveCmd} from './packageCommands.js';

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
  r: 'run',
  i: 'install'
};
const COMMAND_FALLBACKS = {
  build: ['compile', 'dist', 'bundle', 'package'],
  test: ['check', 'spec', 'unit', 'coverage'],
  run: ['start', 'serve', 'dev'],
  install: ['setup', 'bootstrap', 'fetch']
};


function useScanner(rootPath, initialDepth = 7) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const performScan = async () => {
      setLoading(true);
      try {
        const found = await orchestrator.scan(rootPath, initialDepth);
        if (isMounted) setProjects(found);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    performScan();
    
    const handleUpdate = (updatedProjects) => {
      if (isMounted) setProjects([...updatedProjects]);
    };
    
    orchestrator.on('scan_complete', handleUpdate);
    return () => {
      isMounted = false;
      orchestrator.off('scan_complete', handleUpdate);
    };
  }, [rootPath, initialDepth]);

  return {projects, loading, error, refresh: () => orchestrator.scan(rootPath, initialDepth)};
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

  const borderColor = !activeTask ? 'gray' : 
                    activeTask.status === 'running' ? 'yellow' : 
                    activeTask.status === 'finished' ? 'green' : 'red';

  return create(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor,
      padding: 1,
      minHeight: OUTPUT_WINDOW_HEIGHT,
      maxHeight: OUTPUT_WINDOW_HEIGHT,
      height: OUTPUT_WINDOW_HEIGHT,
      overflow: 'hidden'
    },
    ...logNodes,
    logOffset > 0 && create(
      Box,
      { position: 'absolute', right: 2, top: 0 },
      create(Text, { backgroundColor: 'white', color: 'black' }, ` ↑ SCROLLED ${logOffset} `)
    )
  );
});


const Splash = () => {
  const [frame, setFrame] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setFrame(f => f + 1), 100);
    return () => clearInterval(timer);
  }, []);

  const logo = `
   ▄████████  ▄██████▄   ▄▄▄▄███▄▄▄▄      ▀█████████▄   ▄████████    ▄████████    ▄████████ 
  ███    ███ ███    ███ ▄██▀▀▀███▀▀▀██▄     ███    ███ ███    ███   ███    ███   ███    ███ 
  ███    █▀  ███    ███ ███   ███   ███     ███    ███ ███    █▀    ███    █▀    ███    █▀  
  ███        ███    ███ ███   ███   ███    ▄███▄▄▄██▀  ███         ▄███▄▄▄       ███        
▀███████████ ███    ███ ███   ███   ███   ▀▀███▀▀▀██▄  ███        ▀▀███▀▀▀     ▀███████████ 
         ███ ███    ███ ███   ███   ███     ███    ██▄ ███    █▄    ███    █▄           ███ 
   ▄█    ███ ███    ███ ███   ███   ███     ███    ███ ███    ███   ███    ███    ▄█    ███ 
 ▄████████▀   ▀██████▀   ▀█   ███   █▀    ▄█████████▀  ████████▀    ██████████  ▄████████▀  
  `;

  return create(
    Box,
    {flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%'},
    create(Text, {color: 'magenta', bold: true}, logo),
    create(Box, {marginTop: 2},
      create(Text, {color: 'cyan'}, 'Initializing high-fidelity systems'),
      create(Text, null, '.'.repeat((frame % 4)))
    ),
    create(Text, {dimColor: true, marginTop: 1}, 'Version 4.5.0 · Production Grade')
  );
};


function Compass({rootPath, initialView = 'navigator', scanDepth = 7}) {
  const {exit} = useApp();
  const {projects, loading, error} = useScanner(rootPath, scanDepth);
  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [mainView, setMainView] = useState(initialView);
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [aiAnalysisContext, setAiAnalysisContext] = useState(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCursor, setSearchCursor] = useState(0);
  const [customMode, setCustomMode] = useState(false);



  const [portConfigMode, setPortConfigMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customCursor, setCustomCursor] = useState(0);
  const [logOffset, setLogOffset] = useState(0);
  const [renameMode, setRenameMode] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [renameCursor, setRenameCursor] = useState(0);
  const [quitConfirm, setQuitConfirm] = useState(false);
  const [config, setConfig] = useState(() => loadConfig());
  const [stdinBuffer, setStdinBuffer] = useState('');
  const [stdinCursor, setStdinCursor] = useState(0);



  const runningProcessMap = useRef(new Map());
  const lastCommandRef = useRef(null);

  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId]);
  const running = activeTask?.status === 'running';
  const hasRunningTasks = useMemo(() => tasks.some(t => t.status === 'running'), [tasks]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const selectedProject = useMemo(() => filteredProjects[selectedIndex] || null, [filteredProjects, selectedIndex]);


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

  useEffect(() => {
    const handleStart = (task) => {
      setTasks(prev => {
        if (prev.some(t => t.id === task.id)) return prev;
        return [...prev, task];
      });
      if (!activeTaskId) setActiveTaskId(task.id);
    };

    const handleOutput = ({ taskId, chunk, logs }) => {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, logs } : t));
    };

    const handleEnd = (task) => {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, endTime: task.endTime } : t));
    };

    orchestrator.on('task_start', handleStart);
    orchestrator.on('task_output', handleOutput);
    orchestrator.on('task_end', handleEnd);

    return () => {
      orchestrator.off('task_start', handleStart);
      orchestrator.off('task_output', handleOutput);
      orchestrator.off('task_end', handleEnd);
    };
  }, [activeTaskId]);

  const runProjectCommand = useCallback((commandMeta, targetProject = null) => {
    const project = targetProject || selectedProject;
    
    try {
      // If no project is selected, run as a system-wide command (scaffolding, etc.)
      const taskId = orchestrator.runCommand(project?.id || 'system', null, commandMeta);
      setActiveTaskId(taskId);
      lastCommandRef.current = { project, commandMeta };
    } catch (err) {
      const errorTaskId = `error-${Date.now()}`;
      setTasks(prev => [...prev, { id: errorTaskId, name: 'Execution Error', status: 'failed', logs: [kleur.red(`✗ ${err.message}`)] }]);
      globalThis.setTimeout(() => setTasks(prev => prev.filter(t => t.id !== errorTaskId)), 3000);
    }
  }, [selectedProject]);


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
      if (input?.toLowerCase() === 'y') { killAllTasks(); process.stdout.write('\x1b[2J\x1b[0;0H'); exit(); return; }
      if (input?.toLowerCase() === 'n' || key.escape) { setQuitConfirm(false); return; }
      return;
    }

    const isCtrlC = (key.ctrl && input === 'c') || input === '\u0003';

    
    if (portConfigMode) {
      if (key.return) {
        const portVal = customInput.trim();
        if (selectedProject && portVal) {
          setConfig((prev) => {
            const projectKey = selectedProject.path;
            const existingMeta = prev.projectMeta?.[projectKey] || {};
            const nextConfig = { ...prev, projectMeta: { ...prev.projectMeta, [projectKey]: { ...existingMeta, port: portVal } } };
            saveConfig(nextConfig);
            return nextConfig;
          });
        }
        setPortConfigMode(false); setCustomInput(''); setCustomCursor(0);
        return;
      }
      if (key.escape) { setPortConfigMode(false); setCustomInput(''); setCustomCursor(0); return; }
      if (key.backspace || key.delete) {
        if (customCursor > 0) {
          setCustomInput((prev) => prev.slice(0, customCursor - 1) + prev.slice(customCursor));
          setCustomCursor(c => Math.max(0, c - 1));
        }
        return;
      }
      if (input && /[0-9]/.test(input)) {
        setCustomInput((prev) => prev.slice(0, customCursor) + input + prev.slice(customCursor));
        setCustomCursor(c => c + input.length);
      }
      return;
    }
        if (customMode) {
      if (key.return) {
        const raw = customInput.trim();
        const selProj = selectedProject;
        if (selProj && raw) {
          const [labelPart, commandPart] = raw.split('|');
          const commandTokens = parseShellWords(commandPart || labelPart);
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
    
    const findCommand = (project, key) => {
      let meta = project.commands?.[key];
      if (meta) return meta;
      const alts = COMMAND_FALLBACKS[key] || [];
      for (const alt of alts) {
        meta = project.commands?.[alt];
        if (meta) return meta;
      }
      return null;
    };

    const actionKey = normalizedInput && ACTION_MAP[normalizedInput];
    if (viewMode === 'detail' && actionKey && selectedProject) {
      if (actionKey === 'run' && key.shift) {
        setPortConfigMode(true);
        const port = config.projectMeta?.[selectedProject.path]?.port || selectedProject.metadata?.port || '7654';
        setCustomInput(String(port));
        setCustomCursor(String(port).length);
        return;
      }

      const commandMeta = findCommand(selectedProject, actionKey);
      if (commandMeta) {
        runProjectCommand(commandMeta, selectedProject);
      } else {
        const msg = kleur.yellow(`! No ${actionKey} command available for ${selectedProject.name}`);
        const taskId = `task-${Date.now()}`;
        setTasks(prev => [...prev, { id: taskId, name: `Notification`, status: 'failed', logs: [msg], project: '' }]);
        globalThis.setTimeout(() => setTasks(prev => prev.filter(t => t.id !== taskId)), 3000);
      }
      return;
    }

    if (shiftCombo('h')) { console.clear(); setConfig(prev => { const next = {...prev, showHelpCards: !prev.showHelpCards}; saveConfig(next); return next; }); return; }
    if (shiftCombo('s')) { console.clear(); setConfig(prev => { const next = {...prev, showStructureGuide: !prev.showStructureGuide}; saveConfig(next); return next; }); return; }
    if (shiftCombo('a')) { clearAndSwitch(mainView === 'navigator' ? 'studio' : 'navigator'); return; }
    if (shiftCombo('p')) { clearAndSwitch(mainView === 'navigator' ? 'registry' : 'navigator'); return; }
    if (shiftCombo('n')) { clearAndSwitch(mainView === 'navigator' ? 'architect' : 'navigator'); return; }
    if (shiftCombo('o')) { clearAndSwitch(mainView === 'navigator' ? 'ai' : 'navigator'); return; }
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

    if (mainView === 'registry' || mainView === 'architect' || mainView === 'ai') {
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

    if (input?.toLowerCase() === 'a' && activeTask?.status === 'failed') {
      const logs = activeTask.logs.slice(-100).join('\n');
      const ctx = `Task "${activeTask.name}" failed for project "${activeTask.project}".\nLogs:\n${logs}`;
      setAiAnalysisContext(ctx);
      clearAndSwitch('ai');
      return;
    }

    const pageLimit = config.maxVisibleProjects || 3;
    const totalProjects = filteredProjects.length;
    
    if (key.pageUp && totalProjects > pageLimit) {
      setSelectedIndex((prev) => Math.max(0, prev - pageLimit));
      console.clear();
      return;
    }
    
    if (key.pageDown && totalProjects > pageLimit) {
      setSelectedIndex((prev) => {
        const next = prev + pageLimit;
        // If next jump exceeds project list, stay at the start of the last page
        if (next >= totalProjects) {
           const lastPageStart = Math.floor((totalProjects - 1) / pageLimit) * pageLimit;
           return lastPageStart;
        }
        return next;
      });
      console.clear();
      return;
    }
    

    if (searchMode) {
      if (key.return || key.escape) { setSearchMode(false); return; }
      if (key.backspace || key.delete) {
        if (searchCursor > 0) {
          setSearchQuery(prev => prev.slice(0, searchCursor - 1) + prev.slice(searchCursor));
          setSearchCursor(c => Math.max(0, c - 1));
          setSelectedIndex(0);
        }
        return;
      }
      if (key.leftArrow) { setSearchCursor(c => Math.max(0, c - 1)); return; }
      if (key.rightArrow) { setSearchCursor(c => Math.min(searchQuery.length, c + 1)); return; }
      if (input) {
        setSearchQuery(prev => prev.slice(0, searchCursor) + input + prev.slice(searchCursor));
        setSearchCursor(c => c + input.length);
        setSelectedIndex(0);
      }
      return;
    }

    if (input === '/' && mainView === 'navigator') { setSearchMode(true); return; }
    
    if (normalizedInput === '?') { console.clear(); setShowHelp((prev) => !prev); return; }

    if (shiftCombo('l') && lastCommandRef.current) { runProjectCommand(lastCommandRef.current.commandMeta, lastCommandRef.current.project); return; }

    if (key.upArrow && !key.shift && projects.length > 0) { setSelectedIndex((prev) => Math.max(0, prev - 1)); return; }
    if (key.downArrow && !key.shift && projects.length > 0) { setSelectedIndex((prev) => Math.min(projects.length - 1, prev + 1)); return; }
    if (key.return) {
      if (!selectedProject) return;
      console.clear();
      setViewMode((prev) => (prev === 'detail' ? 'list' : 'detail'));
      return;
    }
    if (shiftCombo('q') || isCtrlC) {
      if (hasRunningTasks) setQuitConfirm(true); else { process.stdout.write('\x1b[2J\x1b[0;0H'); exit(); }
      return;
    }
    
    if (normalizedInput === '0' && viewMode === 'detail' && selectedProject) {
      clearAndSwitch('ai');
      return;
    }

    
        if (shiftCombo('c') && viewMode === 'detail' && selectedProject) { setCustomMode(true); setCustomInput(''); setCustomCursor(0); return; }
    
    if (viewMode === 'detail' && normalizedInput && detailShortcutMap.has(normalizedInput)) {
      if (!isNaN(parseInt(normalizedInput))) {
        runProjectCommand(detailShortcutMap.get(normalizedInput), selectedProject);
        return;
      }
      const reserved = ['a', 'p', 'n', 'x', 'e', 'd', 'b', 't', 'q', 'h', 's', 'l', 'c', 'i', 'o'];
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
    content.push(create(Text, {key: 'h-l', dimColor: true, marginTop: 1}, 'Shift+C: custom cmd · Shift+R: port · Alt+B/Alt+T/Alt+R/Alt+I: quick actions · Enter: close detail view.'));
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
      case 'ai': return create(AIHorizon, {rootPath, selectedProject, onRunCommand: runProjectCommand, CursorText, config, setConfig, saveConfig, analysisContext: aiAnalysisContext, clearContext: () => setAiAnalysisContext(null)});
      default: {
        const navigatorBody = [
          create(Header, {projectCountLabel, rootPath, running, statusHint, toggleHint, orbitHint, artHint}),
          config.showArtBoard && create(Box, {key: 'artboard', flexDirection: 'column', marginTop: 1, borderStyle: 'round', borderColor: 'gray', padding: 1},
            create(Box, {flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {color: 'magenta', bold: true}, 'Art-coded build atlas'), create(Text, {dimColor: true}, 'press ? for overlay help')),
            create(Box, {flexDirection: 'row', marginTop: 1}, ...ART_CHARS.map((char, i) => create(Text, {key: i, color: ART_COLORS[i % ART_COLORS.length]}, char.repeat(2)))),
            create(Box, {flexDirection: 'row', marginTop: 1}, ...artTileNodes)
          ),
          create(Box, {key: 'projects-row', marginTop: 1, flexDirection: 'row', alignItems: 'stretch', width: '100%', flexWrap: 'wrap'},
            create(Box, {flexGrow: 1, flexBasis: 0, minWidth: PROJECTS_MIN_WIDTH, marginRight: 1, borderStyle: 'round', borderColor: 'magenta', padding: 1}, 
              create(Text, {bold: true, color: 'magenta'}, 'Projects'), 
              create(Box, {flexDirection: 'column', marginTop: 1}, create(Navigator, {
            projects, 
            selectedIndex, 
            rootPath, 
            loading, 
            error, 
            maxVisibleProjects: config.maxVisibleProjects || 3,
            searchQuery: (searchMode || searchQuery) ? searchQuery : null,
            CursorText,
            searchCursor
          }))
            ),
            create(Box, {flexGrow: 1.3, flexBasis: 0, minWidth: DETAILS_MIN_WIDTH, borderStyle: 'round', borderColor: 'cyan', padding: 1, flexDirection: 'column'}, create(Text, {bold: true, color: 'cyan'}, 'Details'), ...detailContent)
          ),
          create(Box, {key: 'output-row', marginTop: 1, flexDirection: 'column'},
            create(Box, {flexDirection: 'row', justifyContent: 'space-between'}, create(Text, {bold: true, color: 'yellow'}, `Output: ${activeTask?.name || 'None'}`), create(Text, {dimColor: true}, logOffset ? `Scrolled ${logOffset} lines` : 'Live log view')),
            create(OutputPanel, {activeTask, logOffset}),
            create(Footer, {toggleHint, running, stdinBuffer, stdinCursor, CursorText})
          ),
          config.showHelpCards && create(Box, {key: 'help-cards', marginTop: 1, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'}, [
            {label: 'Navigation', color: 'magenta', body: ['↑/↓: focus, PgUp/Dn: Page, Enter: Details', 'Shift+↑ / ↓ scroll output', 'Shift+H toggle help cards', 'Shift+D detach from task']},
            {label: 'Management', color: 'cyan', body: ['Shift+P Package Registry', 'Shift+N Project Architect', 'Shift+X clear / Shift+E export']},
            {label: 'Orbit & AI', color: 'yellow', body: ['Shift+T: Tasks, Shift+O: AI, 0: Analyze', 'Shift+A studio / Shift+O AI Horizon', 'Shift+S structure / Shift+Q quit']}
          ].map((card, idx) => create(Box, {key: card.label, flexGrow: 1, flexBasis: 0, minWidth: HELP_CARD_MIN_WIDTH, marginRight: idx < 2 ? 1 : 0, marginBottom: 1, borderStyle: 'round', borderColor: card.color, padding: 1, flexDirection: 'column'}, create(Text, {color: card.color, bold: true, marginBottom: 1}, card.label), ...card.body.map((line, lidx) => create(Text, {key: lidx, dimColor: card.color === 'yellow'}, line))))),
          config.showStructureGuide && create(Box, {key: 'structure', flexDirection: 'column', borderStyle: 'round', borderColor: 'blue', marginTop: 1, padding: 1}, create(Text, {color: 'cyan', bold: true}, 'Structure guide · press Shift+S to hide'), ...SCHEMA_GUIDE.map(e => create(Text, {key: e.type, dimColor: true}, `• ${e.icon} ${e.label}: ${e.files.join(', ')}`))),
          showHelp && create(Box, {key: 'overlay', flexDirection: 'column', borderStyle: 'double', borderColor: 'cyan', marginTop: 1, padding: 1},
            create(Text, {color: 'cyan', bold: true}, '📖 Help Overview'),
            create(Text, null, 'Shift+T Tasks · Shift+P Packages · Shift+N Architect · Shift+O AI · Shift+A Studio'),
            create(Text, null, 'Alt+B/Alt+T/Alt+R/Alt+I Build/Test/Run/Install   Shift+C custom cmd   Shift+R port'),
            create(Text, null, 'Shift+K kill · Shift+R rename · Shift+D detach · Shift+X clear · Shift+E export · Shift+L rerun'),
            create(Text, null, 'Shift+H help cards · Shift+S structure · Shift+B art · Shift+Q quit'),
            create(Text, null, '↑/↓ navigate · Enter detail · Esc back · ? close')
          )
        ];
        return create(Box, {flexDirection: 'column'}, ...navigatorBody);
      }
    }
  };


  if (showSplash) return create(Splash);

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
    else if (token === '--view' && tokens[i + 1]) { args.view = tokens[i + 1]; i += 1; }
    else if (token === '--studio') args.studioCheck = true;
    else if (token === '--ai') args.view = 'ai';
    else if (token === '--task' || token === '--tasks') args.view = 'tasks';
    else if (token === '--registry') args.view = 'registry';
    else if (token === '--architect') args.view = 'architect';
    else if (token === '--list-projects') args.listProjects = true;
    else if (token === '--json') args.json = true;
    else if (token === '--project-info' && tokens[i + 1]) { args.projectInfo = parseInt(tokens[i + 1], 10); i += 1; }
    else if (token === '--run' && tokens[i + 1]) { args.runCommand = tokens[i + 1]; i += 1; }
    else if (token === '--add-pkg' && tokens[i + 1]) { args.addPkg = tokens[i + 1]; i += 1; }
    else if (token === '--remove-pkg' && tokens[i + 1]) { args.removePkg = tokens[i + 1]; i += 1; }
    else if (token === '--scaffold' && tokens[i + 1]) { args.scaffold = tokens[i + 1]; i += 1; }
    else if (token === '--name' && tokens[i + 1]) { args.name = tokens[i + 1]; i += 1; }
    else if (token === '--studio-check') args.studioCheck = true;
    else if (token === '--ai-analyze') args.aiAnalyze = true;

    else if (token === '--deep') args.deep = true;
    else if (token === '--server') args.server = true;
    else if (token === '--mcp') args.mcp = true;
    else if (token === '--host' && tokens[i + 1]) { args.host = tokens[i + 1]; i += 1; }
    else if (token === '--port' && tokens[i + 1]) { args.port = tokens[i + 1]; i += 1; }
    else if (token === '--setup-service') args.setupService = true;
    else if (token === '--update') args.update = true;
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
    console.log(kleur.bold(kleur.magenta('🧭 PROJECT COMPASS · HIGH-FIDELITY WORKSPACE NAVIGATOR')));
    console.log(kleur.dim('─────────────────────────────────────────────────────────────'));
    console.log('');
    console.log(kleur.bold('Usage:'));
    console.log('  project-compass [options]');
    console.log('');
    console.log(kleur.bold(kleur.cyan('🛰️ VIEWS:')));
    console.log('  --studio         Environment runtime & health audit');
    console.log('  --ai             AI Horizon (Project DNA mapping & chat)');
    console.log('  --tasks          Orbit Task Manager (Background processes)');
    console.log('  --registry       Package Registry (Dependency management)');
    console.log('  --architect      Project Architect (Scaffolding templates)');
    console.log('');
    console.log(kleur.bold(kleur.yellow('⚙️ ARGUMENTS:')));
    console.log('  --dir <path>     Working directory for scanning (default: cwd)');
    console.log('  --deep           Unlimited discovery depth for massive monorepos');
    console.log('  --list-projects  Output detected projects list');
    console.log('  --json           Enable JSON output for CLI commands');
    console.log('  --project-info   Get detailed metadata for project by index');
    console.log('');
    console.log(kleur.bold(kleur.green('📦 SCAFFOLD TEMPLATES:')));
    console.log('  nextjs, nextjs-bun, react-vite, react-vite-npm,');
    console.log('  vue-vite, rust, django, python-basic, go');
    console.log('');
    console.log(kleur.bold(kleur.blue('🌐 SERVER & MCP:')));
    console.log('  --server         Launch Web Server mode');
    console.log('  --host <ip>      Host to bind server to (default: 0.0.0.0)');
    console.log('  --port <number>  Port for web server (default: 7654)');
    console.log('  --mcp            Launch as Model Context Protocol server');
    console.log('  --setup-service  Generate systemd service for background mode');
    console.log('  --update         Update Project Compass to the latest version');
    console.log('');

    console.log(kleur.bold(kleur.magenta('🎮 TUI SHORTCUTS (ACTIVE IN NAVIGATOR):')));

    console.log('  /                Enter Search/Filter mode');
    console.log('  Shift+T          Orbit Task Manager');
    console.log('  Shift+O          AI Horizon Analysis');
    console.log('  Shift+P          Package Registry');
    console.log('  Shift+N          Project Architect');
    console.log('  Enter            Toggle Detailed Project View');
    console.log('  Esc              Global back / Clear focus');
    console.log('');
    console.log(kleur.dim('For more documentation, visit: https://github.com/CrimsonDevil333333/project-compass'));
    return;
  }
  const rootPath = args.root ? path.resolve(args.root) : process.cwd();

  if (args.listProjects) {

    const projects = await discoverProjects(rootPath);
    if (args.json) {
      console.log(JSON.stringify(projects, (key, value) => key === 'commands' ? Object.keys(value) : value, 2));
    } else {
      console.log(`Detected ${projects.length} project(s) under ${rootPath}`);
      projects.forEach((project) => { console.log(` • [${project.type}] ${project.name} (${project.path})`); });
    }
    return;
  }

  if (args.projectInfo !== undefined) {
    const projects = await discoverProjects(rootPath);
    const project = projects[args.projectInfo];
    if (!project) { console.error(`Project index ${args.projectInfo} not found. Total: ${projects.length}`); process.exit(1); }
    if (args.json) {
      console.log(JSON.stringify(project, null, 2));
    } else {
      console.log(`Name: ${project.name}`);
      console.log(`Type: ${project.type}`);
      console.log(`Path: ${project.path}`);
      console.log(`Frameworks: ${(project.frameworks || []).map(f => f.name).join(', ') || 'none'}`);
      console.log(`Manifest: ${project.manifest}`);
      console.log('Commands:');
      Object.entries(project.commands || {}).forEach(([key, cmd]) => console.log(`  ${key}: ${cmd.label || key} → ${cmd.command.join(' ')}`));
    }
    return;
  }

  if (args.runCommand) {
    const projects = await discoverProjects(rootPath);
    const targetDir = projects.length > 0 ? (args.root ? projects.find(p => p.path.startsWith(rootPath)) || projects[0] : projects[0]).path : rootPath;
    console.log(`Running "${args.runCommand}" in ${targetDir}...`);
    const subprocess = execa(args.runCommand, { cwd: targetDir, shell: true, stdio: 'inherit' });
    await subprocess;
    return;
  }

  if (args.addPkg) {
    const projects = await discoverProjects(rootPath);
    const target = projects[0];
    if (!target) { console.error('No projects detected'); process.exit(1); }
    const cmd = getAddCmd(target, args.addPkg);
    if (!cmd) { console.error(`Cannot add package: unsupported project type ${target.type}`); process.exit(1); }
    console.log(`Adding ${args.addPkg} to ${target.name}...`);
    const subprocess = execa(cmd[0], cmd.slice(1), { cwd: target.path, stdio: 'inherit' });
    await subprocess;
    return;
  }

  if (args.removePkg) {
    const projects = await discoverProjects(rootPath);
    const target = projects[0];
    if (!target) { console.error('No projects detected'); process.exit(1); }
    const cmd = getRemoveCmd(target, args.removePkg);
    if (!cmd) { console.error(`Cannot remove package: unsupported project type ${target.type}`); process.exit(1); }
    console.log(`Removing ${args.removePkg} from ${target.name}...`);
    const subprocess = execa(cmd[0], cmd.slice(1), { cwd: target.path, stdio: 'inherit' });
    await subprocess;
    return;
  }

  if (args.scaffold) {
    const template = args.scaffold;
    const projectName = args.name || 'my-project';
    const targetPath = args.root ? path.resolve(args.root, projectName) : path.resolve(process.cwd(), projectName);
    const scaffoldCmds = {
      'nextjs': ['npx', 'create-next-app@latest', targetPath],
      'nextjs-bun': ['bun', 'create', 'next-app', targetPath],
      'react-vite': ['pnpm', 'create', 'vite', targetPath, '--template', 'react'],
      'react-vite-npm': ['npm', 'create', 'vite@latest', targetPath, '--', '--template', 'react'],
      'vue-vite': ['npm', 'create', 'vite@latest', targetPath, '--', '--template', 'vue'],
      'rust': ['cargo', 'new', targetPath],
      'django': ['django-admin', 'startproject', projectName, targetPath],
      'python-basic': ['mkdir', '-p', targetPath],
      'go': ['mkdir', '-p', targetPath, '&&', 'cd', targetPath, '&&', 'go', 'mod', 'init', projectName]
    };
    const cmd = scaffoldCmds[template];
    if (!cmd) { console.error(`Unknown template: ${template}. Available: ${Object.keys(scaffoldCmds).join(', ')}`); process.exit(1); }
    console.log(`Scaffolding ${template} at ${targetPath}...`);
    if (template === 'go') {
      await execa('mkdir', ['-p', targetPath]);
      await execa('go', ['mod', 'init', projectName], { cwd: targetPath });
    } else {
      const subprocess = execa(cmd[0], cmd.slice(1), { stdio: 'inherit' });
      await subprocess;
    }
    console.log(`✓ Project created at ${targetPath}`);
    return;
  }

  if (args.update) {
    console.log(kleur.bold(kleur.magenta('\n🚀 PROJECT COMPASS | OMNI-UPDATER')));
    console.log(kleur.dim('──────────────────────────────────\n'));
    console.log(kleur.cyan('📡 Checking for latest version on npmjs.com...'));
    try {
      const subprocess = execa('npm', ['install', '-g', 'project-compass@latest'], { stdio: 'inherit' });
      await subprocess;
      console.log(kleur.green('\n✨ Update successful! Project Compass is now at the latest production build.'));
    } catch (err) {
      console.log(kleur.red(`\n❌ Update failed: ${err.message}`));
      console.log(kleur.yellow('ℹ️  Try running with sudo if permissions were denied.'));
    }
    return;
  }

  if (args.setupService) {

    setupSystemdService(args.host || '0.0.0.0', args.port || 7654);
    return;
  }

  if (args.mcp) {
    await startMcpServer();
    return;
  }

  if (args.server) {
    startServer(args.host || '0.0.0.0', args.port || 7654);
    return;
  }



  if (args.studioCheck) {
    console.log(kleur.bold(kleur.magenta('\n  🧭 Omni-Studio Diagnostic Audit')));
    console.log(kleur.dim('  ─────────────────────────────────\n'));
    
    const checks = [
      {name: 'Node.js', binary: 'node', versionCmd: ['-v']},
      {name: 'npm', binary: 'npm', versionCmd: ['-v']},
      {name: 'Python', binary: process.platform === 'win32' ? 'python' : 'python3', versionCmd: ['--version']},
      {name: 'Rust', binary: 'cargo', versionCmd: ['--version']},
      {name: 'Go', binary: 'go', versionCmd: ['version']},
      {name: 'Java', binary: 'java', versionCmd: ['-version']},
      {name: 'PHP', binary: 'php', versionCmd: ['-v']},
      {name: 'Ruby', binary: 'ruby', versionCmd: ['-v']},
      {name: '.NET', binary: 'dotnet', versionCmd: ['--version']}
    ];

    for (const lang of checks) {
      try {
        const { stdout, stderr } = await execa(lang.binary, lang.versionCmd);
        const version = (stdout || stderr || '').split('\n')[0].replace(/Python |cargo |go version /i, '').trim();
        console.log(`  ${kleur.green('✓')} ${kleur.bold(lang.name.padEnd(12))} ${kleur.dim(version)}`);
      } catch {
        console.log(`  ${kleur.red('✗')} ${kleur.bold(lang.name.padEnd(12))} ${kleur.red('Not Installed')}`);
      }
    }
    console.log('');
    return;
  }


  if (args.aiAnalyze) {
    console.log('AI Analysis is only available in TUI mode. Run: project-compass');
    return;
  }

  const scanDepth = args.deep ? Infinity : 7;
  const { waitUntilExit } = render(create(Compass, {rootPath: args.root || process.cwd(), initialView: args.view || 'navigator', scanDepth}));
  
  // Robust process cleanup on exit
  const cleanup = () => {
    process.stdout.write('\x1b[?25h'); // Show cursor
    // The Compass component handles killing processes via useEffect cleanup if designed correctly,
    // but we force exit here to be sure.
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  await waitUntilExit();
}


main().catch((error) => { 
  console.error(kleur.red('█ CRITICAL ERROR:'), error); 
  process.exit(1); 
});