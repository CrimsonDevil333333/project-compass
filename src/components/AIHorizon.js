import React, {useState, useEffect, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter (DeepSeek/Qwen)', endpoint: 'openrouter.ai' },
  { id: 'gemini', name: 'Google Gemini', endpoint: 'api.google.com' },
  { id: 'claude', name: 'Anthropic Claude', endpoint: 'api.anthropic.com' },
  { id: 'ollama', name: 'Ollama (Local)', endpoint: 'localhost:11434' }
];

const AIHorizon = memo(({rootPath, selectedProject, onRunCommand, CursorText, config, setConfig, saveConfig}) => {
  const savedProvider = config?.aiProvider || 'openrouter';
  const savedModel = config?.aiModel || 'deepseek-r1';
  
  const [step, setStep] = useState(config?.aiProvider ? 'analyze' : 'select'); 
  const [providerIdx, setProviderIdx] = useState(AI_PROVIDERS.findIndex(p => p.id === savedProvider) || 0);
  const [model, setModel] = useState(savedModel);
  const [cursor, setCursor] = useState(model.length);
  const [status, setStatus] = useState('ready'); // ready | busy | done

  useInput((input, key) => {
    if (step === 'select') {
      if (key.upArrow) setProviderIdx(p => (p - 1 + AI_PROVIDERS.length) % AI_PROVIDERS.length);
      if (key.downArrow) setProviderIdx(p => (p + 1) % AI_PROVIDERS.length);
      if (key.return) {
        const nextProvider = AI_PROVIDERS[providerIdx].id;
        const nextConfig = { ...config, aiProvider: nextProvider };
        setConfig(nextConfig);
        saveConfig(nextConfig);
        setStep('model');
      }
    } else if (step === 'model') {
      if (key.return) {
        const nextConfig = { ...config, aiModel: model };
        setConfig(nextConfig);
        saveConfig(nextConfig);
        setStep('analyze');
      }
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
      if (key.return && status === 'ready') {
        setStatus('busy');
        // Logic to simulate analysis and then "inject" BRIT commands
        setTimeout(() => {
          if (selectedProject) {
            const projectKey = selectedProject.path;
            const currentCustom = config.customCommands?.[projectKey] || [];
            const aiCommands = [
              { label: 'AI Build', command: ['npm', 'run', 'build'] },
              { label: 'AI Test', command: ['npm', 'test'] }
            ];
            const nextConfig = { 
              ...config, 
              customCommands: { ...config.customCommands, [projectKey]: [...currentCustom, ...aiCommands] } 
            };
            setConfig(nextConfig);
            saveConfig(nextConfig);
          }
          setStatus('done');
        }, 1500);
      }
      if (key.escape) setStep('model');
      if (input === 'r') setStep('select'); // Reconfigure
    }
  });

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'double', borderColor: 'magenta', padding: 1, width: '100%'},
    create(Text, {bold: true, color: 'magenta'}, '🤖 AI Horizon | Integrated Project Intelligence'),
    
    step === 'select' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, marginBottom: 1}, 'Step 1: Select AI Provider (Saved to config)'),
      ...AI_PROVIDERS.map((p, i) => create(Text, {key: p.id, color: i === providerIdx ? 'cyan' : 'white'}, (i === providerIdx ? '→ ' : '  ') + p.name)),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Save & Continue')
    ),

    step === 'model' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'yellow', marginBottom: 1}, 'Step 2: Model Identity'),
      create(Box, {flexDirection: 'row'},
        create(Text, null, 'Model ID: '),
        create(CursorText, {value: model, cursorIndex: cursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Save & Proceed, Esc: Back')
    ),

    step === 'analyze' && create(
      Box,
      {flexDirection: 'column'},
      create(Text, {bold: true, color: 'cyan', marginBottom: 1}, 'Ready to analyze: ' + (selectedProject ? selectedProject.name : 'Workspace')),
      create(Text, {dimColor: true}, 'Provider: ' + config.aiProvider + ' | Model: ' + config.aiModel),
      create(Box, {marginTop: 1, flexDirection: 'column'},
        status === 'ready' && create(Text, null, 'Press Enter to analyze DNA and configure BRIT commands.'),
        status === 'busy' && create(Text, {color: 'yellow'}, ' ⏳ Accessing intelligence... mapping project manifests...'),
        status === 'done' && create(Box, {flexDirection: 'column'},
          create(Text, {color: 'green', bold: true}, ' ✅ Analysis Complete!'),
          create(Text, null, ' Missing BRIT commands have been injected into your project config.'),
          create(Text, {dimColor: true, marginTop: 1}, 'Return to Navigator to use B/R/I/T macros.')
        )
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Esc: Back, R: Reconfigure Provider')
    )
  );
});

export default AIHorizon;
