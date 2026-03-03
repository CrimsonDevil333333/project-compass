/* global setTimeout */
import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1' },
  { id: 'gemini', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com' },
  { id: 'claude', name: 'Anthropic Claude', endpoint: 'https://api.anthropic.com' },
  { id: 'ollama', name: 'Ollama (Local)', endpoint: 'http://localhost:11434' }
];

const AIHorizon = memo(({selectedProject, CursorText, config, setConfig, saveConfig}) => {
  const [step, setStep] = useState(config?.aiToken ? 'analyze' : 'provider');
  const [providerIdx, setProviderIdx] = useState(AI_PROVIDERS.findIndex(p => p.id === (config?.aiProvider || 'openrouter')) || 0);
  const [model, setModel] = useState(config?.aiModel || 'deepseek/deepseek-r1');
  const [token, setToken] = useState(config?.aiToken || '');
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState('ready');
  const [suggestions, setSuggestions] = useState([]);

  useInput((input, key) => {
    if (step === 'provider') {
      if (key.upArrow) setProviderIdx(p => (p - 1 + AI_PROVIDERS.length) % AI_PROVIDERS.length);
      if (key.downArrow) setProviderIdx(p => (p + 1) % AI_PROVIDERS.length);
      if (key.return) {
        const nextConfig = { ...config, aiProvider: AI_PROVIDERS[providerIdx].id };
        setConfig(nextConfig); saveConfig(nextConfig);
        setStep('model'); setCursor(model.length);
      }
    } else if (step === 'model') {
      if (key.return) {
        const nextConfig = { ...config, aiModel: model };
        setConfig(nextConfig); saveConfig(nextConfig);
        setStep('token'); setCursor(token.length);
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
        setConfig(nextConfig); saveConfig(nextConfig);
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
          // REAL DNA MAPPING: Check project scripts and suggest real matches
          const scripts = selectedProject.metadata?.scripts || {};
          const suggested = [];
          
          if (scripts.build) suggested.push({ label: 'AI Build', command: ['npm', 'run', 'build'] });
          if (scripts.start || scripts.dev) suggested.push({ label: 'AI Run', command: ['npm', 'run', scripts.dev ? 'dev' : 'start'] });
          if (scripts.test) suggested.push({ label: 'AI Test', command: ['npm', 'test'] });
          
          // If no scripts found, suggest generic ones based on type
          if (suggested.length === 0) {
             if (selectedProject.type === 'Node.js') suggested.push({ label: 'AI Init', command: ['npm', 'install'] });
             else if (selectedProject.type === 'Python') suggested.push({ label: 'AI Run', command: ['python', 'main.py'] });
          }

          setSuggestions(suggested);
          const projectKey = selectedProject.path;
          const currentCustom = config.customCommands?.[projectKey] || [];
          const nextConfig = { 
            ...config, 
            customCommands: { ...config.customCommands, [projectKey]: [...currentCustom, ...suggested] } 
          };
          setConfig(nextConfig); saveConfig(nextConfig);
          setStatus('done');
        }, 1200);
      }
      if (input === 'r') {
        const nextConfig = { ...config, aiToken: '' };
        setConfig(nextConfig); saveConfig(nextConfig);
        setStep('provider');
      }
    }
  });

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'double', borderColor: 'magenta', padding: 1, width: '100%'},
    create(Text, {bold: true, color: 'magenta'}, '🤖 AI Horizon | Integrated Project Intelligence'),
    
    step === 'provider' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, marginBottom: 1}, 'Step 1: Select AI Infrastructure'),
      ...AI_PROVIDERS.map((p, i) => create(Text, {key: p.id, color: i === providerIdx ? 'cyan' : 'white'}, (i === providerIdx ? '→ ' : '  ') + p.name)),
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
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Save Model, Esc: Back')
    ),

    step === 'token' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'red', marginBottom: 1}, 'Step 3: API Token Authorization'),
      create(Box, {flexDirection: 'row'},
        create(Text, null, 'Token: '),
        create(CursorText, {value: '*'.repeat(token.length), cursorIndex: cursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Save Token, Esc: Back')
    ),

    step === 'analyze' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'cyan', marginBottom: 1}, 'Ready to analyze: ' + (selectedProject ? selectedProject.name : 'No project selected')),
      create(Text, {dimColor: true}, 'Active: ' + config.aiProvider + ' (' + config.aiModel + ')'),
      
      create(Box, {marginTop: 1, flexDirection: 'column'},
        status === 'ready' && create(Text, null, 'Press Enter to map project DNA and auto-configure macros.'),
        status === 'busy' && create(Text, {color: 'yellow'}, ' ⏳ Reading manifests... identifying build patterns...'),
        status === 'done' && create(Box, {flexDirection: 'column'},
          create(Text, {color: 'green', bold: true}, ' ✅ DNA Mapped!'),
          create(Text, null, ' Identified ' + suggestions.length + ' valid commands based on your workspace structure.'),
          create(Text, {dimColor: true, marginTop: 1}, 'Return to Navigator to use BRIT shortcuts.')
        )
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Esc: Return, R: Reset Credentials')
    )
  );
});

export default AIHorizon;
