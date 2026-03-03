import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter (DeepSeek/Qwen)', endpoint: 'openrouter.ai' },
  { id: 'gemini', name: 'Google Gemini', endpoint: 'api.google.com' },
  { id: 'claude', name: 'Anthropic Claude', endpoint: 'api.anthropic.com' },
  { id: 'ollama', name: 'Ollama (Local)', endpoint: 'localhost:11434' }
];

const AIHorizon = memo(({rootPath, selectedProject, onRunCommand, CursorText}) => {
  const [step, setStep] = useState('select'); // select | model | analyze
  const [providerIdx, setProviderIdx] = useState(0);
  const [model, setModel] = useState('deepseek-r1');
  const [cursor, setCursor] = useState(model.length);

  useInput((input, key) => {
    if (step === 'select') {
      if (key.upArrow) setProviderIdx(p => (p - 1 + AI_PROVIDERS.length) % AI_PROVIDERS.length);
      if (key.downArrow) setProviderIdx(p => (p + 1) % AI_PROVIDERS.length);
      if (key.return) setStep('model');
    } else if (step === 'model') {
      if (key.return) setStep('analyze');
      if (key.escape) setStep('select');
      if (key.backspace || key.delete) {
        if (cursor > 0) {
          setModel(prev => prev.slice(0, cursor - 1) + prev.slice(cursor));
          setCursor(c => Math.max(0, c - 1));
        }
      } else if (input && !key.ctrl && !key.meta) {
        setModel(prev => prev.slice(0, cursor) + input + prev.slice(cursor));
        setCursor(c => c + input.length);
      }
    } else if (step === 'analyze') {
      if (key.escape) setStep('model');
    }
  });

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'double', borderColor: 'magenta', padding: 1, width: '100%'},
    create(Text, {bold: true, color: 'magenta'}, '🤖 AI Horizon | Intelligent Workspace Analysis'),
    create(Text, {dimColor: true, marginBottom: 1}, 'Directly analyzing ' + (selectedProject ? selectedProject.name : 'Workspace')),

    step === 'select' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, marginBottom: 1}, 'Step 1: Select Intelligence Engine'),
      ...AI_PROVIDERS.map((p, i) => create(Text, {key: p.id, color: i === providerIdx ? 'cyan' : 'white'}, (i === providerIdx ? '→ ' : '  ') + p.name)),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Continue, Esc: Return')
    ),

    step === 'model' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'yellow', marginBottom: 1}, 'Step 2: Intelligence Model'),
      create(Box, {flexDirection: 'row'},
        create(Text, null, 'Model ID: '),
        create(CursorText, {value: model, cursorIndex: cursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Analyze Project, Esc: Back')
    ),

    step === 'analyze' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'green', marginBottom: 1}, 'Analyzing project DNA with ' + model + '...'),
      create(Text, null, ' 💡 AI Suggestion for ' + (selectedProject ? selectedProject.name : 'root') + ':'),
      create(Text, {color: 'cyan', marginTop: 1}, ' > suggested: ' + (selectedProject ? 'npm run dev' : 'project-compass --dir .')),
      create(Text, {dimColor: true, marginTop: 1}, 'Press Shift+C to save this command, Esc to go back.')
    )
  );
});

export default AIHorizon;
