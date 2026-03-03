/* global setTimeout, fetch */
import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';

const create = React.createElement;

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions' },
  { id: 'gemini', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent' },
  { id: 'claude', name: 'Anthropic Claude', endpoint: 'https://api.anthropic.com/v1/messages' },
  { id: 'ollama', name: 'Ollama (Local)', endpoint: 'http://localhost:11434/api/generate' }
];

const AIHorizon = memo(({selectedProject, CursorText, config, setConfig, saveConfig}) => {
  const [step, setStep] = useState(config?.aiToken ? 'analyze' : 'provider');
  const [providerIdx, setProviderIdx] = useState(AI_PROVIDERS.findIndex(p => p.id === (config?.aiProvider || 'openrouter')) || 0);
  const [model, setModel] = useState(config?.aiModel || 'deepseek/deepseek-r1');
  const [token, setToken] = useState(config?.aiToken || '');
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const runRealAnalysis = async () => {
    setStatus('busy');
    setError(null);
    const provider = AI_PROVIDERS[providerIdx];
    
    try {
      const projectData = JSON.stringify({
        name: selectedProject.name,
        type: selectedProject.type,
        manifest: selectedProject.manifest,
        scripts: selectedProject.metadata?.scripts || {},
        dependencies: selectedProject.metadata?.dependencies || []
      });

      const prompt = `Analyze this project structure and suggest valid CLI commands for:
1. Build
2. Run
3. Install
4. Test

Project Data: ${projectData}

Return ONLY a JSON object with this structure: {"build": "cmd", "run": "cmd", "install": "cmd", "test": "cmd"}. 
Use the project's detected type (${selectedProject.type}) to ensure commands are correct (e.g., npm, pip, cargo).`;

      let response;
      let aiText = '';

      if (provider.id === 'openrouter') {
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/CrimsonDevil333333/project-compass',
            'X-Title': 'Project Compass'
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'OpenRouter Error');
        aiText = data.choices[0].message.content;
      } else if (provider.id === 'gemini') {
        const url = provider.endpoint.replace('{model}', model) + `?key=${token}`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gemini Error');
        aiText = data.candidates[0].content.parts[0].text;
      } else if (provider.id === 'claude') {
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: { 
            'x-api-key': token,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Claude Error');
        aiText = data.content[0].text;
      } else if (provider.id === 'ollama') {
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, prompt: prompt, stream: false })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ollama Error');
        aiText = data.response;
      }

      const jsonMatch = aiText.match(/{.*?}/s);
      if (!jsonMatch) throw new Error("AI returned invalid DNA mapping format.");
      
      const parsed = JSON.parse(jsonMatch[0]);
      const mapped = [
        { label: 'AI Build', command: parsed.build.split(' ') },
        { label: 'AI Run', command: parsed.run.split(' ') },
        { label: 'AI Install', command: parsed.install.split(' ') },
        { label: 'AI Test', command: parsed.test.split(' ') }
      ];

      setSuggestions(mapped);
      const projectKey = selectedProject.path;
      const currentCustom = config.customCommands?.[projectKey] || [];
      const nextConfig = { 
        ...config, 
        customCommands: { ...config.customCommands, [projectKey]: [...currentCustom, ...mapped] } 
      };
      setConfig(nextConfig); saveConfig(nextConfig);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('ready');
    }
  };

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
        runRealAnalysis();
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
        status === 'ready' && create(Text, null, 'Press Enter to perform real agentic analysis and auto-configure macros.'),
        status === 'busy' && create(Text, {color: 'yellow'}, ' ⏳ Contacting AI Agent... mapping project structure...'),
        status === 'done' && create(Box, {flexDirection: 'column'},
          create(Text, {color: 'green', bold: true}, ' ✅ DNA Mapped via AI Agent!'),
          create(Text, null, ' Successfully injected ' + suggestions.length + ' optimized commands into project config.'),
          create(Text, {dimColor: true, marginTop: 1}, 'Return to Navigator to use BRIT shortcuts.')
        ),
        error && create(Text, {color: 'red', bold: true, marginTop: 1}, ' ✗ AI ERROR: ' + error)
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Esc: Return, R: Reset Credentials')
    )
  );
});

export default AIHorizon;
