import React, {useState, memo, useRef, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import fs from 'fs';
import path from 'path';
import {parseShellWords} from '../detectors/utils.js';

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

const AIHorizon = memo(({rootPath, selectedProject, CursorText, config, setConfig, saveConfig, analysisContext, clearContext, onReturn}) => {
  const [step, setStep] = useState(config?.aiToken ? 'analyze' : 'provider');
  
  useEffect(() => {
    if (analysisContext && step === 'analyze' && status === 'ready') {
      setStep('chat');
      setChatHistory([{ role: 'user', content: `The following error occurred while running a task:\n${analysisContext}\n\nPlease analyze this error and suggest a fix.` }]);
      runChatAnalysis(`The following error occurred while running a task:\n${analysisContext}\n\nPlease analyze this error and suggest a fix.`);
      if (clearContext) clearContext();
    }
  }, [analysisContext]);

  const providerIndex = AI_PROVIDERS.findIndex(p => p.id === (config?.aiProvider || 'openrouter'));
  const [providerIdx, setProviderIdx] = useState(providerIndex >= 0 ? providerIndex : 0);
  const [model, setModel] = useState(config?.aiModel || 'deepseek/deepseek-r1');
  const [token, setToken] = useState(config?.aiToken || '');
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [rawAIResponse, setRawAIResponse] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editInput, setEditInput] = useState('');
  const [editCursor, setEditCursor] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatCursor, setChatCursor] = useState(0);
  const abortControllerRef = useRef(null);


  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const runRealAnalysis = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

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

Use the project's detected type (${selectedProject.type}) to ensure commands are correct.`;

      let response;
      let aiText = '';

      const fetchOptions = {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' }
      };

      if (provider.id === 'openrouter') {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
        fetchOptions.headers['HTTP-Referer'] = 'https://github.com/CrimsonDevil333333/project-compass';
        fetchOptions.headers['X-Title'] = 'Project Compass';
        fetchOptions.body = JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }]
        });
        response = await fetch(provider.endpoint, fetchOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || data.error || 'OpenRouter Error');
        aiText = data.choices?.[0]?.message?.content || '';
      } else if (provider.id === 'gemini') {
        const url = provider.endpoint.replace('{model}', model) + `?key=${token}`;
        fetchOptions.body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
        response = await fetch(url, fetchOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || data.error || 'Gemini Error');
        aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (provider.id === 'claude') {
        fetchOptions.headers['x-api-key'] = token;
        fetchOptions.headers['anthropic-version'] = '2023-06-01';
        fetchOptions.body = JSON.stringify({
          model: model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        });
        response = await fetch(provider.endpoint, fetchOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || data.error || 'Claude Error');
        aiText = data.content?.[0]?.text || '';
      } else if (provider.id === 'ollama') {
        fetchOptions.body = JSON.stringify({ model: model, prompt: prompt, stream: false });
        response = await fetch(provider.endpoint, fetchOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Ollama Error');
        aiText = data.response || '';
      }

      if (!aiText) throw new Error('Empty response from AI provider');

      setRawAIResponse(aiText);

      // Robust JSON extraction
      let jsonStr = aiText;
      const jsonStart = aiText.indexOf('{');
      const jsonEnd = aiText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonStr = aiText.substring(jsonStart, jsonEnd + 1);
      } else {
        throw new Error("AI response did not contain a valid JSON object.");
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const mapped = [
          { label: 'AI Build', command: parseShellWords(parsed.build || '') },
          { label: 'AI Run', command: parseShellWords(parsed.run || '') },
          { label: 'AI Install', command: parseShellWords(parsed.install || '') },
          { label: 'AI Test', command: parseShellWords(parsed.test || '') }
        ].filter(cmd => cmd.command.length > 0 && cmd.command[0] !== '');

        if (mapped.length === 0) throw new Error("AI returned empty commands.");

        setSuggestions(mapped);
        setSelectedSuggestion(0);
        setStatus('done');
      } catch (parseErr) {
        throw new Error(`Failed to parse AI response as JSON: ${parseErr.message}\n\nExtracted content:\n${jsonStr.slice(0, 500)}`);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setStatus('ready');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const runChatAnalysis = async (userInput) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setStatus('busy');
    setError(null);
    const provider = AI_PROVIDERS[providerIdx];

    try {
      const projectContext = buildProjectContext(selectedProject, rootPath);
      const systemPrompt = `You are an expert developer assistant for the project "${selectedProject.name}".
Project Context:
${projectContext}

Help the user with their questions about this project. Be concise but thorough.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userInput }
      ];

      let response;
      let aiText = '';

      const fetchOptions = {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' }
      };

      if (provider.id === 'openrouter') {
        fetchOptions.headers['Authorization'] = `Bearer ${token}`;
        fetchOptions.body = JSON.stringify({ model: model, messages });
        response = await fetch(provider.endpoint, fetchOptions);
        const data = await response.json();
        aiText = data.choices?.[0]?.message?.content || '';
      } else if (provider.id === 'gemini') {
        const url = provider.endpoint.replace('{model}', model) + `?key=${token}`;
        const contents = messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));
        fetchOptions.body = JSON.stringify({ contents });
        response = await fetch(url, fetchOptions);
        const data = await response.json();
        aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (provider.id === 'claude') {
        fetchOptions.headers['x-api-key'] = token;
        fetchOptions.headers['anthropic-version'] = '2023-06-01';
        fetchOptions.body = JSON.stringify({
          model: model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.filter(m => m.role !== 'system')
        });
        response = await fetch(provider.endpoint, fetchOptions);
        const data = await response.json();
        aiText = data.content?.[0]?.text || '';
      } else if (provider.id === 'ollama') {
        fetchOptions.body = JSON.stringify({ model: model, messages, stream: false });
        response = await fetch(provider.endpoint, fetchOptions);
        const data = await response.json();
        aiText = data.message?.content || '';
      }

      if (!aiText) throw new Error('Empty response from AI provider');

      setChatHistory(prev => [...prev, { role: 'user', content: userInput }, { role: 'assistant', content: aiText }]);
      setStatus('chatting');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
      setStatus('chatting');
    } finally {
      abortControllerRef.current = null;
    }
  };



  useInput((input, key) => {
    if (editMode) {
      if (key.return) {
        if (cursor === 1) setModel(editInput);
        if (cursor === 2) setToken(editInput);
        setEditMode(false);
      } else if (key.escape) {
        setEditMode(false);
      } else if (key.backspace || key.delete) {
        setEditInput(prev => prev.slice(0, -1));
        setEditCursor(prev => Math.max(0, prev - 1));
      } else if (key.leftArrow) {
        setEditCursor(prev => Math.max(0, prev - 1));
      } else if (key.rightArrow) {
        setEditCursor(prev => Math.min(editInput.length, prev + 1));
      } else if (input) {
        setEditInput(prev => prev + input);
        setEditCursor(prev => prev + 1);
      }
      return;
    }

    if (step === 'chat') {
      if (key.return && chatInput.trim()) {
        runChatAnalysis(chatInput);
        setChatInput('');
        setChatCursor(0);
      } else if (key.escape) {
        setStep('analyze');
      } else if (key.backspace || key.delete) {
        setChatInput(prev => prev.slice(0, -1));
        setChatCursor(prev => Math.max(0, prev - 1));
      } else if (key.leftArrow) {
        setChatCursor(prev => Math.max(0, prev - 1));
      } else if (key.rightArrow) {
        setChatCursor(prev => Math.min(chatInput.length, prev + 1));
      } else if (input) {
        setChatInput(prev => prev + input);
        setChatCursor(prev => prev + 1);
      }
      return;
    }

    if (key.upArrow) setCursor(prev => Math.max(0, prev - 1));
    if (key.downArrow) {
      const max = step === 'provider' ? 3 : 2;
      setCursor(prev => Math.min(max, prev + 1));
    }

    if (step === 'provider') {
      if (key.escape) {
        if (onReturn) onReturn();
        return;
      }
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
      if (key.escape) {
        if (onReturn) onReturn();
        return;
      }
      if (key.return && status === 'ready' && selectedProject) {
        runRealAnalysis();
      }
      if (status === 'done' && suggestions.length > 0) {
        if (key.upArrow) { setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length); return; }
        if (key.downArrow) { setSelectedSuggestion(prev => (prev + 1) % suggestions.length); return; }
        if (input?.toLowerCase() === 'e') {
          const current = suggestions[selectedSuggestion]?.command?.join(' ') || '';
          setEditInput(current); setEditCursor(current.length); setEditMode(true); return;
        }
        if (input?.toLowerCase() === 's' && selectedProject) {
          const projectKey = selectedProject.path;
          const currentCustom = config.customCommands?.[projectKey] || [];
          const nextConfig = {
            ...config,
            customCommands: { ...config.customCommands, [projectKey]: [...currentCustom, ...suggestions] }
          };
          setConfig(nextConfig); saveConfig(nextConfig);
          setStatus('saved');
          return;
        }
      }
      if (input?.toLowerCase() === 'c') {
        setStep('chat');
        return;
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
          create(Text, null, ' Review ' + suggestions.length + ' suggested commands below.'),
          ...suggestions.map((suggestion, index) => create(Text, {key: `${suggestion.label}-${index}`, color: index === selectedSuggestion ? 'cyan' : 'white', wrap: 'truncate-end'}, `${index === selectedSuggestion ? '→' : ' '} ${suggestion.label}: ${suggestion.command.join(' ')}`)),
          editMode && create(Box, {flexDirection: 'row', marginTop: 1},
            create(Text, null, 'Edit command: '),
            create(CursorText, {value: editInput, cursorIndex: editCursor})
          ),
          create(Text, {dimColor: true, marginTop: 1}, '↑/↓ select · E edit · S save to config')
        ),
        status === 'saved' && create(Box, {flexDirection: 'column'},
          create(Text, {color: 'green', bold: true}, ' ✅ Saved AI commands to project config.'),
          create(Text, {dimColor: true, marginTop: 1}, 'Return to Navigator to use BRIT shortcuts.')
        ),
        status === 'done' && rawAIResponse && create(
          Box,
          {flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'gray', padding: 1},
          create(Text, {bold: true, color: 'cyan'}, '📄 Raw AI Response:'),
          create(Text, {dimColor: true, wrap: 'wrap'}, rawAIResponse.slice(0, 2000))
        ),
        status === 'busy' && rawAIResponse && create(
          Box,
          {flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'gray', padding: 1},
          create(Text, {bold: true, color: 'yellow'}, '📄 Partial Response:'),
          create(Text, {dimColor: true, wrap: 'wrap'}, rawAIResponse.slice(0, 1000))
        ),
        error && create(
          Box,
          {flexDirection: 'column', marginTop: 1, borderStyle: 'single', borderColor: 'red', padding: 1},
          create(Text, {color: 'red', bold: true}, ' ✗ AI ERROR'),
          create(Text, {color: 'red'}, error.length > 500 ? error.slice(0, 500) + '...' : error)
        )
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Esc: Return, R: Reset Credentials, C: Open Context Chat')
    ),

    step === 'chat' && create(
      Box,
      {flexDirection: 'column', flexGrow: 1},
      create(Text, {bold: true, color: 'cyan', marginBottom: 1}, '💬 Project Context Chat: ' + selectedProject.name),
      create(
        Box,
        {flexDirection: 'column', borderStyle: 'single', borderColor: 'gray', padding: 1, flexGrow: 1, minHeight: 10},
        chatHistory.length === 0 && create(Text, {dimColor: true}, 'Ask anything about the project (e.g. "How do I run tests?", "What are the dependencies?")'),
        ...chatHistory.slice(-10).map((msg, i) => create(
          Box,
          {key: i, marginBottom: 1, flexDirection: 'column'},
          create(Text, {bold: true, color: msg.role === 'user' ? 'blue' : 'green'}, msg.role === 'user' ? '👤 YOU' : '🤖 AI'),
          create(Text, {wrap: 'wrap'}, msg.content)
        )),
        status === 'busy' && create(Text, {color: 'yellow'}, ' ⏳ AI is thinking...')
      ),
      create(
        Box,
        {flexDirection: 'row', marginTop: 1},
        create(Text, {bold: true}, ' > '),
        create(CursorText, {value: chatInput, cursorIndex: chatCursor})
      ),
      create(Text, {dimColor: true, marginTop: 1}, 'Enter: Send, Esc: Back to Analysis')
    )

  );
});

export default AIHorizon;
