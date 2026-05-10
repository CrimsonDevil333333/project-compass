# Contributing to Project Compass

Thank you for your interest in helping to navigate the project universe! 🚀

This document provides **COMPLETE** guidelines for contributing to Project Compass (v4.3.6).

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Working with AI Agents](#working-with-ai-agents)
3. [Development Workflow](#development-workflow)
4. [Project Structure](#project-structure)
5. [Code Style Requirements](#code-style-requirements)
6. [Testing Requirements](#testing-requirements)
7. [CLI Commands Reference](#cli-commands-reference)
8. [TUI Features Reference](#tui-features-reference)
9. [Framework Detection](#framework-detection)
10. [Adding New Features](#adding-new-features)
11. [Bug Fix Guidelines](#bug-fix-guidelines)
12. [Deployment](#deployment)

---

## Core Principles

### 1. High Fidelity
The UI should feel like a cockpit, not just a text list. Every pixel counts.

- **Visual Clarity**: Use `kleur` for colors
- **Animations**: Spinners, progress bars, status indicators
- **Layout**: Use Ink's `Box` component with proper flexbox properties
- **Borders**: Use `borderStyle` (single, double, round, bold)

### 2. Safety First
Commands should be executed safely, and critical actions (like `rm` or `kill`) should have a confirmation gate.

- **Confirmation**: `Shift+Q` shows confirmation when tasks are running
- **Process Cleanup**: `handleKillTask()` and `killAllTasks()` handle cleanup
- **No Auto-Run**: Commands only execute when explicitly requested by user

### 3. Speed
Operations must be non-blocking. Use Ink's async components or background processes via `execa`.

- **Async Operations**: Project scanning, command execution use async/await
- **Streaming**: Log output streams in real-time via `stdout.on('data')`
- **Caching**: Framework plugins cached in `cachedFrameworkPlugins`

### 4. Zero Hallucinations
Framework detection must be based on actual dependencies, not just file existence.

- **Use `dependencyMatches()`**: NOT `hasProjectFile()` for framework matching
- **Verify Dependencies**: Check `project.metadata.dependencies`
- **Test Edge Cases**: Projects without frameworks should show "none"

### 5. ESM Only
All code uses ECMAScript modules (`import/export`).

- **No CommonJS**: No `require()` or `module.exports`
- **Import/Export**: Use `import` and `export default`
- **Dynamic Import**: Use `await import()` for `compass.config.js`

---

## Working with AI Agents

This repository is "AI-First." Always update `AGENTS.md` after making structural changes to the code or adding new core components. This helps subsequent agents (and humans!) maintain high-velocity context.

### Files to Update After Changes:

1. **`AGENTS.md`** - Add new components, update file references, add new features
2. **`PROJECT_CONTEXT.md`** - Update context, add bug fixes, document enhancements
3. **`README.md`** - Update with new CLI commands, TUI features
4. **`ARHITECTURE.md`** - Document architectural changes
5. **`commands.md`** - Add ALL new keyboard shortcuts, CLI arguments
6. **`CONTRIBUTING.md`** - Update this file with new workflows

### AI Agent Context Quick Reference:

| File | Purpose | When to Update |
|------|---------|-----------------|
| `AGENTS.md` | AI agent context | After structural changes |
| `PROJECT_CONTEXT.md` | Technical context | After bug fixes, enhancements |
| `README.md` | User documentation | After new features |
| `ARHITECTURE.md` | Architecture docs | After architectural changes |
| `commands.md` | Command reference | After new commands/shortcuts |
| `CONTRIBUTING.md` | Contributor guide | After workflow changes |

---

## Development Workflow

### 1. Fork and Branch

```bash
# Fork on GitHub, then clone
git clone https://github.com/YOUR-USERNAME/project-compass.git
cd project-compass

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Code Style

Follow the existing ESM pattern. Use `import/export`. Components use `React.createElement` (aliased as `create`), NOT JSX.

#### Correct Pattern (ESM + createElement):

```javascript
import React, { useState, useMemo } from 'react';
import { Box, Text } from 'ink';

const create = React.createElement;

export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState('');
  
  return create(
    Box,
    { flexDirection: 'column' },
    create(Text, null, 'Hello ', state),
    create(Text, { color: 'cyan' }, prop1)
  );
}
```

#### Incorrect Patterns:

```javascript
// ❌ NO JSX
const element = <Box><Text>Hello</Text></Box>;

// ❌ NO CommonJS
const React = require('react');
module.exports = MyComponent;
```

### 3. Linting

Run `npm run lint` before committing.

```bash
# Check for errors
npm run lint

# Auto-fix (if available)
npm run lint -- --fix
```

**ESLint Configuration**: `eslint.config.cjs`
- **Rules**: `no-unused-vars` (warn on unused variables)
- **Parser**: `@eslint/js` with espree
- **Environment**: Node.js + ES6

### 4. Testing

#### Test TUI Mode:

```bash
# Start the TUI
npm start

# Test with specific view
node src/cli.js --studio
node src/cli.js --ai
node src/cli.js --task
```

#### Test Headless Mode (No TUI):

```bash
# Test project detection
node src/cli.js --mode test
node src/cli.js --mode test --dir /path/to/workspace

# Test new CLI features
node src/cli.js --list-projects
node src/cli.js --project-info 0
node src/cli.js --run "echo test"
node src/cli.js --add-pkg "express"
node src/cli.js --studio-check
node src/cli.js --scaffold python-basic --name test
```

#### Test AI Horizon:

1. Launch TUI: `npm start`
2. Press `Shift+O` or `0` (in detail view)
3. Configure AI provider (OpenRouter/Gemini/Claude/Ollama)
4. Enter API token
5. Press `Enter` to analyze
6. Review/edit suggestions
7. Press `S` to save

#### Test with Multi-Project Workspaces:

```bash
# Create test workspace
mkdir -p /tmp/test-workspace
cd /tmp/test-workspace

# Create sample projects
mkdir node-project && cd node-project && npm init -y && cd ..
mkdir python-project && cd python-project && echo '{"name": "fastapi", "dependencies": {"fastapi": "*"}}' > pyproject.toml && cd ..
mkdir rust-project && cd rust-project && cargo init && cd ..

# Test detection
node /path/to/project-compass/src/cli.js --list-projects --dir /tmp/test-workspace
```

#### Test with Projects Without Frameworks:

```bash
# Create simple Python project (no framework)
mkdir -p /tmp/simple-python
echo 'print("Hello")' > /tmp/simple-python/main.py

# Detect - should show "Frameworks: none"
node /path/to/project-compass/src/cli.js --list-projects --dir /tmp/simple-python
```

### 5. Commits

Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`).

#### Commit Message Format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Examples:

```bash
# Feature
git commit -m "feat(compass-config): integrate compass-config.js into project detection"

# Bug fix
git commit -m "fix(frameworks): prevent hallucination in fastapi matcher"

# Docs
git commit -m "docs(README): update with all CLI commands and features"

# Refactor
git commit -m "refactor(cli): add comprehensive CLI mode support"

# Performance
git commit -m "perf(detection): cache framework plugins for faster loading"
```

---

## Project Structure

```
project-compass/
├── package.json                    # NPM package config (v4.3.6)
├── README.md                      # Main documentation (COMPREHENSIVE)
├── ARCHITECTURE.md               # Architecture documentation
├── commands.md                    # All commands & shortcuts
├── CONTRIBUTING.md               # This file (contribution guidelines)
├── AGENTS.md                     # AI agent context
├── PROJECT_CONTEXT.md             # Technical context for agents
├── LICENSE                       # MIT License
├── eslint.config.cjs              # ESLint configuration
├── assets/                       # Screenshots and branding
├── src/
│   ├── cli.js                   # Entry point (840+ lines)
│   │                           # - parseArgs() (lines 766-781)
│   │                           # - main() (lines 783-840+)
│   │                           # - Compass component (lines 163-763)
│   │                           # - useScanner() (lines 67-90)
│   │                           # - runProjectCommand() (lines 264-310)
│   │                           # - addLogToTask() (lines 203-216)
│   │                           # - handleKillTask() (lines 236-255)
│   │                           # - killAllTasks() (lines 257-262)
│   │                           # - saveConfig() (lines 38-45)
│   │                           # - loadConfig() (lines 47-65)
│   ├── projectDetection.js       # Orchestrator (189 lines)
│   │                           # - discoverProjects(root) (lines 146-180)
│   │                           # - applyFrameworkPlugins(project) (lines 114-144)
│   │                           # - matchesPlugin(project, plugin) (lines 83-112)
│   │                           # - getFrameworkPlugins() (lines 75-81)
│   │                           # - loadUserFrameworks() (lines 31-71)
│   ├── configPaths.js            # Config directory paths
│   │                           # - CONFIG_DIR: ~/.project-compass/
│   │                           # - CONFIG_PATH: ~/.project-compass/config.json
│   │                           # - PLUGIN_FILE: ~/.project-compass/plugins.json
│   │                           # - ensureConfigDir()
│   ├── detectors/
│   │   ├── utils.js            # Shared utilities (148 lines)
│   │   │                       # - checkBinary(name)
│   │   │                       # - hasProjectFile(projectPath, file)
│   │   │                       # - getPackageManager(projectPath, language)
│   │   │                       # - dependencyMatches(project, needle)
│   │   │                       # - parseCommandTokens(value)
│   │   │                       # - getLockfileInfo(projectPath)
│   │   ├── node.js             # Node.js detection (140 lines)
│   │   │                       # Priority: 100, Files: package.json
│   │   ├── python.js           # Python detection (208 lines)
│   │   │                       # Priority: 95, Files: pyproject.toml, etc.
│   │   ├── rust.js             # Rust detection (136 lines)
│   │   │                       # Priority: 90, Files: Cargo.toml
│   │   ├── go.js               # Go detection
│   │   │                       # Priority: 85, Files: go.mod
│   │   ├── java.js             # Java detection
│   │   │                       # Priority: 80, Files: pom.xml, build.gradle
│   │   ├── php.js              # PHP detection
│   │   │                       # Priority: 75, Files: composer.json
│   │   ├── ruby.js             # Ruby detection
│   │   │                       # Priority: 70, Files: Gemfile
│   │   ├── dotnet.js           # .NET detection
│   │   │                       # Priority: 65, Files: *.csproj
│   │   ├── generic.js          # Generic fallback
│   │   │                       # Priority: 10, Files: Makefile, build.sh
│   │   ├── compass-config.js   # Project config loader (39 lines)
│   │   │                       # - loadProjectConfig(projectPath)
│   │   │                       # - saveProjectConfig(projectPath, config)
│   │   └── frameworks.js       # 40+ built-in plugins (877 lines)
│   │                               # Node.js: Next.js, React, Vue, etc.
│   │                               # Python: FastAPI, Flask, Django, etc.
│   │                               # Rust: Actix, Rocket, Axum, etc.
│   │                               # Go: Gin, Echo, Fiber, etc.
│   │                               # Java: Spring Boot, Quarkus, etc.
│   │                               # PHP: Laravel, Symfony, etc.
│   │                               # Ruby: Rails, Sinatra, etc.
│   │                               # .NET: ASP.NET Core, Blazor, etc.
│   ├── components/
│   │   ├── Navigator.js          # Paginated project list (110 lines)
│   │   ├── Header.js             # Top bar (60 lines)
│   │   ├── Footer.js             # Bottom bar with stdin (81 lines)
│   │   ├── TaskManager.js        # Orbit Task Manager (82 lines)
│   │   ├── PackageRegistry.js    # Dependency management (156 lines)
│   │   ├── ProjectArchitect.js  # Scaffolding (113 lines)
│   │   ├── AIHorizon.js         # AI analysis (426 lines)
│   │   └── Studio.js            # Environment check (64 lines)
├── node_modules/                # Dependencies
└── ~/.project-compass/           # User config directory (NOT in repo)
    ├── config.json             # Main configuration
    └── plugins.json            # Custom framework plugins
```

---

## Code Style Requirements

### 1. Component Creation

ALL components use `React.createElement` (aliased as `create`), NOT JSX:

```javascript
import React from 'react';
import { Box, Text } from 'ink';

const create = React.createElement;

export default function MyComponent({ prop1, prop2 }) {
  return create(
    Box,
    { flexDirection: 'column', padding: 1 },
    create(Text, { bold: true, color: 'cyan' }, 'Title'),
    create(Text, { dimColor: true }, prop1)
  );
}
```

### 2. State Management

Use React hooks (NOT class components):

```javascript
import { useState, useMemo, useCallback, useEffect } from 'react';

export default function MyComponent() {
  const [state, setState] = useState(initialValue);
  const memoized = useMemo(() => expensiveComputation(state), [state]);
  const callback = useCallback(() => { /* ... */ }, []);
  
  useEffect(() => {
    // Side effect
    return () => { /* cleanup */ };
  }, []);
}
```

### 3. Input Handling

Use Ink's `useInput` hook:

```javascript
import { useInput } from 'ink';

useInput((input, key) => {
  if (key.return) { /* handle Enter */ }
  if (key.escape) { /* handle Escape */ }
  if (key.upArrow) { /* handle Up */ }
  if (key.downArrow) { /* handle Down */ }
  if (input) { /* handle character input */ }
});
```

### 4. Async Operations

Use async/await, NOT callbacks:

```javascript
// ✅ Correct
async function discoverProjects(root) {
  const result = await someAsyncOperation(root);
  return result;
}

// ❌ Incorrect
function discoverProjects(root, callback) {
  someAsyncOperation(root, callback);
}
```

### 5. Error Handling

Always catch errors and provide meaningful messages:

```javascript
try {
  const data = await fetch(url);
  return data;
} catch (error) {
  console.error(`Failed to fetch: ${error.message}`);
  return null;
}
```

---

## Testing Requirements

### 1. Lint Check (MANDATORY)

```bash
npm run lint
# Must pass with 0 errors before committing
```

### 2. CLI Mode Tests

Test ALL CLI arguments:

```bash
# Help and version
node src/cli.js --help
node src/cli.js --version

# Project detection
node src/cli.js --mode test --dir /path/to/workspace
node src/cli.js --list-projects --dir /path/to/workspace
node src/cli.js --list-projects --json
node src/cli.js --project-info 0

# Run commands
node src/cli.js --run "echo test" --dir /path/to/project

# Package management
node src/cli.js --add-pkg "express" --dir /path/to/project
node src/cli.js --remove-pkg "lodash" --dir /path/to/project

# Scaffolding
node src/cli.js --scaffold python-basic --name test --dir /tmp

# Environment check
node src/cli.js --studio-check
```

### 3. TUI Mode Tests

Launch TUI and test ALL features:

```bash
npm start
```

#### Test Navigation:
- ↑/↓ to move projects
- PgUp/PgDn to jump pages
- Enter to toggle detail view
- ? to toggle help overlay

#### Test Quick Actions (Detail View):
- 0 for AI analysis
- B/T/R/I for build/test/run/install
- 1-9 for numbered commands

#### Test Views:
- Shift+O for AI Horizon
- Shift+T for Task Manager
- Shift+P for Package Registry
- Shift+N for Project Architect
- Shift+A for Studio

#### Test Toggles:
- Shift+B for Art Board
- Shift+H for Help Cards
- Shift+S for Structure Guide

#### Test Task Management:
- Shift+K to kill task
- Shift+R to rename task
- Shift+X to clear logs
- Shift+E to export logs

### 4. Framework Detection Tests

#### Test with Projects WITH Frameworks:

```bash
# Should detect FastAPI
node src/cli.js --list-projects --dir /path/to/fastapi-project
# Output should show: Frameworks: FastAPI

# Should detect Next.js
node src/cli.js --list-projects --dir /path/to/nextjs-project
# Output should show: Frameworks: Next.js
```

#### Test with Projects WITHOUT Frameworks:

```bash
# Should show "Frameworks: none"
node src/cli.js --list-projects --dir /path/to/simple-python
node src/cli.js --list-projects --dir /path/to/simple-node
```

### 5. AI Horizon Tests

1. Launch: `npm start`
2. Select project with `↑/↓`
3. Press `Shift+O` or `0`
4. Select AI provider with `↑/↓`, press `Enter`
5. Enter model, press `Enter`
6. Enter API token, press `Enter`
7. Press `Enter` to analyze
8. Review suggestions (↑/↓ to select, `E` to edit)
9. Press `S` to save

---

## CLI Commands Reference

### All CLI Arguments (Complete List):

```bash
# Basic
project-compass                       # Launch TUI (default: navigator)
project-compass --help                  # Show help (-h)
project-compass --version                # Show version (-v)

# Direct view launch
project-compass --studio               # Launch in Studio view
project-compass --ai                    # Launch in AI Horizon view
project-compass --task                  # Launch in Task Manager view
project-compass --tasks                 # Alias for --task

# Project detection (no TUI)
project-compass --mode test              # Simple detection (legacy)
project-compass --list-projects         # Detailed listing (RECOMMENDED)
project-compass --project-info <n>       # Show project by index
project-compass --list-projects --json  # JSON output

# Run commands
project-compass --run "cmd" --dir /path   # Run command directly

# Package management
project-compass --add-pkg "pkg" --dir /path     # Add package
project-compass --remove-pkg "pkg" --dir /path  # Remove package

# Project scaffolding
project-compass --scaffold <template> --name <n> --dir <d>

# Environment
project-compass --studio-check          # Check runtimes

# Directory specification
project-compass --dir /path/to/workspace  # Specify working directory

# AI analysis (requires TUI)
project-compass --ai-analyze           # Shows message to use TUI mode
```

### NPM Scripts:

```bash
npm start          # node src/cli.js
npm run test       # node src/cli.js --mode test
npm run lint       # eslint src
npm run run -- "cmd"  # node src/cli.js --run "cmd"
```

---

## TUI Features Reference

### All Keyboard Shortcuts (Complete List):

#### Navigation:
| Key | Action |
|-----|--------|
| `↑` / `↓` | Move project focus |
| `PgUp` / `PgDn` | Jump full project page |
| `Enter` | Toggle project Detail View |
| `Esc` | Global Back: Return to Main Navigator |
| `?` | Toggle help overlay |

#### Quick Actions (Detail View):
| Key | Action |
|-----|--------|
| `0` | Quick AI Analysis |
| `B` / `T` / `R` / `I` | Build / Test / Run / Install |
| `1-9` | Run numbered commands |
| `Shift+1-9` (A-Z) | Run commands 10+ |

#### Views:
| Key | Action |
|-----|--------|
| `Shift+O` | AI Horizon Dashboard |
| `Shift+T` | Orbit Task Manager |
| `Shift+P` | Package Registry |
| `Shift+N` | Project Architect |
| `Shift+A` | Omni-Studio |

#### UI Toggles:
| Key | Action |
|-----|--------|
| `Shift+B` | Toggle Art Board |
| `Shift+H` | Toggle Help Cards |
| `Shift+S` | Toggle Structure Guide |

#### Task Management:
| Key | Action |
|-----|--------|
| `Shift+K` | Kill running process |
| `Shift+R` | Rename task / Configure port |
| `Shift+D` | Detach from task |
| `Shift+X` | Clear active logs |
| `Shift+E` | Export logs to .txt |
| `Shift+L` | Rerun last command |

#### Log Scrolling:
| Key | Action |
|-----|--------|
| `Shift+↑` | Scroll logs up |
| `Shift+↓` | Scroll logs down |

#### Project Configuration:
| Key | Action |
|-----|--------|
| `Shift+C` | Add custom command |
| `Shift+R` | Configure port (Detail View) |

#### System:
| Key | Action |
|-----|--------|
| `Shift+Q` | Quit (confirm if tasks running) |
| `Ctrl+C` | Interrupt running command |

---

## Framework Detection

### How Framework Detection Works:

1. **Project Detection**: `projectDetection.js` runs detectors in priority order (100-10)
2. **Detector Build**: Each detector returns project object with metadata
3. **Plugin Application**: `frameworks.js` and `plugins.json` applied
4. **Dependency Matching**: Use `dependencyMatches()` (NOT `hasProjectFile()`)

### Adding a New Detector:

1. Create `src/detectors/yourlang.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { checkBinary, hasProjectFile } from './utils.js';

export default {
  type: 'yourlang',
  label: 'Your Language',
  icon: '🚀',
  priority: 80,  // Higher = preferred
  files: ['manifest.ext'],
  binaries: ['yourlang'],
  async build(projectPath, manifest) {
    const missingBinaries = this.binaries.filter(b => !checkBinary(b));
    // Parse manifest, detect metadata
    const commands = {
      install: { label: 'Install', command: ['yourlang', 'install'], source: 'builtin' },
      run: { label: 'Run', command: ['yourlang', 'run'], source: 'builtin' }
    };
    return {
      id: `${projectPath}::yourlang`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Your Language',
      icon: '🚀',
      priority: this.priority,
      commands,
      metadata: { /* ... */ },
      manifest: path.basename(manifest),
      description: '...',
      missingBinaries,
      frameworks: [],
      extra: { /* ... */ }
    };
  }
}
```

2. Import in `projectDetection.js`:

```javascript
import yourDetector from './detectors/yourlang.js';
// Add to detectors array (higher priority = first)
const detectors = [
  yourDetector,  // Priority 80
  // ... other detectors
];
```

### Adding a New Framework Plugin:

#### Built-in (`src/detectors/frameworks.js`):

```javascript
{
  id: 'your-framework',
  name: 'Your Framework',
  icon: '🚀',
  description: 'Description here',
  languages: ['Node.js'],  // Which languages
  priority: 100,  // Boosts project priority
  match(project) {
    // Use dependencyMatches() NOT hasProjectFile()
    return dependencyMatches(project, 'your-framework');
  },
  commands(project) {
    const pm = project.metadata?.packageManager || 'npm';
    return {
      install: { label: 'Install', command: [pm, 'install'], source: 'framework' },
      run: { label: 'Run', command: [pm, 'run', 'dev'], source: 'framework' }
    };
  }
}
```

#### Custom (`~/.project-compass/plugins.json`):

```json
{
  "plugins": [
    {
      "name": "Your Framework",
      "icon": "🚀",
      "languages": ["Node.js"],
      "files": ["your.config.js"],
      "dependencies": ["your-framework"],
      "priority": 100,
      "commands": {
        "dev": { "label": "Dev", "command": ["your-cli", "dev"] }
      }
    }
  ]
}
```

### ⚠️ Important: No Hallucinations!

**Wrong** (causes hallucinations):

```javascript
match(project) {
  return dependencyMatches(project, 'fastapi') || hasProjectFile(project.path, 'main.py');
  // ❌ This will match ANY project with main.py!
}
```

**Correct**:

```javascript
match(project) {
  return dependencyMatches(project, 'fastapi');
  // ✅ Only matches if fastapi is in dependencies
}
```

---

## Adding New Features

### Adding a New CLI Argument:

1. Update `parseArgs()` in `src/cli.js` (lines 766-781):

```javascript
else if (token === '--your-flag' && tokens[i + 1]) { 
  args.yourFlag = tokens[i + 1]; 
  i += 1; 
}
```

2. Update `main()` in `src/cli.js` (lines 783-840+):

```javascript
if (args.yourFlag) {
  // Implement feature
  console.log('Your feature here');
  return;
}
```

3. Update help text in `main()` (lines 791-836):

```javascript
console.log('  --your-flag <value>     ' + kleur.dim('# Your flag description)');
```

4. Update ALL markdown files:
   - `commands.md`
   - `README.md`
   - `AGENTS.md`
   - `PROJECT_CONTEXT.md`

### Adding a New TUI View:

1. Create component in `src/components/YourView.js`:

```javascript
import React, { memo } from 'react';
import { Box, Text, useInput } from 'ink';

const create = React.createElement;

const YourView = memo(({ prop1, prop2 }) => {
  useInput((input, key) => {
    if (key.escape) { /* return to navigator */ }
  });
  
  return create(
    Box,
    { flexDirection: 'column', borderStyle: 'double', borderColor: 'cyan', padding: 1 },
    create(Text, { bold: true, color: 'cyan' }, 'Your View'),
    // ... more UI
  );
});

export default YourView;
```

2. Import in `src/cli.js`:

```javascript
import YourView from './components/YourView.js';
```

3. Add to `renderView()` switch statement:

```javascript
case 'yourview':
  return create(YourView, { prop1, prop2 });
```

4. Add keyboard shortcut in `useInput` handler:

```javascript
if (shiftCombo('Y')) { clearAndSwitch('yourview'); return; }
```

5. Update ALL markdown files with new shortcut.

---

## Bug Fix Guidelines

### Bug Fix Process:

1. **Reproduce**: Create minimal reproduction case
2. **Identify Root Cause**: Trace through code
3. **Fix**: Implement minimal fix
4. **Test**: Verify fix works + no regressions
5. **Document**: Update markdown files

### Example Bug Fix (Framework Hallucination):

#### 1. Bug Report:
"Simple Python project with `main.py` detected as FastAPI"

#### 2. Root Cause Analysis:
```javascript
// In src/detectors/frameworks.js line 328:
match(project) {
  return dependencyMatches(project, 'fastapi') || hasProjectFile(project.path, 'main.py');
  // ❌ hasProjectFile() causes false positive
}
```

#### 3. Fix:
```javascript
// Fixed:
match(project) {
  return dependencyMatches(project, 'fastapi');
  // ✅ Only matches actual dependencies
}
```

#### 4. Test:
```bash
# Before fix:
node src/cli.js --list-projects --dir /tmp/simple-python
# Frameworks: FastAPI  ❌ (WRONG!)

# After fix:
node src/cli.js --list-projects --dir /tmp/simple-python
# Frameworks: none  ✅ (CORRECT!)
```

#### 5. Document:
- Update `AGENTS.md` with fix
- Update `PROJECT_CONTEXT.md` with fix
- Update `README.md` with fix
- Update `commands.md` if needed

---

## Deployment

### Version Bump:

```bash
# Patch version (4.3.6 → 4.3.7)
npm version patch

# Minor version (4.3.6 → 4.4.0)
npm version minor

# Major version (4.3.6 → 5.0.0)
npm version major
```

### Publish to NPM:

```bash
# Build (if needed)
npm run build

# Publish
npm publish

# Tag on GitHub
git tag v4.3.6
git push origin v4.3.6
```

### Production Releases:

All production versions are managed by **Satyaa** and the primary agent, **Clawdy**.

Any `npm version` bump must include an update to `package-lock.json`.

---

## Recent Fixes to Be Aware Of (v4.3.6)

1. **Framework Hallucination Bug FIXED**: Projects without frameworks no longer show random frameworks
2. **compass-config.js Integrated**: Now loaded during project detection
3. **AI Horizon Improved**: Raw AI output displayed, better JSON parsing
4. **Node.js Detector Fixed**: No longer adds generic "Node.js" as a framework
5. **Framework Deduplication**: `applyFrameworkPlugins()` avoids duplicates

---

*Navigate the future.*  
