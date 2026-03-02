import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const PackageRegistry = memo(({selectedProject, projects = [], onRunCommand, CursorText, onSelectProject}) => {
  const [view, setView] = useState(selectedProject ? 'manage' : 'select'); // select | manage
  const [mode, setMode] = useState('list'); // list | add | remove
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(0);
  const [selIdx, setSelIdx] = useState(0);

  const activeProject = view === 'manage' ? selectedProject : projects[selIdx];
  const projectType = activeProject?.type || 'Unknown';
  const deps = activeProject?.metadata?.dependencies || [];

  useInput((inputStr, key) => {
    if (view === 'select') {
      if (key.upArrow) { setSelIdx(prev => (prev - 1 + projects.length) % projects.length); return; }
      if (key.downArrow) { setSelIdx(prev => (prev + 1) % projects.length); return; }
      if (key.return && projects[selIdx]) {
        if (onSelectProject) onSelectProject(selIdx);
        setView('manage');
        return;
      }
      return;
    }

    if (mode === 'add' || mode === 'remove') {
      if (key.return) {
        if (input.trim()) {
          const cmd = mode === 'add' ? getAddCmd(projectType, input.trim()) : getRemoveCmd(projectType, input.trim());
          if (cmd) onRunCommand({label: `${mode === 'add' ? 'Add' : 'Remove'} ${input}`, command: cmd}, activeProject);
        }
        setMode('list'); setInput(''); setCursor(0);
        return;
      }
      if (key.escape) { setMode('list'); setInput(''); setCursor(0); return; }
      if (key.backspace || key.delete) {
        if (cursor > 0) {
          setInput(prev => prev.slice(0, cursor - 1) + prev.slice(cursor));
          setCursor(c => Math.max(0, c - 1));
        }
        return;
      }
      if (key.leftArrow) { setCursor(c => Math.max(0, c - 1)); return; }
      if (key.rightArrow) { setCursor(c => Math.min(input.length, c + 1)); return; }
      if (inputStr) {
        setInput(prev => prev.slice(0, cursor) + inputStr + prev.slice(cursor));
        setCursor(c => c + inputStr.length);
      }
      return;
    }

    if (inputStr.toLowerCase() === 'a') { setMode('add'); setInput(''); setCursor(0); }
    if (inputStr.toLowerCase() === 'r') { setMode('remove'); setInput(''); setCursor(0); }
    if (inputStr.toLowerCase() === 's') { setView('select'); }
    if (inputStr.toLowerCase() === 'v' && projectType === 'Python') {
      onRunCommand({label: 'Create venv', command: ['python3', '-m', 'venv', '.venv']}, activeProject);
    }
  });

  const getAddCmd = (type, pkg) => {
    if (type === 'Node.js') return ['npm', 'install', pkg];
    if (type === 'Python') return ['pip', 'install', pkg];
    if (type === 'Rust') return ['cargo', 'add', pkg];
    if (type === '.NET') return ['dotnet', 'add', 'package', pkg];
    if (type === 'PHP') return ['composer', 'require', pkg];
    return null;
  };

  const getRemoveCmd = (type, pkg) => {
    if (type === 'Node.js') return ['npm', 'uninstall', pkg];
    if (type === 'Python') return ['pip', 'uninstall', '-y', pkg];
    if (type === 'Rust') return ['cargo', 'remove', pkg];
    if (type === '.NET') return ['dotnet', 'remove', 'package', pkg];
    if (type === 'PHP') return ['composer', 'remove', pkg];
    return null;
  };

  if (view === 'select') {
    return create(
      Box,
      {flexDirection: 'column', borderStyle: 'round', borderColor: 'cyan', padding: 1, width: '100%'},
      create(Text, {bold: true, color: 'cyan'}, '📦 Package Registry | Select Project'),
      create(Text, {dimColor: true, marginBottom: 1}, 'Choose a project to manage dependencies:'),
      ...projects.map((p, i) => create(Text, {key: p.id, color: i === selIdx ? 'cyan' : 'white'}, `${i === selIdx ? '→' : ' '} ${p.icon} ${p.name} (${p.type})`)),
      create(Text, {dimColor: true, marginTop: 1}, 'Arrows: Move, Enter: Select, Shift+P: Back')
    );
  }

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'round', borderColor: 'magenta', padding: 1, width: '100%'},
    create(
      Box,
      {justifyContent: 'space-between'},
      create(Text, {bold: true, color: 'magenta'}, `📦 Package Registry | ${activeProject?.name}`),
      create(Text, {dimColor: true}, projectType)
    ),
    create(Text, {dimColor: true, marginBottom: 1}, 'Manage dependencies and environments for this project.'),
    mode === 'list'
      ? create(
          Box,
          {flexDirection: 'column'},
          create(Text, {bold: true}, `Installed Dependencies (${deps.length}):`),
          create(
            Box,
            {flexDirection: 'row', flexWrap: 'wrap'},
            ...deps.map(d => create(Text, {key: d, dimColor: true}, ` ${d} `))
          ),
          create(
            Box,
            {marginTop: 1, flexDirection: 'column'},
            create(Text, {color: 'cyan'}, 'A: Add Package  |  R: Remove Package'),
            create(Text, {color: 'blue'}, 'S: Switch Project'),
            projectType === 'Python' && create(Text, {color: 'yellow'}, 'V: Create .venv'),
            create(Text, {dimColor: true, marginTop: 1}, 'Press Shift+P or Esc to return to Navigator.')
          )
        )
      : create(
          Box,
          {flexDirection: 'column'},
          create(Text, {bold: true, color: 'cyan'}, mode === 'add' ? 'ADD NEW PACKAGE' : 'REMOVE PACKAGE'),
          create(
            Box,
            {flexDirection: 'row'},
            create(Text, null, 'Enter package name: '),
            create(CursorText, {value: input, cursorIndex: cursor})
          ),
          create(Text, {dimColor: true, marginTop: 1}, 'Enter: Confirm, Esc: Cancel')
        )
  );
});

export default PackageRegistry;
