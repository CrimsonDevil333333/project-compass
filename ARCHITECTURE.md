# Project Compass Architecture

This document describes the complete high-level architecture of Project Compass (v4.3.6).

---

## Table of Contents

1. [Overview](#overview)
2. [Data Flow](#data-flow)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Detection System](#detection-system)
6. [Framework Plugin System](#framework-plugin-system)
7. [State Management](#state-management)
8. [UI Rendering](#ui-rendering)
9. [Command Execution](#command-execution)
10. [Configuration System](#configuration-system)
11. [Recent Architecture Changes](#recent-architecture-changes)
12. [Design Patterns](#design-patterns)
13. [Security](#security)
14. [Performance](#performance)

---

## Overview

Project Compass is a terminal-based project navigator and runner built with:
- **Runtime**: Node.js (ESM modules)
- **UI Framework**: Ink (React for CLI)
- **Styling**: kleur (terminal colors)
- **Execution**: execa (robust subprocess management)
- **File Search**: fast-glob (fast file globbing)
- **Intelligence**: Native fetch API (AI provider integration)

---

## Data Flow

### Complete Flow Diagram
```
User Command/Input
    ↓
[CLI Argument Parsing] (src/cli.js:766-781)
    ↓
[Mode Detection] 
    ├─ --help │ --version → Show info & exit
    ├─ --mode test │ --list-projects → Headless detection
    ├─ --run "cmd" → Execute command & exit
    ├─ --studio-check → Runtime check & exit
    ├─ --scaffold → Create project & exit
    ├─ --add-pkg │ --remove-pkg → Package mgmt & exit
    └─ (default) → Launch TUI
    ↓
[TUI Mode] → React/Ink Render Loop (src/cli.js:163-763)
    ↓
[Project Detection] (src/projectDetection.js:146-180)
    ↓
[Detector Orchestration] → Run detectors in priority order
    ↓
[fast-glob Scanning] → Find manifest files (package.json, Cargo.toml, etc.)
    ↓
[Per-Detector Build] (e.g., src/detectors/node.js:58-139)
    ↓
[Framework Plugin Application] (src/projectDetection.js:114-144)
    ↓
[compass-config.js Loading] (src/detectors/compass-config.js)
    ↓
[Project Object Creation] → {id, path, name, type, commands, frameworks, metadata}
    ↓
[State Update] → React state in Compass component
    ↓
[UI Render] → Ink components (Navigator, TaskManager, etc.)
```

### Detailed Steps

1. **Initialization**: `cli.js` resolves the working directory (defaults to current folder) and parses CLI arguments.

2. **Discovery**: `projectDetection.js` orchestrates modular detectors in `src/detectors/` to perform a high-speed glob search for common manifest files:
   - `package.json` (Node.js)
   - `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`, `manage.py` (Python)
   - `Cargo.toml` (Rust)
   - `go.mod` (Go)
   - `pom.xml`, `build.gradle`, `build.gradle.kts` (Java)
   - `composer.json` (PHP)
   - `Gemfile` (Ruby)
   - `*.csproj`, `*.fsproj` (.NET)

3. **Config Loading**: `compass-config.js` is loaded from each project directory (if exists) and merged into project data.

4. **Framework Detection**: `frameworks.js` applies built-in (40+) and user plugins to detect frameworks based on actual dependencies (not file existence).

5. **State Management**: The discovered projects and their metadata (frameworks, scripts, dependencies) are passed into an Ink React tree.

6. **Rendering**: Components in `src/components` handle specific views:
   - Navigator (main project list)
   - TaskManager (background processes)
   - PackageRegistry (dependency management)
   - ProjectArchitect (scaffolding)
   - AIHorizon (AI analysis)
   - Studio (environment health)
   - Header (top bar)
   - Footer (bottom bar with stdin)

7. **Execution**: User-triggered scripts (like running `npm test`) are managed by `TaskManager.js` using `execa` with streaming logs.

---

## Project Structure

```
project-compass/
├── package.json                    # NPM package config (v4.3.6)
├── README.md                      # Main documentation (COMPREHENSIVE)
├── ARCHITECTURE.md               # This file (full architecture)
├── commands.md                    # All commands & shortcuts
├── CONTRIBUTING.md               # Contribution guidelines
├── AGENTS.md                     # AI agent context
├── PROJECT_CONTEXT.md             # Technical context for agents
├── LICENSE                       # MIT License
├── eslint.config.cjs              # ESLint configuration
├── src/
│   ├── cli.js                   # Entry point (840+ lines)
│   │                           # - Argument parsing (parseArgs)
│   │                           # - Main React component (Compass)
│   │                           # - Global input handling (useInput)
│   │                           # - Project scanning (useScanner)
│   │                           # - Command execution (runProjectCommand)
│   │                           # - Task management (addLogToTask, killAllTasks)
│   ├── projectDetection.js      # Orchestrator (189 lines)
│   │                           # - discoverProjects(root)
│   │                           # - applyFrameworkPlugins(project)
│   │                           # - matchesPlugin(project, plugin)
│   │                           # - getFrameworkPlugins()
│   ├── configPaths.js           # Config directory paths
│   │                           # - CONFIG_DIR: ~/.project-compass/
│   │                           # - CONFIG_PATH: ~/.project-compass/config.json
│   │                           # - PLUGIN_FILE: ~/.project-compass/plugins.json
│   │                           # - ensureConfigDir()
│   ├── store/
│   │   └── useProjectStore.js  # Unused store (available for future use)
│   ├── detectors/
│   │   ├── utils.js            # Shared utilities (148 lines)
│   │   │                       # - checkBinary(name)
│   │   │                       # - hasProjectFile(projectPath, file)
│   │   │                       # - getPackageManager(projectPath, language)
│   │   │                       # - dependencyMatches(project, needle)
│   │   │                       # - parseCommandTokens(value)
│   │   │                       # - getLockfileInfo(projectPath)
│   │   ├── node.js             # Node.js detection (140 lines)
│   │   │                       # Priority: 100
│   │   │                       # Files: package.json
│   │   │                       # Binaries: node, npm
│   │   ├── python.js           # Python detection (208 lines)
│   │   │                       # Priority: 95
│   │   │                       # Files: pyproject.toml, requirements.txt, setup.py, Pipfile, manage.py
│   │   │                       # Binaries: python3, python, uv
│   │   ├── rust.js             # Rust detection (136 lines)
│   │   │                       # Priority: 90
│   │   │                       # Files: Cargo.toml
│   │   │                       # Binaries: cargo, rustc
│   │   ├── go.js               # Go detection
│   │   │                       # Priority: 85
│   │   │                       # Files: go.mod
│   │   │                       # Binaries: go
│   │   ├── java.js             # Java detection
│   │   │                       # Priority: 80
│   │   │                       # Files: pom.xml, build.gradle, build.gradle.kts
│   │   │                       # Binaries: java, mvn, gradle
│   │   ├── php.js              # PHP detection
│   │   │                       # Priority: 75
│   │   │                       # Files: composer.json
│   │   │                       # Binaries: php, composer
│   │   ├── ruby.js             # Ruby detection
│   │   │                       # Priority: 70
│   │   │                       # Files: Gemfile
│   │   │                       # Binaries: ruby, bundle
│   │   ├── dotnet.js           # .NET detection
│   │   │                       # Priority: 65
│   │   │                       # Files: *.csproj, *.fsproj
│   │   │                       # Binaries: dotnet
│   │   ├── generic.js          # Generic fallback detector
│   │   │                       # Priority: 10
│   │   │                       # Files: Makefile, build.sh
│   │   ├── compass-config.js   # Project-specific config loader (39 lines)
│   │   │                       # - loadProjectConfig(projectPath)
│   │   │                       # - saveProjectConfig(projectPath, config)
│   │   └── frameworks.js       # 40+ built-in framework plugins (877 lines)
│   │                               # Node.js: Next.js, React, Vue, NestJS, Express, etc.
│   │                               # Python: FastAPI, Flask, Django, etc.
│   │                               # Rust: Actix, Rocket, Axum, etc.
│   │                               # Go: Gin, Echo, Fiber, etc.
│   │                               # Java: Spring Boot, Quarkus, etc.
│   │                               # PHP: Laravel, Symfony, etc.
│   │                               # Ruby: Rails, Sinatra, etc.
│   │                               # .NET: ASP.NET Core, Blazor, etc.
│   │                               # ML/Data: Pandas, PyTorch, TensorFlow
├── components/
│   ├── Navigator.js          # Paginated project list (110 lines)
│   ├── Header.js             # Top bar with logo, status, time (60 lines)
│   ├── Footer.js             # Bottom bar with stdin input (81 lines)
│   ├── TaskManager.js        # Orbit Task Manager (82 lines)
│   ├── PackageRegistry.js    # Dependency management (156 lines)
│   ├── ProjectArchitect.js  # Scaffolding templates (113 lines)
│   ├── AIHorizon.js         # AI-powered analysis (426 lines)
│   └── Studio.js            # Environment health check (64 lines)
├── assets/                      # Screenshots and branding
└── node_modules/                # Dependencies
```

---

## Core Components

### Entry Point: `src/cli.js`

**Lines**: 840+  
**Purpose**: Main entry point, argument parsing, global state management, input handling

#### Key Functions:
- `parseArgs()` (lines 766-781): Parse CLI arguments
- `main()` (lines 783-840): Main async entry
- `saveConfig(config)`: Persist config to disk
- `loadConfig()`: Load config from `~/.project-compass/config.json`

#### Key React Component: `Compass` (lines 163-763)
- **State Variables**:
  - `projects` - Detected projects array
  - `selectedIndex` - Currently selected project index
  - `viewMode` - 'list' or 'detail'
  - `mainView` - 'navigator', 'tasks', 'registry', 'architect', 'ai', 'studio'
  - `tasks` - Array of running/completed tasks
  - `activeTaskId` - Currently selected task
  - `config` - Loaded from `~/.project-compass/config.json`

- **Ref Objects**:
  - `runningProcessMap` - Map of task IDs to child processes
  - `lastCommandRef` - Last executed command for replay (Shift+L)

#### Hooks Used:
- `useScanner(rootPath)` - Async project detection
- `useInput()` - Global keyboard input handling
- `useState()` - Multiple state variables
- `useMemo()` - Memoized computations
- `useCallback()` - Memoized callbacks
- `useEffect()` - Side effects (timers, scanning)

---

## Detection System

### Detector Interface

Each detector in `src/detectors/` exports an object with:

```javascript
export default {
  type: 'python',              // Language identifier
  label: 'Python',              // Display name
  icon: '🐍',                   // Emoji icon
  priority: 95,                  // Numeric priority (higher = preferred)
  files: ['pyproject.toml', 'requirements.txt', ...],  // Manifest files to match
  binaries: ['python3', 'python', 'uv'],  // Required binaries to check
  async build(projectPath, manifest) {
    // Return project object or null
    return {
      id: `${projectPath}::python`,
      path: projectPath,
      name: path.basename(projectPath),
      type: 'Python',
      icon: '🐍',
      priority: this.priority,
      commands: { ... },
      metadata: { ... },
      manifest: path.basename(manifest),
      description: '...',
      missingBinaries: [...],
      frameworks: [...],
      extra: { ... }
    };
  }
}
```

### Detection Priority Order

Detectors are run in this order (highest priority wins):

1. **Node.js** (100) - `package.json`
2. **Python** (95) - `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`, `manage.py`
3. **Rust** (90) - `Cargo.toml`
4. **Go** (85) - `go.mod`
5. **Java** (80) - `pom.xml`, `build.gradle`
6. **PHP** (75) - `composer.json`
7. **Ruby** (70) - `Gemfile`
8. **.NET** (65) - `*.csproj`, `*.fsproj`
9. **Generic** (10) - `Makefile`, `build.sh` (fallback)

### Framework Plugin System

#### Built-in Frameworks (`src/detectors/frameworks.js`)

**40+ frameworks** with the following structure:

```javascript
{
  id: 'fastapi',
  name: 'FastAPI',
  icon: '⚡',
  description: 'Modern fast web framework for Python',
  languages: ['Python'],           // Which languages this applies to
  priority: 112,                  // Plugin priority (boosts project priority)
  match(project) {
    // Return true if this framework is detected
    return dependencyMatches(project, 'fastapi');
  },
  commands(project) {
    // Return commands specific to this framework
    return {
      install: { label: 'FastAPI deps', command: ['pip', 'install', '-r', 'requirements.txt'], source: 'framework' },
      run: { label: 'FastAPI dev', command: ['uvicorn', 'main:app', '--reload'], source: 'framework' },
      test: { label: 'FastAPI test', command: ['pytest'], source: 'framework' }
    };
  }
}
```

#### Custom Plugins (`~/.project-compass/plugins.json`)

Users can add custom framework plugins:

```json
{
  "plugins": [
    {
      "name": "My Framework",
      "icon": "🚀",
      "languages": ["Node.js"],
      "files": ["my-framework.config.js"],
      "dependencies": ["my-framework"],
      "priority": 100,
      "commands": {
        "dev": { "label": "Dev", "command": ["my-cli", "dev"] }
      }
    }
  ]
}
```

---

## State Management

### Current Implementation (in `Compass` component)

All state is managed directly in the `Compass` component:

```javascript
const [projects, setProjects] = useState([]);
const [selectedIndex, setSelectedIndex] = useState(0);
const [viewMode, setViewMode] = useState('list');
const [mainView, setMainView] = useState(initialView);
const [tasks, setTasks] = useState([]);
const [activeTaskId, setActiveTaskId] = useState(null);
const [logOffset, setLogOffset] = useState(0);
const [customMode, setCustomMode] = useState(false);
const [portConfigMode, setPortConfigMode] = useState(false);
// ... more state variables
```

### Unused Store (`src/store/useProjectStore.js`)

Exists but is NOT imported anywhere:

```javascript
export function useProjectStore(initialProjects = []) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('navigator');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [config, setConfig] = useState({ maxVisibleProjects: 8 });
  
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[selectedIndex] || null;
  }, [projects, selectedIndex, selectedProjectId]);

  return { projects, setProjects, selectedIndex, /* ... */ };
}
```

**Note**: This store could be integrated in future versions to centralize state management.

---

## UI Rendering

### Component Tree

```
<Compass>
  ├─ useState: projects, selectedIndex, mainView, viewMode, tasks, etc.
  ├─ useScanner(rootPath) → projects
  ├─ useEffect: startup animation
  ├─ useInput: global keyboard handler
  └─ renderView()
       ├─ Startup Screen (if startup)
       └─ Main Views:
            ├─ Navigator View (mainView === 'navigator')
            │    ├─ <Header> (projects count, time, status)
            │    ├─ Quick Actions Bar (B/T/R/I/0)
            │    ├─ Art Board (if showArtBoard)
            │    ├─ Projects Row:
            │    │    ├─ <Navigator> (project list with pagination)
            │    │    └─ Details Panel:
            │    │         ├─ Project name, type, path
            │    │         ├─ Frameworks
            │    │         ├─ Commands (builtin + custom)
            │    │         └─ Missing binaries warning
            │    ├─ Output Panel: <OutputPanel>
            │    ├─ <Footer> (stdin input, toggle hints)
            │    ├─ Help Cards (if showHelpCards)
            │    ├─ Structure Guide (if showStructureGuide)
            │    └─ Help Overlay (if showHelp)
            │
            ├─ Tasks View (mainView === 'tasks')
            │    └─ <TaskManager>
            │
            ├─ Registry View (mainView === 'registry')
            │    └─ <PackageRegistry>
            │
            ├─ Architect View (mainView === 'architect')
            │    └─ <ProjectArchitect>
            │
            ├─ AI View (mainView === 'ai')
            │    └─ <AIHorizon>
            │
            └─ Studio View (mainView === 'studio')
                 └─ <Studio>
```

### Component Details

#### `<Navigator>` (src/components/Navigator.js)
- **Props**: `projects`, `selectedIndex`, `rootPath`, `loading`, `error`, `maxVisibleProjects`
- **Features**:
  - Paginated project list (page size = `maxVisibleProjects`, default 3)
  - Loading spinner animation
  - Error display
  - Empty state message
  - Framework badges display
  - Missing runtime warnings

#### `<TaskManager>` (src/components/TaskManager.js)
- **Props**: `tasks`, `activeTaskId`, `renameMode`, `renameInput`, `renameCursor`, `CursorText`
- **Features**:
  - Task list with status colors
  - Active task highlighting
  - Mini log preview (last 5 lines)
  - Task renaming
  - Keyboard shortcuts display

#### `<AIHorizon>` (src/components/AIHorizon.js)
- **Props**: `selectedProject`, `CursorText`, `config`, `setConfig`, `saveConfig`
- **Features**:
  - Multi-step flow: provider → model → token → analyze → review
  - AI provider selection (OpenRouter, Gemini, Claude, Ollama)
  - Project context building (README, main file, config)
  - Raw AI response display
  - Editable suggestions
  - Config persistence

#### `<PackageRegistry>` (src/components/PackageRegistry.js)
- **Props**: `selectedProject`, `projects`, `onRunCommand`, `CursorText`, `onSelectProject`
- **Features**:
  - Project selection sub-view
  - Package listing
  - Add/remove packages
  - Python venv creation
  - Native package manager detection

#### `<ProjectArchitect>` (src/components/ProjectArchitect.js)
- **Props**: `rootPath`, `onRunCommand`, `CursorText`, `onReturn`
- **Features**:
  - 7+ templates (Next.js, React, Vue, Rust, Django, Python, Go)
  - Multi-step: framework → path → name
  - Command execution via Orbit

#### `<Studio>` (src/components/Studio.js)
- **Props**: None (checks binaries)
- **Features**:
  - Runtime version checking
  - 9 languages checked (Node, npm, Python, Rust, Go, Java, PHP, Ruby, .NET)
  - Status display (✓/✗)

---

## Command Execution

### Execution Flow

```
User presses key (B/T/R/I or Enter on detail view)
    ↓
useInput handler in Compass component (src/cli.js:324-592)
    ↓
runProjectCommand(commandMeta, project)
    ↓
execa(commandMeta.command[0], commandMeta.command.slice(1), {
  cwd: project.path,
  env: process.env,
  stdin: 'pipe',              // For interactive input
  detached: process.platform !== 'win32'  // For proper cleanup
})
    ↓
subprocess.stdout?.on('data', ...)  // Stream stdout
subprocess.stderr?.on('data', ...)  // Stream stderr
    ↓
addLogToTask(taskId, line)  // Append to task logs
    ↓
Task status updates: 'running' → 'finished' / 'failed' / 'killed'
```

### Task Object Structure

```javascript
{
  id: 'task-' + Date.now(),           // Unique task ID
  name: `${project.name} · ${commandLabel}`,  // Display name
  status: 'running' | 'finished' | 'failed' | 'killed',
  logs: ['line1', 'line2', ...],    // Log lines (capped at 500)
  project: 'Project Name'            // Source project name
}
```

### Process Management

- **Process Map**: `runningProcessMap` (useRef Map)
  - Stores references to child processes
  - Key: taskId
  - Value: execa subprocess object

- **Kill Process** (`handleKillTask`):
  - Windows: `taskkill /pid <pid> /f /t`
  - Unix: `process.kill(-pid, 'SIGKILL')` (process group)
  - Fallback: `proc.kill('SIGKILL')`

- **Kill All** (`killAllTasks`):
  - Iterates `runningProcessMap`
  - Kills each process
  - Clears the map

### Stdin Input

When a process is running and `activeTaskId` is set:
- User typing is captured by `useInput`
- Displayed in Footer's input area (with cursor)
- `Enter` sends `stdinBuffer + '\n'` to `proc.stdin`
- `Backspace/Delete` removes characters
- `Left/Right Arrow` moves cursor

---

## Configuration System

### Config File: `~/.project-compass/config.json`

```json
{
  "customCommands": {
    "/path/to/project": [
      { "label": "My Command", "command": ["echo", "hello"], "source": "custom" }
    ]
  },
  "showArtBoard": true,
  "showHelpCards": false,
  "showStructureGuide": false,
  "maxVisibleProjects": 3,
  "aiProvider": "openrouter",
  "aiModel": "deepseek/deepseek-r1",
  "aiToken": "your-api-token-here",
  "projectMeta": {
    "/path/to/project": { "port": "3000" }
  }
}
```

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customCommands` | Object | `{}` | Per-project custom commands |
| `showArtBoard` | Boolean | `true` | Show/hide the art board |
| `showHelpCards` | Boolean | `false` | Show/hide help cards |
| `showStructureGuide` | Boolean | `false` | Show/hide structure guide |
| `maxVisibleProjects` | Number | `3` | Projects per page in navigator |
| `aiProvider` | String | `"openrouter"` | AI provider ID (openrouter, gemini, claude, ollama) |
| `aiModel` | String | `"deepseek/deepseek-r1"` | AI model to use |
| `aiToken` | String | `""` | API token for AI provider |
| `projectMeta` | Object | `{}` | Per-project metadata (ports, etc.) |

### Loading & Saving

```javascript
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const payload = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(payload || '{}');
      return {
        customCommands: {},
        showArtBoard: true,
        showHelpCards: false,
        showStructureGuide: false,
        maxVisibleProjects: 3,
        ...parsed,
      };
    }
  } catch (error) {
    console.error(`Ignoring corrupt config: ${error.message}`);
  }
  return { customCommands: {}, showArtBoard: true, showHelpCards: false, showStructureGuide: false, maxVisibleProjects: 3 };
}

function saveConfig(config) {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Unable to persist config: ${error.message}`);
  }
}
```

### Project-Specific Config: `compass.config.js`

Create in your project root:

```javascript
export default {
  commands: {
    custom: { 
      label: 'My Command', 
      command: ['echo', 'hello'], 
      source: 'config' 
    }
  },
  frameworks: [
    { name: 'MyFramework', icon: '🚀' }
  ]
};
```

This file is:
1. Checked during `discoverProjects()`
2. Loaded via dynamic `import()` (ESM)
3. Merged into project data (commands + frameworks)
4. Applied BEFORE framework plugin detection

---

## Recent Architecture Changes (v4.3.6)

### 1. Framework Hallucination Bug FIXED

**Problem**: Projects without frameworks were showing random frameworks (e.g., simple Python project with `main.py` was detected as FastAPI).

**Root Cause**: Framework matchers in `frameworks.js` used file existence (`hasProjectFile`) instead of dependency matching.

**Fix Applied** (src/detectors/frameworks.js):
- `fastapi` matcher: Removed `|| hasProjectFile(project.path, 'main.py')` (line 328)
- `django` matcher: Removed `|| hasProjectFile(project.path, 'manage.py')` (line 370)
- `spring-boot` matcher: Removed `|| hasProjectFile(project.path, 'pom.xml') || hasProjectFile(project.path, 'build.gradle')`
- `quarkus` matcher: Removed `|| hasProjectFile(project.path, 'pom.xml')`
- `micronaut` matcher: Removed `|| hasProjectFile(project.path, 'pom.xml')`
- `rails` matcher: Changed to use `dependencyMatches(project, 'rails')` instead of file checks
- `sinatra` matcher: Removed `|| hasProjectFile(project.path, 'config.ru')`
- `.NET` matchers: Now use dependency checks instead of `*.csproj` file existence.

**Result**: Projects without explicit framework dependencies now correctly show `Frameworks: none`.

### 2. compass-config.js Integration

**Problem**: `compass-config.js` existed but was never integrated into project detection.

**Fix Applied** (src/projectDetection.js):
- Added import of `loadProjectConfig` in `projectDetection.js`
- Integrated into `discoverProjects()` function to load `compass.config.js` from project directories
- Project-specific commands and frameworks from `compass.config.js` are now merged into project data

### 3. AI Horizon Improvements

**Problem**: AI Horizon didn't properly show raw AI output and had poor JSON parsing.

**Fix Applied** (src/components/AIHorizon.js):
- Added `rawAIResponse` state to store raw AI output
- Improved JSON parsing to handle markdown code blocks (```json ... ```)
- Raw AI response is now displayed in the UI during review step
- Better error messages showing partial AI response if JSON parsing fails

### 4. Node.js Detector Fixed

**Problem**: `node.js` detector was adding "Node.js" as a framework.

**Fix Applied** (src/detectors/node.js):
- Detector now only adds framework if it's not the generic "Node.js" type
- Projects using plain Node.js without frameworks now show `Frameworks: none`

### 5. Framework Deduplication

**Problem**: `applyFrameworkPlugins()` could add duplicate frameworks.

**Fix Applied** (src/projectDetection.js):
- Added check to avoid adding duplicate frameworks
- Now preserves detector-detected frameworks and merges with plugin-detected ones

---

## Design Patterns

### 1. React-for-CLI

Leveraging React's lifecycle and state management for a terminal environment.

- **Components**: Use `React.createElement` (aliased as `create`), NOT JSX
- **Rendering**: Ink handles terminal rendering (not DOM)
- **Hooks**: Full usage of useState, useEffect, useMemo, useCallback, useRef
- **Events**: `useInput` from Ink for keyboard handling

### 2. Component-Driven

Each view is an isolated component in `src/components`:

- **Modular**: Each component has a single responsibility
- **Props**: Data flows down via props
- **Callbacks**: Actions flow up via callback props
- **Memoization**: Use `React.memo()` for performance

### 3. Async Execution

Heavy lifting (globbing, command execution) is offloaded from the main render loop to prevent UI lag:

- **Project Scanning**: `useScanner()` uses `useEffect` + async/await
- **Command Execution**: `execa` handles subprocesses with streaming
- **AI Calls**: `fetch` API with async/await

### 4. ESM Modules

All code uses ECMAScript modules (`import/export`):

```javascript
// Import
import { discoverProjects } from './projectDetection.js';
import { checkBinary } from './projectDetection.js';

// Export
export default {
  type: 'python',
  // ...
};
```

### 5. Framework Plugin System

Extensible framework detection via `~/.project-compass/plugins.json`:

- **Built-in**: 40+ frameworks in `frameworks.js`
- **Custom**: User-defined in `plugins.json`
- **Detection**: Based on `dependencyMatches()` (not file existence)
- **Priority**: Plugins can boost project priority

---

## Security

### 1. No Arbitrary Execution

Project Compass respects workspace boundaries and does not execute arbitrary code unless explicitly requested by the user.

- **Explicit Actions**: Commands only run when user presses B/T/R/I or Enter
- **Config Validation**: `compass.config.js` is loaded via ESM import (sandboxed)
- **No Auto-Run**: Detection does not execute any project scripts

### 2. Local Storage

API tokens are stored locally in `~/.project-compass/config.json`:

- **File Permissions**: Standard filesystem permissions apply
- **No Cloud**: Tokens never leave your machine except to AI provider
- **User Responsibility**: Users should protect their config file

### 3. Process Isolation

Background tasks are managed via `execa` with proper cleanup:

- **Detached Mode**: Unix uses detached processes for proper process group management
- **Kill Handling**: `SIGKILL` for forceful termination
- **Map Tracking**: `runningProcessMap` tracks all child processes

### 4. Input Sanitization

- **Command Tokens**: User input is split via `split(/\s+/)` and filtered
- **Path Resolution**: `path.resolve()` for safe path handling
- **No Injection**: Commands are executed as arrays (not shell strings)

---

## Performance

### 1. Fast Scanning

Uses `fast-glob` for high-speed project discovery:

- **Deep Scan**: Default depth of 5 directories
- **Ignore Patterns**: `node_modules`, `.git`, `dist`, `build`, `target`
- **Priority Order**: Higher priority detectors run first (fail-fast)

### 2. Non-Blocking

Heavy operations (globbing, command execution) are offloaded from the main render loop:

- **Async/Await**: All I/O operations use async/await
- **Streaming**: Log output streams in real-time
- **Timers**: Startup animation uses `setInterval` (cleaned up)

### 3. Smart Caching

Framework plugins are cached after first load:

```javascript
let cachedFrameworkPlugins = null;

function getFrameworkPlugins() {
  if (cachedFrameworkPlugins) {
    return cachedFrameworkPlugins;  // Return cache
  }
  cachedFrameworkPlugins = [...builtInFrameworks, ...loadUserFrameworks()];
  return cachedFrameworkPlugins;
}
```

### 4. Memory Efficient

Log buffers capped at 500 lines per task:

```javascript
const nextLogs = [...t.logs, ...newLines];
const updatedTask = { ...t, logs: nextLogs.length > 500 ? nextLogs.slice(-500) : nextLogs };
```

### 5. Pagination

Navigator uses pagination to handle large workspaces:

- **Configurable**: `maxVisibleProjects` (default: 3)
- **Page Navigation**: `PgUp/PgDn` for full page jumps
- **Boundary Guards**: Prevents out-of-bounds selection

---

*Built for scale and precision.*  
