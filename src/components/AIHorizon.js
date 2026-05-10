/* global fetch */
import React, {useState, memo} from 'react';
import {Box, Text, useInput} from 'ink';
import fs from 'fs';
import path from 'path';

const create = React.createElement;

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions' },
  { id: 'gemini', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent' },
  { id: 'claude', name: 'Anthropic Claude', endpoint: 'https://api.anthropic.com/v1/messages' },
  { id: 'ollama', name: 'Ollama (Local)', endpoint: 'http://localhost:11434/api/generate' }
];

function readProjectFile(projectPath, filename) {
  const fullPath = path.join(projectPath, filename);
  try {
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8').slice(0, 3000);
    }
  } catch {
    // file may not be readable
  }
  return null;
}

function buildProjectContext(project, rootPath) {
  const lines = [];
  lines.push(`Project: ${project.name}`);
  lines.push(`Type: ${project.type}`);
  lines.push(`Location: ${path.relative(rootPath, project.path) || '.'}`);
  lines.push(`Manifest: ${project.manifest}`);
  if (project.description) lines.push(`Description: ${project.description}`);
  if (project.frameworks?.length) {
    lines.push(`Frameworks: ${project.frameworks.map(f => f.name).join(', ')}`);
  }
  const readme = readProjectFile(project.path, 'README.md') || readProjectFile(project.path, 'Readme.md') || readProjectFile(project.path, 'readme.md');
  if (readme) {
    lines.push(`--- README ---\n${readme.slice(0, 2000)}\n--- END README ---`);
  } else {
    const mainCandidates = ['src/main.py', 'main.py', 'app.py', 'src/index.js', 'index.js', 'src/main.ts', 'main.ts', 'server.js', 'app.js'];
    for (const candidate of mainCandidates) {
      const content = readProjectFile(project.path, candidate);
      if (content) {
        lines.push(`--- ${candidate} ---\n${content.slice(0, 1500)}\n--- END ${candidate} ---`);
        break;
      }
    }
  }
  if (project.metadata?.scripts) {
    lines.push('Scripts: ' + JSON.stringify(project.metadata.scripts));
  }
  if (project.metadata?.dependencies?.length) {
    const depNames = project.metadata.dependencies.slice(0, 30).map(d => typeof d === 'string' ? d : d.name);
    lines.push('Dependencies: ' + depNames.join(', '));
  }
  return lines.join('\n');
}

const AIHorizon = memo(({rootPath, selectedProject, CursorText, config, setConfig, saveConfig}) => {
  const [step, setStep] = useState(config?.aiToken ? 'analyze' : 'provider');
  const providerIndex = AI_PROVIDERS.findIndex(p => p.id === (config?.aiProvider || 'openrouter'));
  const [providerIdx, setProviderIdx] = useState(providerIndex >= 0 ? providerIndex : 0);
  const [model, setModel] = useState(config?.aiModel || 'deepseek/deepseek-r1');
  const [token, setToken] = useState(config?.aiToken || '');
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [rawAIResponse, setRawAIResponse] = useState('');

  const runRealAnalysis = async () => {
    setStatus('busy');
    setError(null);
    setRawAIResponse('');
    const provider = AI_PROVIDERS[providerIdx];

    try {
      const projectContext = buildProjectContext(selectedProject, rootPath);

      const prompt = `You are analyzing a software project. Based on the project data below, suggest valid CLI commands for:
1. Build
2. Run (with port flag if applicable)
3. Install dependencies
4. Test

Project Data:
${projectContext}

Return ONLY a JSON object with this structure:
{"build": "build command here", "run": "run command here", "install": "install command here", "test": "test command here"}

Use the project's detected type (${selectedProject.type}) to ensure commands are correct. Do NOT wrap the JSON in markdown code blocks.`;

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
        if (!response.ok) throw new Error(data.error?.message || data.error || 'OpenRouter Error');
        aiText = data.choices?.[0]?.message?.content || '';
      } else if (provider.id === 'gemini') {
        const url = provider.endpoint.replace('{model}', model) + `?key=${token}`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || data.error || 'Gemini Error');
        aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
        if (!response.ok) throw new Error(data.error?.message || data.error || 'Claude Error');
        aiText = data.content?.[0]?.text || '';
      } else if (provider.id === 'ollama') {
        response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model, prompt: prompt, stream: false })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Ollama Error');
        aiText = data.response || '';
      }

      if (!aiText) throw new Error('Empty response from AI provider');

      setRawAIResponse(aiText);

      let jsonStr = aiText;
      const codeBlockMatch = aiText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }
      const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error("AI returned invalid JSON format. Raw response:\n" + aiText.slice(0, 500));

      const parsed = JSON.parse(jsonMatch[0]);
      const mapped = [
        { label: 'AI Build', command: String(parsed.build || '').trim().split(/\s+/) },
        { label: 'AI Run', command: String(parsed.run || '').trim().split(/\s+/) },
        { label: 'AI Install', command: String(parsed.install || '').trim().split(/\s+/) },
        { label: 'AI Test', command: String(parsed.test || '').trim().split(/\s+/) }
      ].filter(cmd => cmd.command.length > 0 && cmd.command[0] !== '');

      if (mapped.length === 0) throw new Error("AI returned empty commands. Raw response:\n" + aiText.slice(0, 500));

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
        create(CursorText, {value: token ? '********' : '', cursorIndex: cursor})
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
          create(Text, null, ' Successfully injected ' + suggestions.length + ' optimized commands.'),
          create(Text, {dimColor: true, marginTop: 1}, 'Return to Navigator to use BRIT shortcuts.')
        ),
        status === 'done' && rawAIResponse && create(
          Box,
          {flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'gray', padding: 1},
          create(Text, {bold: true, color: 'cyan'}, '📄 Raw AI Response:'),
          create(Text, {dimColor: true}, rawAIResponse.slice(0, 2000))
        ),
        status === 'busy' && rawAIResponse && create(
          Box,
          {flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'gray', padding: 1},
          create(Text, {bold: true, color: 'yellow'}, '📄 Partial Response:'),
          create(Text, {dimColor: true}, rawAIResponse.slice(0, 1000))
        ),
        error && create(
          Box,
          {flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'red', padding: 1},
          create(Text, {color: 'red', bold: true}, ' ✗ AI ERROR'),
          create(Text, {color: 'red'}, error.length > 500 ? error.slice(0, 500) + '...' : error)
        )
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Esc: Return, R: Reset Credentials')
    )
  );
});

export default AIHorizon;
