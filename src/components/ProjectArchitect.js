import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const ProjectArchitect = memo(({onRunCommand, CursorText}) => {
  const [step, setStep] = useState('framework'); // framework | name
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [name, setName] = useState('');
  const [cursor, setCursor] = useState(0);

  const frameworks = [
    {name: 'Next.js', cmd: (n) => ['npx', 'create-next-app@latest', n]},
    {name: 'React (Vite)', cmd: (n) => ['npm', 'create', 'vite@latest', n, '--', '--template', 'react']},
    {name: 'Vue (Vite)', cmd: (n) => ['npm', 'create', 'vite@latest', n, '--', '--template', 'vue']},
    {name: 'Rust (Binary)', cmd: (n) => ['cargo', 'new', n]},
    {name: 'Python (Basic)', cmd: (n) => ['mkdir', n]},
    {name: 'Go Module', cmd: (n) => ['mkdir', n, '&&', 'cd', n, '&&', 'go', 'mod', 'init', n]}
  ];

  useInput((inputStr, key) => {
    if (step === 'framework') {
      if (key.upArrow) setSelectedIdx(prev => (prev - 1 + frameworks.length) % frameworks.length);
      if (key.downArrow) setSelectedIdx(prev => (prev + 1) % frameworks.length);
      if (key.return) setStep('name');
      return;
    }

    if (step === 'name') {
      if (key.return) {
        if (name.trim()) {
          const f = frameworks[selectedIdx];
          onRunCommand({label: `Create ${f.name} project: ${name}`, command: f.cmd(name.trim())});
        }
        setStep('framework'); setName(''); setCursor(0);
        return;
      }
      if (key.escape) { setStep('framework'); setName(''); setCursor(0); return; }
      if (key.backspace || key.delete) {
        if (cursor > 0) {
          setName(prev => prev.slice(0, cursor - 1) + prev.slice(cursor));
          setCursor(c => Math.max(0, c - 1));
        }
        return;
      }
      if (key.leftArrow) { setCursor(c => Math.max(0, c - 1)); return; }
      if (key.rightArrow) { setCursor(c => Math.min(name.length, c + 1)); return; }
      if (inputStr) {
        setName(prev => prev.slice(0, cursor) + inputStr + prev.slice(cursor));
        setCursor(c => c + inputStr.length);
      }
    }
  });

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'round', borderColor: 'cyan', padding: 1},
    create(Text, {bold: true, color: 'cyan'}, '🏗️ Project Architect | Generator'),
    create(Text, {dimColor: true, marginBottom: 1}, 'Create new projects from industry-standard templates.'),
    step === 'framework'
      ? create(
          Box,
          {flexDirection: 'column'},
          create(Text, {bold: true}, 'Select Framework:'),
          ...frameworks.map((f, i) => create(Text, {key: f.name, color: i === selectedIdx ? 'cyan' : 'white'}, `${i === selectedIdx ? '→' : ' '} ${f.name}`)),
          create(Text, {dimColor: true, marginTop: 1}, 'Enter: Pick Framework, Shift+N: Return to Navigator.')
        )
      : create(
          Box,
          {flexDirection: 'column'},
          create(Text, {bold: true, color: 'cyan'}, 'PROJECT NAME'),
          create(
            Box,
            {flexDirection: 'row'},
            create(Text, null, 'Enter name: '),
            create(CursorText, {value: name, cursorIndex: cursor})
          ),
          create(Text, {dimColor: true, marginTop: 1}, 'Enter: Create Project, Esc: Back to Frameworks')
        )
  );
});

export default ProjectArchitect;
