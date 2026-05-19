# AGENTS.md - Project Compass Workspace

Welcome to Project Compass. This file provides **COMPLETE** context for AI agents (Clawdy, Claude, Copilot, GPT, etc.) working on this repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Version Information](#version-information)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [Development Rules](#development-rules)
6. [File Reference Quick Links](#file-reference-quick-links)
7. [CLI Arguments (Complete List)](#cli-arguments-complete-list)
8. [TUI Keyboard Shortcuts (Complete List)](#tui-keyboard-shortcuts-complete-list)
9. [Supported Languages](#supported-languages)
10. [Built-in Frameworks](#built-in-frameworks)
11. [Recent Fixes (v5.0.0)](#recent-fixes-v500)
12. [Component Details](#component-details)
13. [Detection System](#detection-system)
14. [State Management](#state-management)
15. [Command Execution Flow](#command-execution-flow)
16. [Configuration System](#configuration-system)
17. [Known Issues & TODO](#known-issues--todo)
18. [Testing Checklist](#testing-checklist)

---

## Overview

**Project Compass** is a futuristic project navigator and runner designed for modern polygot development. It provides a high-fidelity terminal UI (using Ink) and a synchronized Web Dashboard to manage complex workspaces with integrated Agentic AI intelligence.

**Version:** 5.0.0  
**Last Updated:** 2026-05-20  
**Author:** Satyaa & Clawdy  
**License:** MIT  
**Repository:** https://github.com/CrimsonDevil333333/project-compass

### Key Features

- **Neural Convergence**: Single-Brain architecture powering CLI, TUI, and Web.
- **Universal Orchestrator**: Centralized task management and cross-interface log streaming.
- **Zero-Mock Engineering**: Real-world scaffolding and manifest-driven AI DNA analysis.
- **Omni-Studio Diagnostic**: Unified runtime audit for system health.
- **Multi-Language Detection**: Node.js, Python, Rust, Go, Java, PHP, Ruby, .NET
- **Deep Scan Mode**: Unlimited discovery depth (`--deep`)
- **Git Visibility**: Real-time branch and status integration in TUI
- **Task Management**: Background orchestration with status-coded UI

---

## Version Information

| Attribute | Value |
|-----------|-------|
| **Version** | 5.0.0 |
| **NPM Package** | `project-compass` |
| **Node.js Requirement** | ^18.0.0 (ESM support) |
| **Build Status** | Stable |
| **Platform Support** | Linux, macOS, Windows (with caveats) |
| **Last Release** | 2026-05-20 |


---

## Project Structure

### Root Directory

```
project-compass/
├── package.json                    # NPM package config (v5.0.0)
├── README.md                      # Main documentation (COMPREHENSIVE)
├── AGENTS.md                     # THIS FILE (AI agent context)
├── PROJECT_CONTEXT.md             # Technical context for agents
├── src/
│   ├── cli.js                   # Entry point (Unified TUI/CLI)
│   ├── server.js                # Web Server & REST/WS API
│   ├── projectDetection.js       # Discovery orchestrator
│   ├── core/
│   │   ├── Orchestrator.js      # The Brain (Task & Command engine)
│   │   └── AuditEngine.js       # Shared diagnostic engine
│   ├── detectors/
│   │   ├── utils.js            # Shared utilities
│   │   └── frameworks.js       # 40+ built-in plugins
│   └── components/
│       ├── Navigator.js          # Project list
│       ├── AIHorizon.js         # AI analysis
│       ├── ProjectArchitect.js  # Scaffolding
│       └── TaskManager.js        # Orbit Task Manager
├── public/                       # Web Dashboard Production Build
└── ~/.project-compass/           # User config directory
```

│       ├── Navigator.js          # Paginated project list (110 lines)
│       ├── Header.js             # Top bar with logo (60 lines)
│       ├── Footer.js             # Bottom bar with stdin (81 lines)
│       ├── TaskManager.js        # Orbit Task Manager (82 lines)
│       ├── PackageRegistry.js    # Dependency management (156 lines)
│       ├── ProjectArchitect.js  # Scaffolding (113 lines)
│       ├── AIHorizon.js         # AI analysis (426 lines)
│       └── Studio.js            # Environment check (64 lines)
├── node_modules/                # Dependencies (NOT in repo)
└── ~/.project-compass/           # User config directory (NOT in repo)
    ├── config.json             # Main configuration
    └── plugins.json            # Custom framework plugins
```

### Key Files for AI Agents

| File | Lines | Purpose | When to Read |
|------|-------|---------|----------------|
| `src/cli.js` | 1-840 | Main app, all state, input handling | Working on TUI, CLI, or state |
| `src/projectDetection.js` | 1-189 | Detection orchestrator | Working on detection system |
| `src/detectors/utils.js` | 1-148 | Shared utilities | Working on detectors |
| `src/detectors/frameworks.js` | 1-877 | Framework plugins | Working on framework detection |
| `src/components/AIHorizon.js` | 1-426 | AI analysis | Working on AI features |
| `src/components/Navigator.js` | 1-110 | Project list | Working on navigation |
| `src/components/TaskManager.js` | 1-82 | Task management | Working on tasks |
| `AGENTS.md` | 1-600+ | THIS FILE | Start here for context |
| `PROJECT_CONTEXT.md` | 1-400+ | Technical context | Deep technical work |

---

## Tech Stack

### Runtime & Framework

| Technology | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| **Node.js** | ^18.0.0 | Runtime (ESM modules) | https://nodejs.org |
| **React** | ^18.2.0 | UI framework (for CLI) | https://react.dev |
| **Ink** | ^5.1.0 | React for CLI (TUI) | https://github.com/vadimdemedes/ink |
| **kleur** | ^4.1.5 | Terminal colors | https://github.com/lukeedgar/kleur |
| **execa** | ^9.5.2 | Process execution | https://github.com/sindresorhus/execa |
| **fast-glob** | ^3.3.3 | File searching | https://github.com/mrmlnc/fast-glob |

### Native APIs Used

| API | Purpose | Usage |
|-----|---------|-------|
| `fs` | File system operations | Reading manifests, writing config |
| `path` | Path manipulation | Resolving paths, joining |
| `fetch` | HTTP requests | AI provider API calls |
| `setInterval/setTimeout` | Timers | Startup animation, scroll |
| `process` | Process info | Exit codes, signals |

---

## Development Rules

### 1. Zero Mock Data

Always aim for live system/project data.

- ✅ Read actual project files
- ✅ Use real `package.json`, `pyproject.toml`, etc.
- ❌ No hardcoded sample data in production code

### 2. ESM Only

Use `import/export` (no CommonJS).

```javascript
// ✅ Correct
import { something } from './module.js';
export default function() { /* ... */ };

// ❌ Wrong
const something = require('./module');
module.exports = function() { /* ... */ };
```

### 3. Paging Rules

Use `config.maxVisibleProjects` (default: 3) for navigation logic.

- **Navigator pagination**: Pages of `maxVisibleProjects` projects
- **Page Up/Down**: Jump full pages
- **Boundary guards**: Prevent out-of-bounds selection

### 4. Port Logic

Respect `projectMeta` in `config.json` for manual port assignments.

```javascript
// Reading port
const port = config.projectMeta?.[project.path]?.port || '7654';

// Saving port
setConfig((prev) => ({
  ...prev,
  projectMeta: {
    ...prev.projectMeta,
    [project.path]: { ...prev.projectMeta?.[project.path], port: portVal }
  }
}));
```

### 5. No Hallucinations

Framework matchers MUST use `dependencyMatches()` not `hasProjectFile()` for detection.

```javascript
// ✅ Correct (v4.3.6+)
match(project) {
  return dependencyMatches(project, 'fastapi');
}

// ❌ Wrong (causes hallucinations)
match(project) {
  return dependencyMatches(project, 'fastapi') || hasProjectFile(project.path, 'main.py');
}
```

### 6. Component Pattern

Use `React.createElement` (aliased as `create`), not JSX.

```javascript
// ✅ Correct
const create = React.createElement;
return create(Box, {flexDirection: 'column'}, 
  create(Text, {color: 'cyan'}, 'Hello'));
  
// ❌ Wrong (no JSX in this project)
return <Box><Text>Hello</Text></Box>;
```

---

## File Reference Quick Links

| File | Line Numbers | Purpose |
|------|-------------|---------|
| `src/cli.js` | 1-840 | Main app, all state, input handling |
| | 38-45 | `saveConfig()` |
| | 47-65 | `loadConfig()` |
| | 67-90 | `useScanner(rootPath)` |
| | 92-105 | `buildDetailCommands()` |
| | 107-119 | `CursorText` component |
| | 121-161 | `OutputPanel` component |
| | 163-763 | `Compass` React component |
| | 324-592 | `useInput` handler (ALL keyboard shortcuts) |
| | 766-781 | `parseArgs()` |
| | 783-840+ | `main()` |
| `src/projectDetection.js` | 1-189 | Detection orchestrator |
| | 31-71 | `loadUserFrameworks()` |
| | 75-81 | `getFrameworkPlugins()` |
| | 83-112 | `matchesPlugin()` |
| | 114-144 | `applyFrameworkPlugins()` |
| | 146-180 | `discoverProjects()` |
| `src/configPaths.js` | 1-13 | Config paths |
| `src/detectors/utils.js` | 1-148 | Shared utilities |
| | 5-13 | `checkBinary()` |
| | 15-17 | `hasProjectFile()` |
| | 28-80 | `getPackageManager()` |
| | 82-92 | `resolveScriptCommand()` |
| | 94-108 | `dependencyMatches()` |
| | 110-126 | `parseCommandTokens()` |
| `src/detectors/frameworks.js` | 1-877 | Framework plugins |
| | 319-340 | FastAPI framework |
| | 341-361 | Flask framework |
| | 362-383 | Django framework |
| | 468-540 | Rust frameworks |
| | 559-630 | Go frameworks |
| | 631-696 | Java frameworks |
| | 697-790 | PHP frameworks |
| | 752-788 | Ruby frameworks |
| | 790-826 | .NET frameworks |
| `src/detectors/compass-config.js` | 1-39 | Project config loader |
| `src/components/AIHorizon.js` | 1-426 | AI analysis |
| | 16-28 | State variables |
| | 31-40 | `readProjectFile()` |
| | 42-72 | `buildProjectContext()` |
| | 74-192 | `runRealAnalysis()` |
| | 221-329 | `useInput` handler |
| `src/components/Navigator.js` | 1-110 | Project list |
| `src/components/TaskManager.js` | 1-82 | Task management |
| `src/components/PackageRegistry.js` | 1-156 | Package management |
| `src/components/ProjectArchitect.js` | 1-113 | Scaffolding |
| `src/components/Studio.js` | 1-64 | Environment check |

---

## CLI Arguments (Complete List)

### All CLI Arguments

```bash
# Basic usage
project-compass                       # Launch TUI (default: navigator)
project-compass --help                  # Show help (-h)
project-compass --version                # Show version (-v)
project-compass --dir /path/to/ws       # Specify working directory

# Direct view launch
project-compass --studio               # Launch in Studio view
project-compass --ai                   # Launch in AI Horizon view
project-compass --task                 # Launch in Task Manager view
project-compass --tasks                # Alias for --task

# Project detection (no TUI)
project-compass --mode test              # Legacy test mode
project-compass --list-projects        # Enhanced listing (RECOMMENDED)
project-compass --list-projects --json    # JSON output
project-compass --project-info 0         # Project info by index
project-compass --project-info 0 --json # JSON output

# Run commands (no TUI)
project-compass --run "cmd" --dir /path   # Run command directly

# Package management (no TUI)
project-compass --add-pkg "pkg" --dir /path   # Add package
project-compass --remove-pkg "pkg" --dir /path # Remove package

# Project scaffolding (no TUI)
project-compass --scaffold <template> --name <n> --dir <d>

# System & Updates (no TUI)
project-compass --setup-service          # Check runtimes
project-compass --update                 # Update to latest version


# AI analysis (requires TUI)
project-compass --ai-analyze           # Shows message to use TUI mode
```

### All Scaffolding Templates

| Template | Command |
|----------|---------|
| `nextjs` | `npx create-next-app@latest <path>` |
| `nextjs-bun` | `bun create next-app <path>` |
| `react-vite` | `pnpm create vite <path> --template react` |
| `react-vite-npm` | `npm create vite@latest <path> -- --template react` |
| `vue-vite` | `npm create vite@latest <path> -- --template vue` |
| `rust` | `cargo new <path>` |
| `django` | `django-admin startproject <name> <path>` |
| `python-basic` | `mkdir -p <path>` |
| `go` | `go mod init <name>` in new dir |

---

## TUI Keyboard Shortcuts (Complete List)

### Navigation (All Modes)

| Key | Action | Context |
|-----|--------|---------|
| `↑` / `↓` | Move project focus | Navigator |
| `PgUp` / `PgDn` | Jump full project page | Navigator |
| `Enter` | Toggle project Detail View / Switch back | Navigator |
| `Esc` | **Global Back**: Return to Main Navigator | Global |
| `?` | Toggle help overlay | Navigator |
| `Shift+Q` | **Quit** application (confirms if tasks running) | Global |
| `Ctrl+C` | Interrupt running command | When process running |

### Quick Actions (Detail View Only)

| Key | Action | Command |
|-----|--------|---------|
| `0` | **Quick AI Analysis** | Switch to AI Horizon |
| `B` | **Build** project | `commands.build` |
| `T` | **Test** project | `commands.test` |
| `R` | **Run** project | `commands.run` |
| `I` | **Install** dependencies | `commands.install` |
| `1-9` | **Run numbered commands** | `detailShortcutMap` |
| `Shift+1-9` (A-Z) | **Run commands 10+** | `detailShortcutMap` |

### View Toggles

| Key | Action | Target View |
|-----|--------|--------------|
| `Shift+O` | **AI Horizon** Dashboard | `ai` |
| `Shift+T` | **Orbit Task Manager** | `tasks` |
| `Shift+P` | **Package Registry** | `registry` |
| `Shift+N` | **Project Architect** | `architect` |
| `Shift+A` | **Omni-Studio** | `studio` |

### UI Toggles (Saved to Config)

| Key | Action | Config Key |
|-----|--------|----------|
| `Shift+B` | Toggle **Art Board** visibility | `showArtBoard` |
| `Shift+H` | Toggle **Help Cards** UI | `showHelpCards` |
| `Shift+S` | Toggle **Structure Guide** | `showStructureGuide` |

### Task Management

| Key | Action | Context |
|-----|--------|---------|
| `Shift+K` | **Kill** running process | Task Manager |
| `Shift+R` | **Rename** task / Configure Port | Task Manager / Detail View |
| `Shift+D` | **Detach** from active task | Navigator |
| `Shift+X` | **Clear** active task output logs | Navigator |
| `Shift+E` | **Export** logs to `.txt` file | Navigator |
| `Shift+L` | **Rerun** the last executed command | Navigator |
| `↑` / `↓` | Move focus between tasks | Task Manager |
| `Enter` | Select/deselect task | Task Manager |

### Log Scrolling

| Key | Action |
|-----|--------|
| `Shift+↑` | Scroll output logs up |
| `Shift+↓` | Scroll output logs down |

### Project Configuration

| Key | Action | Context |
|-----|--------|---------|
| `Shift+R` | **Configure Port** / Rename task | Detail View / Task Manager |
| `Shift+C` | **Add Custom Command** (`label\|cmd`) | Detail View |

### Stdin Input (When Process Running)

| Key | Action |
|-----|--------|
| Type | Feed stdin to process |
| `Enter` | Submit stdin buffer + `\n` |
| `Backspace` / `Delete` | Delete character before cursor |
| `←` / `→` | Move cursor left/right |

---

## Supported Languages

### Detection Priority Order

| Language | Priority | Manifest Files | Binaries | Package Manager |
|----------|----------|----------------|----------|-----------------|
| **Node.js** | 100 | `package.json` | `node`, `npm` | npm/yarn/pnpm/bun |
| **Python** | 95 | `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`, `manage.py` | `python3`, `python`, `uv` | uv/poetry/pipenv/pip |
| **Rust** | 90 | `Cargo.toml` | `cargo`, `rustc` | cargo |
| **Go** | 85 | `go.mod` | `go` | go |
| **Java** | 80 | `pom.xml`, `build.gradle`, `build.gradle.kts` | `java`, `mvn`, `gradle` | maven/gradle |
| **PHP** | 75 | `composer.json` | `php`, `composer` | composer |
| **Ruby** | 70 | `Gemfile` | `ruby`, `bundle` | bundler |
| **.NET** | 65 | `*.csproj`, `*.fsproj` | `dotnet` | dotnet |
| **Generic** | 10 | `Makefile`, `build.sh` | (varies) | (none) |

### Package Manager Auto-Detection

#### Node.js
```javascript
// Detection order (first found wins):
1. bun.lockb || bun.lock → bun
2. pnpm-lock.yaml → pnpm
3. yarn.lock → yarn
4. package-lock.json → npm
5. default: npm
```

#### Python
```javascript
// Detection order:
1. uv.lock && checkBinary('uv') → uv
2. poetry.lock → poetry
3. Pipfile.lock → pipenv
4. requirements.txt → pip
5. default: pip
```

---

## Built-in Frameworks

### Node.js Frameworks (15+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **Next.js** | 🧭 | 115 | install, dev, build, test, start | ✅ |
| **React** | ⚛️ | 112 | install, dev, build, test | ✅ |
| **Vue.js** | 🟩 | 111 | install, dev, build, test | ✅ |
| **NestJS** | 🛡️ | 110 | install, dev, build, test | ✅ |
| **Nuxt** | 🟢 | 110 | install, dev, build, generate | ✅ |
| **Express** | 🚂 | 108 | install, start, dev | ✅ |
| **Svelte** | 🧡 | 109 | install, dev, build, test | ✅ |
| **Astro** | 🚀 | 108 | install, dev, build, preview | ✅ |
| **Fastify** | ⚡ | 107 | install, start, dev | ✅ |
| **Koa** | 🎋 | 106 | install, start | ✅ |
| **Vite** | ⚡ | 100 | install, dev, build, preview | ✅ |
| **Tailwind CSS** | 🎨 | 50 | init | ✅ |
| **Prisma** | ◮ | 50 | install, generate, studio | ✅ |
| **tRPC** | 🔌 | 45 | dev, build | ✅ |
| **GraphQL** | ◼️ | 48 | start, dev | ✅ |

### Python Frameworks (12+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **FastAPI** | ⚡ | 112 | install, run (uvicorn), test | ✅ |
| **Flask** | 🌶️ | 111 | install, run, test | ✅ |
| **Django** | 🌿 | 110 | install, runserver, test, migrate | ✅ |
| **Sanic** | 🚀 | 106 | run, test | ✅ |
| **AioHTTP** | 🔄 | 105 | test | ✅ |
| **Tornado** | 🌪️ | 104 | run, test | ✅ |
| **Pytest** | ✅ | 50 | run, coverage | ✅ |
| **SQLAlchemy** | 🗄️ | 48 | test | ✅ |
| **Pandas** | 🐼 | 45 | test | ✅ |
| **PyTorch** | 🔥 | 45 | test | ✅ |
| **TensorFlow** | 🧠 | 45 | test | ✅ |

### Rust Frameworks (9+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **Actix Web** | 🎭 | 110 | fetch, run, test, build | ✅ |
| **Axum** | 🗡️ | 108 | fetch, run, test | ✅ |
| **Rocket** | 🚀 | 105 | fetch, run, test | ✅ |
| **Warp** | 🌀 | 104 | run, test | ✅ |
| **Tokio** | ⚡ | 50 | run, test | ✅ |
| **Serde** | 🔄 | - | - | ✅ |
| **SQLx** | 🗄️ | - | - | ✅ |
| **Diesel** | 🛢️ | - | - | ✅ |
| **Tonic** | 🎵 | - | - | ✅ |
| **Tower** | 🏰 | - | - | ✅ |

### Go Frameworks (4+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **Gin** | 🍸 | 110 | mod tidy, run, test, build | ✅ |
| **Fiber** | 🔥 | 109 | run, test | ✅ |
| **Echo** | 🔊 | 108 | run, test | ✅ |
| **Chi** | 🤝 | 105 | run, test | ✅ |

### Java Frameworks (3+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **Spring Boot** | 🍃 | 115 | install, run, test, build | ✅ |
| **Quarkus** | ⚡ | 108 | dev, build, test | ✅ |
| **Micronaut** | 🚀 | 106 | run, test | ✅ |

### PHP Frameworks (3+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **Laravel** | 🧡 | 110 | install, serve, test, migrate | ✅ |
| **Symfony** | 🎵 | 108 | install, server:start, test | ✅ |
| **CodeIgniter** | 🔥 | 104 | test | ✅ |

### Ruby Frameworks (2+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **Ruby on Rails** | 🛤️ | 110 | install, server, test, migrate | ✅ |
| **Sinatra** | 🎷 | 105 | install, rackup | ✅ |

### .NET Frameworks (2+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|----------|---------------|
| **ASP.NET Core** | 🔷 | 110 | restore, run, test, build | ✅ |
| **Blazor** | 🌀 | 105 | run, build | ✅ |

---

## Recent Fixes (v4.3.6)

### 1. Framework Hallucination Bug FIXED

**Problem**: Projects without frameworks were showing random frameworks (e.g., simple Python project with `main.py` was detected as FastAPI).

**Root Cause**: Framework matchers in `frameworks.js` used file existence (`hasProjectFile`) instead of dependency matching.

**Fix Applied** (src/detectors/frameworks.js):
- `fastapi` matcher (line 328): Removed `|| hasProjectFile(project.path, 'main.py')`
- `django` matcher (line 370): Removed `|| hasProjectFile(project.path, 'manage.py')`
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
- Project-specific commands and frameworks from `compass.config.js` are now merged into project data.

### 3. AI Horizon Improvements

**Problem**: AI Horizon didn't properly show raw AI output and had poor JSON parsing.

**Fix Applied** (src/components/AIHorizon.js):
- Added `rawAIResponse` state to store raw AI output
- Improved JSON parsing to handle markdown code blocks (```json ... ```)
- Raw AI response is now displayed in the UI during review step
- Better error messages showing partial AI response if JSON parsing fails.

### 4. Node.js Detector Fixed

**Problem**: `node.js` detector was adding "Node.js" as a framework.

**Fix Applied** (src/detectors/node.js):
- Detector now only adds framework if it's not the generic "Node.js" type
- Projects using plain Node.js without frameworks now show `Frameworks: none`.

### 5. Framework Deduplication

**Problem**: `applyFrameworkPlugins()` could add duplicate frameworks.

**Fix Applied** (src/projectDetection.js):
- Added check to avoid adding duplicate frameworks
- Now preserves detector-detected frameworks and merges with plugin-detected ones.

---

## Recent Fixes (Post-v4.3.6)

### 1. Python Binary Detection Bug FIXED

**Problem**: `python.js` checked if ALL of `['python3', 'python', 'uv']` binaries existed, causing false "Runtime missing" warnings when only `python` or `python3` was available.

**Root Cause**: `binaries.filter(b => !checkBinary(b))` treats alternate Python binary names as separate requirements.

**Fix Applied** (src/detectors/python.js:126-135):
```javascript
const hasPython3 = checkBinary('python3');
const hasPython = checkBinary('python');
const hasUv = checkBinary('uv');
const hasRuntime = hasPython3 || hasPython || hasUv;
const missingBinaries = hasRuntime ? [] : ['python'];
```

**Result**: Only shows "Runtime missing" if NO Python runtime exists at all.

### 2. Removed Unused Store

**Problem**: `src/store/useProjectStore.js` existed but was never imported anywhere.

**Fix Applied**: Removed `src/store/useProjectStore.js` - dead code cleanup.

### 3. Pagination Default Values Fixed

**Problem**: Inconsistent defaults:
- Config default: `maxVisibleProjects: 3`
- `Navigator.js` prop default: `2`  
- `cli.js` pageLimit fallback: `2`

**Fix Applied**:
- `Navigator.js:11`: Changed from `maxVisibleProjects = 2` to `maxVisibleProjects = 3`
- `cli.js:543`: Changed from `config.maxVisibleProjects || 2` to `config.maxVisibleProjects || 3`

---

## Component Details

### Entry Point: `src/cli.js`

**Lines**: 840+  
**Purpose**: Main entry point, argument parsing, global state management, input handling.

#### Key Functions:

| Function | Lines | Purpose |
|----------|-------|---------|
| `parseArgs()` | 766-781 | Parse CLI arguments |
| `main()` | 783-840+ | Main async entry |
| `saveConfig()` | 38-45 | Persist config to disk |
| `loadConfig()` | 47-65 | Load config from `~/.project-compass/config.json` |
| `useScanner()` | 67-90 | Async project detection |
| `buildDetailCommands()` | 92-105 | Build commands for detail view |
| `CursorText()` | 107-119 | Reusable text input with cursor |
| `OutputPanel` | 121-161 | Log output display |
| `Compass` | 163-763 | Main React component |
| `runProjectCommand()` | 264-310 | Execute project command |
| `addLogToTask()` | 203-216 | Append to task logs |
| `handleKillTask()` | 236-255 | Kill running task |
| `killAllTasks()` | 257-262 | Kill all running tasks |

#### Key React Component: `Compass` (lines 163-763)

**State Variables**:
- `projects` - Detected projects array
- `selectedIndex` - Currently selected project index
- `viewMode` - 'list' or 'detail'
- `mainView` - 'navigator', 'tasks', 'registry', 'architect', 'ai', 'studio'
- `tasks` - Array of running/completed tasks
- `activeTaskId` - Currently selected task
- `config` - Loaded from `~/.project-compass/config.json`
- `runningProcessMap` - Ref Map of task IDs to child processes
- `lastCommandRef` - Last executed command for replay (Shift+L)

**Hooks Used**:
- `useScanner(rootPath)` - Async project detection
- `useInput()` - Global keyboard input handling (lines 324-592)
- `useState()` - Multiple state variables
- `useMemo()` - Memoized computations
- `useCallback()` - Memoized callbacks
- `useEffect()` - Side effects (timers, scanning)

### `Navigator.js` (src/components/Navigator.js)

**Props**: `projects`, `selectedIndex`, `rootPath`, `loading`, `error`, `maxVisibleProjects`  
**Lines**: 110

**Features**:
- Paginated project list (page size = `maxVisibleProjects`, default 3)
- Loading spinner animation
- Error display
- Empty state message
- Framework badges display
- Missing runtime warnings

### `TaskManager.js` (src/components/TaskManager.js)

**Props**: `tasks`, `activeTaskId`, `renameMode`, `renameInput`, `renameCursor`, `CursorText`  
**Lines**: 82

**Features**:
- Task list with status colors
- Active task highlighting
- Mini log preview (last 5 lines)
- Task renaming
- Keyboard shortcuts display

### `AIHorizon.js` (src/components/AIHorizon.js)

**Props**: `selectedProject`, `CursorText`, `config`, `setConfig`, `saveConfig`  
**Lines**: 426

**Features**:
- Multi-step flow: provider → model → token → analyze → review
- AI providers: OpenRouter, Gemini, Claude, Ollama
- Project context building (README, main file, config)
- Raw AI response display
- Editable suggestions
- Config persistence

### `PackageRegistry.js` (src/components/PackageRegistry.js)

**Props**: `selectedProject`, `projects`, `onRunCommand`, `CursorText`, `onSelectProject`  
**Lines**: 156

**Features**:
- Project selection sub-view
- Package listing
- Add/remove packages
- Python venv creation
- Native package manager detection

### `ProjectArchitect.js` (src/components/ProjectArchitect.js)

**Props**: `rootPath`, `onRunCommand`, `CursorText`, `onReturn`  
**Lines**: 113

**Features**:
- 7+ templates (Next.js, React, Vue, Rust, Django, Python, Go)
- Multi-step: framework → path → name
- Command execution via Orbit

### `Studio.js` (src/components/Studio.js)

**Props**: None (checks binaries)  
**Lines**: 64

**Features**:
- Runtime version checking
- 8 languages checked (Node, npm, Python, Rust, Go, Java, PHP, Ruby, .NET)
- Status display (✓/✗)

---

## Detection System

### How Detection Works

1. **User runs**: `project-compass` or `node src/cli.js`
2. **`parseArgs()`** (line 766): Parse CLI arguments
3. **`main()`** (line 783): Entry point
4. **`useScanner(rootPath)`** (line 67): Async effect
5. **`discoverProjects(root)`** (projectDetection.js:146):
   - Iterate through `detectors` array (priority order)
   - For each detector, use `fast-glob` to find manifest files
   - Run `detector.build(projectPath, manifest)` to get project object
   - Load `compass.config.js` (if exists) and merge
   - Apply `applyFrameworkPlugins()` to add framework commands
   - Return sorted array (by priority)
6. **State Update**: Projects stored in `Compass` component state
7. **UI Render**: Ink components display projects

### Detector Interface

Each detector in `src/detectors/` exports:

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
    return dependencyMatches(project, 'fastapi');  // ✅ Use dependencyMatches()
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



---

## Command Execution Flow

### Execution Flow

```
User presses key (Alt+B/Alt+T/Alt+R/Alt+I or Enter on detail view)
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
    "/path/to/project": { "port": "7654" }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `customCommands` | Object | `{}` | Per-project custom commands |
| `showArtBoard` | Boolean | `true` | Show/hide the art board |
| `showHelpCards` | Boolean | `false` | Show/hide help cards |
| `showStructureGuide` | Boolean | `false` | Show/hide structure guide |
| `maxVisibleProjects` | Number | `3` | Projects per page in navigator |
| `aiProvider` | String | `"openrouter"` | AI provider ID |
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

## Known Issues & TODO

### Known Issues

1. **Config Loading**: `loadConfig()` is called in `useState(() => loadConfig())`
   - If config file is corrupted, falls back to defaults but doesn't persist the fix

2. **Process Killing on Windows**: Line 242 in `cli.js`
   - May not properly kill child processes on Windows

3. **Log Buffer Memory**: Capped at 500 lines, but truncation happens in `addLogToTask`
   - If many tasks run simultaneously, memory could grow

4. **fast-glob Depth**: `projectDetection.js` line 155
   - `deep: 5` could miss deeply nested projects or be slow on large directories

5. **AI JSON Parsing**: `AIHorizon.js` line 173
   - Regex may fail on malformed JSON or if AI returns code blocks

### TODO (Future Enhancements)

1. **Add More Detectors**: Flutter, Elixir, Swift, Haskell
2. **Improve Log Viewing**: [COMPLETED v5.0] WebSocket streaming in Web UI
3. **Enhanced AI Integration**: [COMPLETED v5.0] MCP tool exposition for AI agents
4. **Configuration UI**: [COMPLETED v5.0] Web Dashboard settings
5. **Project Groups/Tags**: [COMPLETED v5.0] Orchestrator-level grouping
6. **WebSocket/Real-time Updates**: [COMPLETED v5.0] Full WebSocket log engine
7. **Task Dependencies**: Allow tasks to depend on other tasks
8. **Plugin Marketplace**: Dynamic loading of community framework plugins

---

## Testing Checklist

### Before Committing

- [ ] Run `npm run lint` - Must pass with 0 errors
- [ ] Run `npm run test` - Project detection works
- [ ] Test all CLI arguments (see CLI Arguments section)
- [ ] Test all TUI keyboard shortcuts (see TUI Keyboard Shortcuts section)
- [ ] Test with projects WITHOUT frameworks (should show "none")
- [ ] Test with projects WITH frameworks (should detect correctly)
- [ ] Test AI Horizon with real API token
- [ ] Test package management (add/remove)
- [ ] Test project scaffolding
- [ ] Test task management (kill, rename, export)
- [ ] Update ALL markdown files with changes
- [ ] Use conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`)

### Quick Test Commands

```bash
# Lint
npm run lint

# Project detection
node src/cli.js --list-projects --dir /path/to/workspace

# CLI run
node src/cli.js --run "echo test" --dir /tmp

# Package management
node src/cli.js --add-pkg "express" --dir /path/to/project

# Scaffolding
node src/cli.js --scaffold python-basic --name test --dir /tmp

# Environment check
node src/cli.js --studio-check

# TUI mode
npm start
```

---

