#!/usr/bin/env node
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {render, Box, Text, useApp, useInput} from 'ink';
import path from 'path';
import fs from 'fs';
import kleur from 'kleur';
import {execa} from 'execa';
import {discoverProjects, SCHEMA_GUIDE, checkBinary} from './projectDetection.js';
import {CONFIG_PATH, PLUGIN_FILE, ensureConfigDir} from './configPaths.js';

const create = React.createElement;
const DEFAULT_CONFIG = {customCommands: {}};
const ART_CHARS = ['▁', '▃', '▄', '▅', '▇'];
const ART_COLORS = ['magenta', 'blue', 'cyan', 'yellow', 'red'];
const OUTPUT_WINDOW_SIZE = 8;
const OUTPUT_WINDOW_HEIGHT = OUTPUT_WINDOW_SIZE + 2;
const PROJECTS_MIN_WIDTH = 32;
const DETAILS_MIN_WIDTH = 44;
const HELP_CARD_MIN_WIDTH = 28;
const RECENT_RUN_LIMIT = 5;
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
            {key: r.name, marginBottom: 1},
            create(Text, {width: 15, color: r.status === 'ok' ? 'green' : 'red'}, `${r.status === 'ok' ? '✓' : '✗'} ${r.name}`),
            create(Text, {dimColor: r.status !== 'ok'}, r.version)
          )),
          create(Text, {marginTop: 1, color: 'yellow'}, '🛠️ Interactive Project Creator coming soon in v3.0'),
          create(Text, {dimColor: true}, 'Press Shift+A to return to Navigator.')
        )
  );
}

