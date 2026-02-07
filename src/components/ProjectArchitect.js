import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';
import path from 'path';

const create = React.createElement;

const ProjectArchitect = memo(({rootPath, onRunCommand, CursorText, onReturn}) => {
  const [step, setStep] = useState('framework'); // framework | path | name
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [targetPath, setTargetPath] = useState(rootPath);
  const [name, setName] = useState('');
  const [cursor, setCursor] = useState(0);

  const frameworks = [
    {name: 'Next.js', cmd: (p, n) => ['npx', 'create-next-app@latest', path.join(p, n)]},
    {name: 'React (Vite)', cmd: (p, n) => ['npm', 'create', 'vite@latest', path.join(p, n), '--', '--template', 'react']},
    {name: 'Vue (Vite)', cmd: (p, n) => ['npm', 'create', 'vite@latest', path.join(p, n), '--', '--template', 'vue']},
    {name: 'Rust (Binary)', cmd: (p, n) => ['cargo', 'new', path.join(p, n)]},
    {name: 'Python (Basic)', cmd: (p, n) => ['mkdir', '-p', path.join(p, n)]},
    {name: 'Go Module', cmd: (p, n) => ['mkdir', '-p', path.join(p, n), '&&', 'cd', path.join(p, n), '&&', 'go', 'mod', 'init', n]}
  ];

  useInput((inputStr, key) => {
    if (step === 'framework') {
      if (key.upArrow) setSelectedIdx(prev => (prev - 1 + frameworks.length) % frameworks.length);
      if (key.downArrow) setSelectedIdx(prev => (prev + 1) % frameworks.length);
      if (key.return) setStep('path');
      return;
    }

    if (step === 'path' || step === 'name') {
      if (key.return) {
        if (step === 'path') {
          setStep('name');
          setCursor(0);
        } else if (name.trim()) {
          const f = frameworks[selectedIdx];
          onRunCommand({
            label: `Scaffold ${f.name}: ${name}`,
            command: f.cmd(targetPath, name.trim())
          });
          onReturn();
        }
        return;
      }
      if (key.escape) {
        if (step === 'name') setStep('path');
        else setStep('framework');
        setCursor(0);
        return;
      }
      
      const val = step === 'path' ? targetPath : name;
      const setVal = step === 'path' ? setTargetPath : setName;

      if (key.backspace || key.delete) {
        if (cursor > 0) {
          setVal(prev => prev.slice(0, cursor - 1) + prev.slice(cursor));
          setCursor(c => Math.max(0, c - 1));
        }
        return;
      }
      if (key.leftArrow) { setCursor(c => Math.max(0, c - 1)); return; }
      if (key.rightArrow) { setCursor(c => Math.min(val.length, c + 1)); return; }
      if (inputStr) {
        setVal(prev => prev.slice(0, cursor) + inputStr + prev.slice(cursor));
        setCursor(c => c + inputStr.length);
      }
    }
  });

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'round', borderColor: 'cyan', padding: 1, width: '100%'},
    create(Text, {bold: true, color: 'cyan'}, '🏗️ Project Architect | Scaffold New Workspace'),
    create(Text, {dimColor: true, marginBottom: 1}, 'Generator will run in the background via Orbit.'),

    step === 'framework' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, marginBottom: 1}, 'Step 1: Select Template'),
      ...frameworks.map((f, i) => create(Text, {key: f.name, color: i === selectedIdx ? 'cyan' : 'white'}, `${i === selectedIdx ? '→' : ' '} ${f.name}`)),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Confirm Template, Shift+N: Exit')
    ),

    step === 'path' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'yellow', marginBottom: 1}, `Step 2: Target Directory [${frameworks[selectedIdx].name}]`),
      create(Box, {flexDirection: 'row'},
        create(Text, null, 'Root Path: '),
        create(CursorText, {value: targetPath, cursorIndex: cursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Confirm Path, Esc: Back')
    ),

    step === 'name' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'green', marginBottom: 1}, `Step 3: Project Name`),
      create(Box, {flexDirection: 'row'},
        create(Text, null, 'Name: '),
        create(CursorText, {value: name, cursorIndex: cursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Create Project, Esc: Back')
    )
  );
});

export default ProjectArchitect;
