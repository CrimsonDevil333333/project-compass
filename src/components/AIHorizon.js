import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const AI_PROVIDERS = [
  { id: 'ollama', name: 'Ollama (Local)', endpoint: 'http://localhost:11434' },
  { id: 'gemini', name: 'Google Gemini', endpoint: 'api.google.com' },
  { id: 'claude', name: 'Anthropic Claude', endpoint: 'api.anthropic.com' }
];

const AIHorizon = memo(({rootPath, selectedProject, onRunCommand, CursorText}) => {
  const [step, setStep] = useState('select'); 
  const [providerIdx, setProviderIdx] = useState(0);

  useInput((input, key) => {
    if (step === 'select') {
      if (key.upArrow) setProviderIdx(p => (p - 1 + AI_PROVIDERS.length) % AI_PROVIDERS.length);
      if (key.downArrow) setProviderIdx(p => (p + 1) % AI_PROVIDERS.length);
      if (key.return) setStep('analyze');
    }
  });

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'double', borderColor: 'magenta', padding: 1, width: '100%'},
    create(Text, {bold: true, color: 'magenta'}, '🤖 AI Horizon | Intelligent Workspace Analysis'),
    create(Text, {dimColor: true, marginBottom: 1}, 'Powering your terminal with agentic intelligence.'),

    step === 'select' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, marginBottom: 1}, 'Step 1: Select AI Intelligence Engine'),
      ...AI_PROVIDERS.map((p, i) => create(Text, {key: p.id, color: i === providerIdx ? 'cyan' : 'white'}, (i === providerIdx ? '→ ' : '  ') + p.name + ' (' + p.endpoint + ')')),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Connect & Analyze Project, Esc: Return')
    ),

    step === 'analyze' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'yellow', marginBottom: 1}, 'Analyzing Workspace...'),
      create(Text, null, ' ⏳ Deep scanning project DNA... [AI Synced]'),
      create(Text, {marginTop: 1}, 'Esc: Back to Selection')
    )
  );
});

export default AIHorizon;