function Compass({rootPath, initialView = 'navigator'}) {
  const {exit} = useApp();
  const {projects, loading, error} = useScanner(rootPath);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [mainView, setMainView] = useState(initialView);
  const [logLines, setLogLines] = useState([]);
  const [logOffset, setLogOffset] = useState(0);
  const [running, setRunning] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [config, setConfig] = useState(() => loadConfig());
  const [showHelpCards, setShowHelpCards] = useState(false);
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [stdinBuffer, setStdinBuffer] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [recentRuns, setRecentRuns] = useState([]);
  const selectedProject = projects[selectedIndex] || null;
  const runningProcessRef = useRef(null);
  const lastCommandRef = useRef(null);

  const addLog = useCallback((line) => {
    setLogLines((prev) => {
      const normalized = typeof line === 'string' ? line : JSON.stringify(line);
      const lines = normalized.split(/\r?\n/).filter(l => l.trim().length > 0);
      const appended = [...prev, ...lines];
      return appended.length > 500 ? appended.slice(appended.length - 500) : appended;
    });
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
    if (!project) {
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

    const commandLabel = commandMeta.label || commandMeta.command.join(' ');
    lastCommandRef.current = {project, commandMeta};
    setRunning(true);
    setLastAction(`${project.name} · ${commandLabel}`);
    const fullCmd = commandMeta.command;
    addLog(kleur.cyan(`> ${fullCmd.join(' ')}`));
    setRecentRuns((prev) => {
      const entry = {project: project.name, command: commandLabel, time: new Date().toLocaleTimeString()};
      return [entry, ...prev].slice(0, RECENT_RUN_LIMIT);
    });

    try {
      const subprocess = execa(fullCmd[0], fullCmd.slice(1), {
        cwd: project.path,
        env: process.env,
        stdin: 'pipe'
      });
      runningProcessRef.current = subprocess;

      subprocess.stdout?.on('data', (chunk) => {
        addLog(chunk.toString());
      });
      subprocess.stderr?.on('data', (chunk) => {
        addLog(kleur.red(chunk.toString()));
      });

      await subprocess;
      addLog(kleur.green(`✓ ${commandLabel} finished`));
    } catch (error) {
      addLog(kleur.red(`✗ ${commandLabel} failed: ${error.shortMessage || error.message}`));
    } finally {
      setRunning(false);
      setStdinBuffer('');
      runningProcessRef.current = null;
    }
  }, [addLog, running, selectedProject]);

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

  const exportLogs = useCallback(() => {
    if (!logLines.length) {
      return;
    }
    try {
      const exportPath = path.resolve(process.cwd(), `compass-logs-${Date.now()}.txt`);
      fs.writeFileSync(exportPath, logLines.join('\n'));
      addLog(kleur.green(`✓ Logs exported to ${exportPath}`));
    } catch (err) {
      addLog(kleur.red(`✗ Export failed: ${err.message}`));
    }
  }, [logLines, addLog]);

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

    const normalizedInput = input?.toLowerCase();
    const ctrlCombo = (char) => key.ctrl && normalizedInput === char;
    const shiftCombo = (char) => key.shift && normalizedInput === char;
    const toggleShortcut = (char) => shiftCombo(char);
    if (toggleShortcut('h')) {
      setShowHelpCards((prev) => !prev);
      return;
    }
    if (toggleShortcut('s')) {
      setShowStructureGuide((prev) => !prev);
      return;
    }
    if (toggleShortcut('a')) {
      setMainView((prev) => (prev === 'navigator' ? 'studio' : 'navigator'));
      return;
    }
    if (toggleShortcut('x')) {
      setLogLines([]);
      setLogOffset(0);
      return;
    }
    if (shiftCombo('e')) {
      exportLogs();
      return;
    }

    const scrollLogs = (delta) => {
      setLogOffset((prev) => {
        const maxScroll = Math.max(0, logLines.length - OUTPUT_WINDOW_SIZE);
        return Math.max(0, Math.min(maxScroll, prev + delta));
      });
    };

    if (running && runningProcessRef.current) {
      if (key.ctrl && input === 'c') {
        runningProcessRef.current.kill('SIGINT');
        setStdinBuffer('');
        return;
      }
      if (key.return) {
        runningProcessRef.current.stdin?.write('\n');
        setStdinBuffer('');
        return;
      }
      if (key.backspace) {
        runningProcessRef.current.stdin?.write('\x08');
        setStdinBuffer((prev) => prev.slice(0, -1));
        return;
      }
      if (input) {
        runningProcessRef.current.stdin?.write(input);
        setStdinBuffer((prev) => prev + input);
      }
      return;
    }

    if (key.shift && key.upArrow) {
      scrollLogs(1);
      return;
    }
    if (key.shift && key.downArrow) {
      scrollLogs(-1);
      return;
    }

    if (normalizedInput === '?') {
      setShowHelp((prev) => !prev);
      return;
    }
    if (shiftCombo('l') && lastCommandRef.current) {
      runProjectCommand(lastCommandRef.current.commandMeta, lastCommandRef.current.project);
      return;
    }

    if (key.upArrow && !key.shift && projects.length > 0) {
      setSelectedIndex((prev) => (prev - 1 + projects.length) % projects.length);
      return;
    }
    if (key.downArrow && !key.shift && projects.length > 0) {
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
    if (shiftCombo('q')) {
      exit();
      return;
    }
    if (shiftCombo('c') && viewMode === 'detail' && selectedProject) {
      setCustomMode(true);
      setCustomInput('');
      return;
    }
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
  const projectRows = [];
  if (loading) {
    projectRows.push(create(Text, {key: 'scanning', dimColor: true}, 'Scanning projects…'));
  }
  if (error) {
    projectRows.push(create(Text, {key: 'error', color: 'red'}, `Unable to scan: ${error}`));
  }
  if (!loading && !error && projects.length === 0) {
    projectRows.push(create(Text, {key: 'empty', dimColor: true}, 'No recognizable project manifests found.'));
  }
  if (!loading && mainView === 'navigator') {
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
            create(
              Text,
              {
                color: isSelected ? 'cyan' : 'white',
                bold: isSelected
              },
              `${project.icon} ${project.name}`
            ),
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
      create(
        Box,
        {key: 'title-row', flexDirection: 'row'},
        create(Text, {color: 'cyan', bold: true}, `${selectedProject.icon} ${selectedProject.name}`),
        selectedProject.missingBinaries && selectedProject.missingBinaries.length > 0 && create(Text, {color: 'red', bold: true}, '  ⚠️ MISSING RUNTIME')
      ),
      create(Text, {key: 'manifest', dimColor: true}, `${selectedProject.type} · ${selectedProject.manifest || 'detected manifest'}`),
      create(Text, {key: 'loc', dimColor: true}, `Location: ${path.relative(rootPath, selectedProject.path) || '.'}`)
    );
    if (selectedProject.description) {
      detailContent.push(create(Text, {key: 'desc'}, selectedProject.description));
    }
    const frameworks = (selectedProject.frameworks || []).map((lib) => `${lib.icon} ${lib.name}`).join(', ');
    if (frameworks) {
      detailContent.push(create(Text, {key: 'frames', dimColor: true}, `Frameworks: ${frameworks}`));
    }
    if (selectedProject.extra?.scripts && selectedProject.extra.scripts.length) {
      detailContent.push(create(Text, {key: 'scripts', dimColor: true}, `Scripts: ${selectedProject.extra.scripts.join(', ')}`));
    }

    if (selectedProject.missingBinaries && selectedProject.missingBinaries.length > 0) {
      detailContent.push(
        create(Text, {key: 'missing-title', color: 'red', bold: true, marginTop: 1}, 'MISSING BINARIES:'),
        create(Text, {key: 'missing-list', color: 'red'}, `Please install: ${selectedProject.missingBinaries.join(', ')}`),
        create(Text, {key: 'missing-hint', dimColor: true}, 'Project commands may fail until these are in your PATH.')
      );
    }

    detailContent.push(create(Text, {key: 'config-path', dimColor: true, marginTop: 1}, `Custom commands stored in ${CONFIG_PATH}`));
    detailContent.push(create(Text, {key: 'plugin-path', dimColor: true, marginBottom: 1}, `Extend frameworks via ${PLUGIN_FILE}`));
    detailContent.push(create(Text, {key: 'cmd-header', bold: true, marginTop: 1}, 'Commands'));
    detailedIndexed.forEach((command) => {
      detailContent.push(
        create(Text, {key: `detail-${command.shortcut}-${command.label}`}, `${command.shortcut}. ${command.label} ${command.source === 'custom' ? kleur.magenta('(custom)') : command.source === 'framework' ? kleur.cyan('(framework)') : command.source === 'plugin' ? kleur.green('(plugin)') : ''}`)
      );
      detailContent.push(create(Text, {key: `detail-line-${command.shortcut}-${command.label}`, dimColor: true}, `   ↳ ${command.command.join(' ')}`));
    });
    if (!detailedIndexed.length) {
      detailContent.push(create(Text, {key: 'no-cmds', dimColor: true}, 'No built-in commands yet. Add a custom command with Shift+C.'));
    }
    const setupHints = selectedProject.extra?.setupHints || [];
    if (setupHints.length) {
      detailContent.push(create(Text, {key: 'setup-header', dimColor: true, marginTop: 1}, 'Setup hints:'));
      setupHints.forEach((hint, hidx) => detailContent.push(create(Text, {key: `hint-${hidx}`, dimColor: true}, `  • ${hint}`)));
    }
    detailContent.push(create(Text, {key: 'hint-line', dimColor: true}, 'Press Shift+C → label|cmd to save custom actions, Enter to close detail view.'));
  } else {
    detailContent.push(create(Text, {key: 'enter-hint', dimColor: true}, 'Press Enter on a project to reveal details (icons, commands, frameworks, custom actions).'));
  }

  if (customMode) {
    detailContent.push(create(Text, {key: 'custom-input', color: 'cyan'}, `Type label|cmd (Enter to save, Esc to cancel): ${customInput}`));
  }

  const artTileNodes = useMemo(() => {
    const selectedName = selectedProject?.name || 'Awaiting selection';
    const selectedType = selectedProject?.type || 'Unknown stack';
    const selectedLocation = selectedProject?.path ? path.relative(rootPath, selectedProject.path) || '.' : '—';
    const statusNarrative = running ? 'Running commands' : lastAction ? `Last: ${lastAction}` : 'Idle gallery';
    const workspaceName = path.basename(rootPath) || rootPath;
    const tileDefinition = [
      {
        label: 'Pulse',
        detail: projectCountLabel,
        accent: 'magenta',
        icon: '●',
        subtext: `Workspace · ${workspaceName}`
      },
      {
        label: 'Focus',
        detail: selectedName,
        accent: 'cyan',
        icon: '◆',
        subtext: `${selectedType} · ${selectedLocation}`
      },
      {
        label: 'Rhythm',
        detail: `${detailCommands.length} commands`,
        accent: 'yellow',
        icon: '■',
        subtext: statusNarrative
      }
    ];
    return tileDefinition.map((tile) =>
      create(
        Box,
        {
          key: tile.label,
          flexDirection: 'column',
          padding: 1,
          marginRight: 1,
          borderStyle: 'single',
          borderColor: tile.accent,
          minWidth: 24
        },
        create(Text, {color: tile.accent, bold: true}, `${tile.icon} ${tile.label}`),
        create(Text, {bold: true}, tile.detail),
        create(Text, {dimColor: true}, tile.subtext)
      )
    );
  }, [projectCountLabel, rootPath, selectedProject, detailCommands.length, running, lastAction]);

  const artBoard = create(
    Box,
    {
      flexDirection: 'column',
      marginTop: 1,
      borderStyle: 'round',
      borderColor: 'gray',
      padding: 1
    },
    create(
      Box,
      {flexDirection: 'row', justifyContent: 'space-between'},
      create(Text, {color: 'magenta', bold: true}, 'Art-coded build atlas'),
      create(Text, {dimColor: true}, 'press ? for overlay help')
    ),
    create(
      Box,
      {flexDirection: 'row', marginTop: 1},
      ...ART_CHARS.map((char, index) =>
        create(Text, {key: `art-${index}`, color: ART_COLORS[index % ART_COLORS.length]}, char.repeat(2))
      )
    ),
    create(
      Box,
      {flexDirection: 'row', marginTop: 1},
      ...artTileNodes
    ),
    create(Text, {dimColor: true, marginTop: 1}, kleur.italic('The art board now follows your layout and stays inside the window.'))
  );

  const logWindowStart = Math.max(0, logLines.length - OUTPUT_WINDOW_SIZE - logOffset);
  const logWindowEnd = Math.max(0, logLines.length - logOffset);
  const visibleLogs = logLines.slice(logWindowStart, logWindowEnd);
  const logNodes = visibleLogs.length
    ? visibleLogs.map((line, index) => create(Text, {key: index}, line))
    : [create(Text, {key: 'no-logs', dimColor: true}, 'Logs will appear here once you run a command.')];

  const helpCards = [
    {
      label: 'Navigation',
      color: 'magenta',
      body: [
        '↑ / ↓ move focus, Enter: details',
        'Shift+↑ / ↓ scroll output',
        'Shift+H toggle help cards',
        '? opens the overlay help'
      ]
    },
    {
      label: 'Command flow',
      color: 'cyan',
      body: [
        'B / T / R build/test/run',
        '1-9 run detail commands',
        'Shift+L rerun last command',
        'Shift+X clear / Shift+E export'
      ]
    },
    {
      label: 'System & Studio',
      color: 'yellow',
      body: [
        'Shift+A open Omni-Studio',
        'Shift+S toggle structure guide',
        'Shift+C save custom action',
        'Shift+Q quit application'
      ]
    }
  ];
  const helpSection = showHelpCards
    ? create(
        Box,
        {marginTop: 1, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'},
        ...helpCards.map((card, index) =>
          create(
            Box,
            {
              key: card.label,
              flexGrow: 1,
              flexBasis: 0,
              minWidth: HELP_CARD_MIN_WIDTH,
              marginRight: index < helpCards.length - 1 ? 1 : 0,
              marginBottom: 1,
              borderStyle: 'round',
              borderColor: card.color,
              padding: 1,
              flexDirection: 'column'
            },
            create(Text, {color: card.color, bold: true, marginBottom: 1}, card.label),
            ...card.body.map((line, lineIndex) =>
              create(Text, {key: `${card.label}-${lineIndex}`, dimColor: card.color === 'yellow'}, line)
            )
          )
        )
      )
    : create(Text, {key: 'help-hint', dimColor: true, marginTop: 1}, 'Help cards hidden · press Shift+H to show navigation, command flow, and recent runs.');

  const structureGuide = showStructureGuide
    ? create(
        Box,
        {
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: 'blue',
          marginTop: 1,
          padding: 1
        },
        create(Text, {color: 'cyan', bold: true}, 'Project structure guide · press Shift+S to hide'),
        ...SCHEMA_GUIDE.map((entry) =>
          create(Text, {key: entry.type, dimColor: true}, `• ${entry.icon} ${entry.label}: ${entry.files.join(', ')}`)
        ),
        create(Text, {dimColor: true, marginTop: 1}, 'SCHEMAS describe the manifests that trigger each language type.')
      )
    : null;

  const helpOverlay = showHelp
    ? create(
        Box,
        {
          flexDirection: 'column',
          borderStyle: 'double',
          borderColor: 'cyan',
          marginTop: 1,
          padding: 1
        },
        create(Text, {color: 'cyan', bold: true}, 'Help overlay · press ? to hide'),
        create(Text, null, 'Shift+↑/↓ scrolls logs; Shift+X clears; Shift+E exports to file; Shift+A Omni-Studio.'),
        create(Text, null, 'B/T/R run build/test/run; 1-9 detail commands; Shift+L reruns previous command.'),
        create(Text, null, 'Shift+H help cards, Shift+S structure guide, ? overlay, Shift+Q quits.'),
        create(Text, null, 'Projects + Details stay paired while Output keeps its own full-width band.'),
        create(Text, null, 'Structure guide lists the manifests that trigger each language detection.')
      )
    : null;

  if (mainView === 'studio') {
    return create(Studio);
  }

  const toggleHint = showHelpCards ? 'Shift+H hides the help cards' : 'Shift+H shows the help cards';
  const headerHint = viewMode === 'detail'
    ? `Detail mode · 1-${Math.max(detailedIndexed.length, 1)} to execute, Shift+C: add custom commands, Enter: back to list, Shift+Q: quit · ${toggleHint}, Shift+S toggles structure guide`
    : `Quick run · B/T/R to build/test/run, Enter: view details, Shift+Q: quit · ${toggleHint}, Shift+S toggles structure guide`;

  return create(
    Box,
    {flexDirection: 'column', padding: 1},
    create(
      Box,
      {justifyContent: 'space-between'},
      create(
        Box,
        {flexDirection: 'column'},
        create(Text, {color: 'magenta', bold: true}, 'Project Compass'),
        create(Text, {dimColor: true}, loading ? 'Scanning workspaces…' : `${projectCountLabel} detected in ${rootPath}`),
        create(Text, {dimColor: true}, 'Use keyboard arrows to navigate, ? for help.')
      ),
      create(
        Box,
        {flexDirection: 'column', alignItems: 'flex-end'},
        create(Text, {color: running ? 'yellow' : 'green'}, running ? 'Busy streaming...' : lastAction ? `Last action · ${lastAction}` : 'Idle'),
        create(Text, {dimColor: true}, headerHint)
      )
    ),
    artBoard,
    create(
      Box,
      {marginTop: 1, flexDirection: 'row', alignItems: 'stretch', width: '100%', flexWrap: 'wrap'},
      create(
        Box,
        {
          flexGrow: 1,
          flexBasis: 0,
          flexShrink: 1,
          minWidth: PROJECTS_MIN_WIDTH,
          marginRight: 1,
          borderStyle: 'round',
          borderColor: 'magenta',
          padding: 1
        },
        create(Text, {bold: true, color: 'magenta'}, 'Projects'),
        create(Box, {flexDirection: 'column', marginTop: 1}, ...projectRows)
      ),
      create(
        Box,
        {
          flexGrow: 1.3,
          flexBasis: 0,
          flexShrink: 1,
          minWidth: DETAILS_MIN_WIDTH,
          borderStyle: 'round',
          borderColor: 'cyan',
          padding: 1,
          flexDirection: 'column'
        },
        create(Text, {bold: true, color: 'cyan'}, 'Details'),
        ...detailContent
      )
    ),
    create(
      Box,
      {marginTop: 1, flexDirection: 'column'},
      create(
        Box,
        {flexDirection: 'row', justifyContent: 'space-between'},
        create(Text, {bold: true, color: 'yellow'}, `Output ${running ? '· Running' : ''}`),
        create(Text, {dimColor: true}, logOffset ? `Scrolled ${logOffset} lines` : 'Live log view')
      ),
      create(
        Box,
        {
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: 'yellow',
          padding: 1,
          minHeight: OUTPUT_WINDOW_HEIGHT,
          maxHeight: OUTPUT_WINDOW_HEIGHT,
          height: OUTPUT_WINDOW_HEIGHT,
          overflow: 'hidden',
          flexShrink: 0
        },
        ...logNodes
      ),
      create(
        Box,
        {marginTop: 1, flexDirection: 'row', justifyContent: 'space-between'},
        create(Text, {dimColor: true}, running ? 'Type to feed stdin; Enter submits, Ctrl+C aborts.' : 'Run a command or press ? for extra help.'),
        create(Text, {dimColor: true}, `${toggleHint}, Shift+S toggles the structure guide`)
      ),
      create(
        Box,
        {
          marginTop: 1,
          flexDirection: 'row',
          borderStyle: 'round',
          borderColor: running ? 'green' : 'gray',
          paddingX: 1
        },
        create(Text, {bold: true, color: running ? 'green' : 'white'}, running ? ' Stdin buffer ' : ' Input ready '),
        create(Text, {dimColor: true, marginLeft: 1}, running ? (stdinBuffer || '(type to send)') : 'Start a command to feed stdin')
      )
    ),
    helpSection,
    structureGuide,
    helpOverlay
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
    } else if (token === '--studio') {
      args.view = 'studio';
    }
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
    console.log('  Shift+X               Clear the output log buffer');
    console.log('  Shift+E               Export current logs to a .txt file');
    console.log('  Shift+↑ / ↓           Scroll the output logs back/forward');
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
    projects.forEach((project) => {
      console.log(` • [${project.type}] ${project.name} (${project.path})`);
    });
    return;
  }

  render(create(Compass, {rootPath, initialView: args.view || 'navigator'}));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
