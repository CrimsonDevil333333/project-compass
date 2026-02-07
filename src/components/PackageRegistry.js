import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const PackageRegistry = memo(({selectedProject, onRunCommand, CursorText}) => {
  const [mode, setMode] = useState('list'); // list | add | remove
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(0);

  const projectType = selectedProject?.type || 'Unknown';
  const deps = selectedProject?.metadata?.dependencies || [];

  useInput((inputStr, key) => {
    if (mode === 'add' || mode === 'remove') {
      if (key.return) {
        if (input.trim()) {
          const cmd = mode === 'add' ? getAddCmd(projectType, input.trim()) : getRemoveCmd(projectType, input.trim());
          if (cmd) onRunCommand({label: `${mode === 'add' ? 'Add' : 'Remove'} ${input}`, command: cmd});
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
    if (inputStr.toLowerCase() === 'v' && projectType === 'Python') {
      onRunCommand({label: 'Create venv', command: ['python3', '-m', 'venv', '.venv']});
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

  if (!selectedProject) {
    return create(
      Box,
      {flexDirection: 'column', borderStyle: 'round', borderColor: 'red', padding: 1, width: '100%'},
      create(Text, {bold: true, color: 'red'}, '📦 Package Registry | No Project Selected'),
      create(Text, {marginTop: 1}, 'Please select a project in the Navigator first before opening the Registry.'),
      create(Text, {dimColor: true, marginTop: 1}, 'Press Shift+P to return to Navigator.')
    );
  }

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'round', borderColor: 'magenta', padding: 1, width: '100%'},
    create(
      Box,
      {justifyContent: 'space-between'},
      create(Text, {bold: true, color: 'magenta'}, `📦 Package Registry | ${selectedProject?.name}`),
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
            projectType === 'Python' && create(Text, {color: 'yellow'}, 'V: Create .venv'),
            create(Text, {dimColor: true, marginTop: 1}, 'Press Shift+P to return to Navigator.')
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
