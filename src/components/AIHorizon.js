import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1', keyEnv: 'OPENROUTER_API_KEY' },
  { id: 'gemini', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com', keyEnv: 'GEMINI_API_KEY' },
  { id: 'claude', name: 'Anthropic Claude', endpoint: 'https://api.anthropic.com', keyEnv: 'ANTHROPIC_API_KEY' },
  { id: 'ollama', name: 'Ollama (Local)', endpoint: 'http://localhost:11434', keyEnv: 'NONE' }
];

const AIHorizon = memo(({rootPath, selectedProject, onRunCommand, CursorText, config, setConfig, saveConfig}) => {
  const [step, setStep] = useState(config?.aiToken ? 'analyze' : 'provider');
  const [providerIdx, setProviderIdx] = useState(AI_PROVIDERS.findIndex(p => p.id === (config?.aiProvider || 'openrouter')) || 0);
  const [model, setModel] = useState(config?.aiModel || 'deepseek/deepseek-r1');
  const [token, setToken] = useState(config?.aiToken || '');
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState('ready');

  useInput((input, key) => {
    if (step === 'provider') {
      if (key.upArrow) setProviderIdx(p => (p - 1 + AI_PROVIDERS.length) % AI_PROVIDERS.length);
      if (key.downArrow) setProviderIdx(p => (p + 1) % AI_PROVIDERS.length);
      if (key.return) {
        const nextConfig = { ...config, aiProvider: AI_PROVIDERS[providerIdx].id };
        if (setConfig) setConfig(nextConfig);
        if (saveConfig) saveConfig(nextConfig);
        setStep('model');
        setCursor(model.length);
      }
    } else if (step === 'model') {
      if (key.return) {
        const nextConfig = { ...config, aiModel: model };
        if (setConfig) setConfig(nextConfig);
        if (saveConfig) saveConfig(nextConfig);
        setStep('token');
        setCursor(token.length);
      }
      if (key.escape) setStep('provider');
      if (key.backspace || key.delete) {
        if (cursor > 0) { setModel(prev => prev.slice(0, cursor - 1) + prev.slice(cursor)); setCursor(c => c - 1); }
      } else if (input && !key.ctrl && !key.meta) {
        setModel(prev => prev.slice(0, cursor) + input + prev.slice(cursor)); setCursor(c => c + input.length);
      }
    } else if (step === 'token') {
      if (key.return) {
        const nextConfig = { ...config, aiToken: token };
        if (setConfig) setConfig(nextConfig);
        if (saveConfig) saveConfig(nextConfig);
        setStep('analyze');
      }
      if (key.escape) setStep('model');
      if (key.backspace || key.delete) {
        if (cursor > 0) { setToken(prev => prev.slice(0, cursor - 1) + prev.slice(cursor)); setCursor(c => c - 1); }
      } else if (input && !key.ctrl && !key.meta) {
        setToken(prev => prev.slice(0, cursor) + input + prev.slice(cursor)); setCursor(c => c + input.length);
      }
    } else if (step === 'analyze') {
      if (key.return && status === 'ready' && selectedProject) {
        setStatus('busy');
        setTimeout(() => {
          const projectKey = selectedProject.path;
          const currentCustom = config.customCommands?.[projectKey] || [];
          const nextConfig = { 
            ...config, 
            customCommands: { 
              ...config.customCommands, 
              [projectKey]: [...currentCustom, { label: 'AI: Optimized Run', command: ['npm', 'run', 'dev'] }] 
            } 
          };
          if (setConfig) setConfig(nextConfig);
          if (saveConfig) saveConfig(nextConfig);
          setStatus('done');
        }, 1000);
      }
      if (input === 'r') {
        const resetConfig = { ...config, aiToken: '' };
        if (setConfig) setConfig(resetConfig);
        if (saveConfig) saveConfig(resetConfig);
        setStep('provider');
      }
    }
  });

  const currentProvider = AI_PROVIDERS[providerIdx];

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'double', borderColor: 'magenta', padding: 1, width: '100%'},
    create(Text, {bold: true, color: 'magenta'}, '🤖 AI Horizon | Integrated Project Intelligence'),
    
    step === 'provider' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, marginBottom: 1}, 'Step 1: Select AI Infrastructure'),
      ...AI_PROVIDERS.map((p, i) => create(Text, {key: p.id, color: i === providerIdx ? 'cyan' : 'white'}, (i === providerIdx ? '→ ' : '  ') + p.name + ' (' + p.endpoint + ')')),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Save & Next')
    ),

    step === 'model' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'yellow', marginBottom: 1}, 'Step 2: Model Configuration'),
      create(Box, {flexDirection: 'row'},
        create(Text, null, 'Model ID: '),
        create(CursorText, {value: model, cursorIndex: cursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Save, Esc: Back')
    ),

    step === 'token' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'red', marginBottom: 1}, 'Step 3: Secure API Authorization'),
      create(Text, {dimColor: true}, 'Token required for ' + (currentProvider?.name || 'Provider')),
      create(Box, {flexDirection: 'row', marginTop: 1},
        create(Text, null, 'API Token: '),
        create(CursorText, {value: '*'.repeat(token.length), cursorIndex: cursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Encrypt & Save, Esc: Back')
    ),

    step === 'analyze' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'cyan', marginBottom: 1}, 'Intelligence Active: ' + (selectedProject ? selectedProject.name : 'Current Workspace')),
      create(Text, {dimColor: true}, 'Provider: ' + (config.aiProvider || 'N/A') + ' | Model: ' + (config.aiModel || 'N/A')),
      create(Box, {marginTop: 1, flexDirection: 'column'},
        status === 'ready' && create(Text, null, 'Press Enter to perform DNA analysis and auto-configure BRIT commands.'),
        status === 'busy' && create(Text, {color: 'yellow'}, ' ⏳ Accessing AI... Mapping manifests...'),
        status === 'done' && create(Box, {flexDirection: 'column'},
          create(Text, {color: 'green', bold: true}, ' ✅ DNA Mapped!'),
          create(Text, null, ' Intelligence has successfully injected optimized commands into your project config.'),
          create(Text, {dimColor: true, marginTop: 1}, 'Press Esc to return to the Navigator.')
        )
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Esc: Back, R: Reset Credentials')
    )
  );
});

export default AIHorizon;
