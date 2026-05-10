# Project Compass - Context Document

## Overview
Project Compass is a terminal UI (TUI) workspace navigator and runner built with **Ink (React for CLI)**. It automatically detects projects across multiple languages and provides an interface to manage, run, and analyze them with optional AI integration.

**Version:** 4.3.6  
**Author:** Satyaa & Clawdy  
**License:** MIT

---

## Architecture

### Entry Point
- **`src/cli.js`** - Main entry point with argument parsing and the root `Compass` React component
  - Handles: `--dir`, `--mode test`, `--studio`, `--ai`, `--task`, `--help`, `--version`
  - Renders the Ink application with the `Compass` component

### Core Detection System
- **`src/projectDetection.js`** - Orchestrates project discovery
  - Uses `fast-glob` to scan for manifest files
  - Runs detectors in priority order (higher priority wins)
  - Applies framework plugins after detection
  - Exports `discoverProjects(root)` async function

### Detectors (`src/detectors/`)
Each detector exports an object with:
- `type` - Language identifier
- `label` - Display name
- `icon` - Emoji icon
- `priority` - Numeric priority (higher = preferred)
- `files` - Manifest files to match
- `binaries` - Required binaries to check
- `build(projectPath, manifest)` - Async function returning project object

**Available Detectors:**
| Detector | Priority | Manifest Files | Package Manager |
|----------|----------|----------------|-----------------|
| `node.js` | 100 | `package.json` | Auto-detects: npm/yarn/pnpm/bun |
| `python.js` | 95 | `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`, `manage.py` | Auto-detects: uv/poetry/pipenv/pip |
| `rust.js` | 90 | `Cargo.toml` | cargo |
| `go.js` | 85 | `go.mod` | go |
| `java.js` | 80 | `pom.xml`, `build.gradle` | maven/gradle |
| `php.js` | 75 | `composer.json` | composer |
| `ruby.js` | 70 | `Gemfile` | bundler |
| `dotnet.js` | 65 | `*.csproj`, `*.fsproj` | dotnet |
| `generic.js` | 10 | Various | None |

### Framework Plugins (`src/detectors/frameworks.js`)
Built-in framework detection with 40+ frameworks:
- **Node.js:** Next.js, React, Vue, Express, Fastify, Koa, NestJS, Svelte, Astro, Nuxt, Vite, Tailwind, Prisma, tRPC, GraphQL
- **Python:** FastAPI, Flask, Django, AioHTTP, Sanic, Tornado, Pytest, SQLAlchemy
- **Rust:** Actix, Rocket, Axum, Warp, Tokio
- **Go:** Gin, Echo, Fiber, Chi
- **Java:** Spring Boot, Quarkus, Micronaut
- **PHP:** Laravel, Symfony, CodeIgniter
- **Ruby:** Rails, Sinatra
- **.NET:** ASP.NET Core, Blazor
- **ML/Data:** Pandas, PyTorch, TensorFlow

**Plugin System:** Users can add custom frameworks via `~/.project-compass/plugins.json`

### Components (`src/components/`)
All components use `React.createElement` directly (no JSX) with Ink's `Box` and `Text`.

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Navigator.js` | Project list with pagination (maxVisibleProjects) | `projects`, `selectedIndex`, `rootPath`, `loading`, `error`, `maxVisibleProjects` |
| `Header.js` | Top bar with logo, status, time | `projectCountLabel`, `rootPath`, `running`, `toggleHint`, `orbitHint` |
| `Footer.js` | Bottom bar with stdin input | `toggleHint`, `running`, `stdinBuffer`, `stdinCursor`, `CursorText` |
| `TaskManager.js` | Orbit Task Manager for background processes | `tasks`, `activeTaskId`, `renameMode`, `renameInput`, `renameCursor`, `CursorText` |
| `PackageRegistry.js` | Dependency management (add/remove) | `selectedProject`, `projects`, `onRunCommand`, `CursorText`, `onSelectProject` |
| `ProjectArchitect.js` | Scaffolding/new project templates | `rootPath`, `onRunCommand`, `CursorText`, `onReturn` |
| `AIHorizon.js` | AI-powered project analysis | `selectedProject`, `CursorText`, `config`, `setConfig`, `saveConfig` |
| `Studio.js` | Environment health check (runtimes) | None (checks binaries) |

### State Management
- **Primary State:** Held in `Compass` component (`src/cli.js`)
  - `projects` - Detected projects array
  - `selectedIndex` - Currently selected project index
  - `viewMode` - 'list' or 'detail'
  - `mainView` - 'navigator', 'tasks', 'registry', 'architect', 'ai', 'studio'
  - `tasks` - Array of running/completed tasks
  - `activeTaskId` - Currently selected task
  - `config` - Loaded from `~/.project-compass/config.json`

- **Config Persistence:** `src/configPaths.js`
  - Config dir: `~/.project-compass/`
  - Config file: `config.json`
  - Plugin file: `plugins.json`

---

## Data Flow

### Project Detection Flow
```
User runs project-compass
    ↓
cli.js: main() → discoverProjects(rootPath)
    ↓
projectDetection.js: Iterates detectors[]
    ↓
For each detector: fast-glob → find manifest files → detector.build()
    ↓
Apply framework plugins (frameworks.js + plugins.json)
    ↓
Return sorted array (by priority) → stored in Compass state
```

### Command Execution Flow
```
User presses key (b/t/r/i or Enter on detail view)
    ↓
useInput handler in Compass component
    ↓
runProjectCommand(commandMeta, project)
    ↓
execa spawns subprocess with:
    - cwd: project.path
    - stdin: 'pipe' (for interactive input)
    - detached: true (on non-Windows)
    ↓
stdout/stderr → addLogToTask(taskId, line)
    ↓
Task status updates: 'running' → 'finished'/'failed'/'killed'
```

### Task Management
- Tasks stored in `tasks` array with shape:
  ```javascript
  {
    id: 'task-' + Date.now(),
    name: 'Project · Command',
    status: 'running' | 'finished' | 'failed' | 'killed',
    logs: string[],
    project: 'Project Name'
  }
  ```
- Process references stored in `runningProcessMap` (useRef Map)
- Log buffer capped at 500 lines

---

## Keyboard Shortcuts

### Global Navigation
| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate projects |
| `PgUp` / `PgDn` | Jump pages (maxVisibleProjects) |
| `Enter` | Toggle detail view |
| `Esc` | Back to navigator / cancel input |
| `?` | Toggle help overlay |

### Quick Actions (in detail view)
| Key | Action |
|-----|--------|
| `B` | Build |
| `T` | Test |
| `R` | Run |
| `I` | Install |
| `0` | AI Analysis (switches to AI view) |

### Number Keys (detail view)
| Key | Action |
|-----|--------|
| `1-9` | Run numbered commands |
| `Shift+1-9` (A-Z) | Run commands 10+ |

### Shift Combinations
| Key | Action |
|-----|--------|
| `Shift+H` | Toggle help cards |
| `Shift+S` | Toggle structure guide |
| `Shift+A` | Toggle Studio view |
| `Shift+P` | Package Registry |
| `Shift+N` | Project Architect |
| `Shift+O` | AI Horizon |
| `Shift+T` | Task Manager |
| `Shift+Q` | Quit (with confirmation if tasks running) |
| `Shift+B` | Toggle Art Board |
| `Shift+X` | Clear active log |
| `Shift+E` | Export logs to file |
| `Shift+D` | Detach from task |
| `Shift+L` | Re-run last command |
| `Shift+C` | Add custom command |
| `Shift+R` (tasks) | Rename task |
| `Shift+K` (tasks) | Kill task |
| `Shift+↑/↓` | Scroll output logs |

### Custom Input Modes
- **Custom Command:** `Shift+C` → `label|command` format
- **Port Config:** `Shift+R` in detail → enter port number
- **Rename Task:** `Shift+R` in tasks → enter new name
- **Stdin Input:** When process running → type → Enter to send

---

## Recent Fixes (2026-05-08)

### 1. Framework Hallucination Bug FIXED
**Problem:** Projects without frameworks were showing random frameworks (e.g., simple Python project with `main.py` was detected as FastAPI).

**Root Cause:** Framework matchers in `frameworks.js` used file existence (`hasProjectFile`) instead of dependency matching.

**Fix Applied:**
- `fastapi` matcher: Removed `|| hasProjectFile(project.path, 'main.py')` (line 328)
- `django` matcher: Removed `|| hasProjectFile(project.path, 'manage.py')` (line 370)
- `spring-boot` matcher: Removed `|| hasProjectFile(project.path, 'pom.xml') || hasProjectFile(project.path, 'build.gradle')`
- `quarkus` matcher: Removed `|| hasProjectFile(project.path, 'pom.xml')`
- `micronaut` matcher: Removed `|| hasProjectFile(project.path, 'pom.xml')`
- `rails` matcher: Changed to use `dependencyMatches(project, 'rails')` instead of file checks
- `sinatra` matcher: Removed `|| hasProjectFile(project.path, 'config.ru')`
- `.NET` matchers: Now use dependency checks instead of `*.csproj` file existence

**Result:** Projects without explicit framework dependencies now correctly show `Frameworks: none`.

### 2. compass-config.js Integration
**Problem:** `compass-config.js` existed but was never integrated into project detection.

**Fix Applied:**
- Added import of `loadProjectConfig` in `projectDetection.js`
- Integrated into `discoverProjects()` function to load `compass.config.js` from project directories
- Project-specific commands and frameworks from `compass.config.js` are now merged into project data

### 3. AI Horizon Improvements
**Problem:** AI Horizon didn't properly show raw AI output and had poor JSON parsing.

**Fix Applied:**
- Added `rawAIResponse` state to store raw AI output
- Improved JSON parsing to handle markdown code blocks (```json ... ```)
- Raw AI response is now displayed in the UI during review step
- Better error messages showing partial AI response if JSON parsing fails

### 4. Node.js Framework Detection
**Problem:** `node.js` detector was adding "Node.js" as a framework.

**Fix Applied:**
- Detector now only adds framework if it's not the generic "Node.js" type
- Projects using plain Node.js without frameworks now show `Frameworks: none`

### 5. Framework Deduplication
**Problem:** `applyFrameworkPlugins()` could add duplicate frameworks.

**Fix Applied:**
- Added check to avoid adding duplicate frameworks
- Now preserves detector-detected frameworks and merges with plugin-detected ones

---

## Common Patterns

### Component Creation
All components use `React.createElement` (aliased as `create`):
```javascript
const create = React.createElement;
// ...
create(Box, {flexDirection: 'column'}, 
  create(Text, {color: 'cyan'}, 'Hello'))
```

### Input Handling
Components use Ink's `useInput` hook:
```javascript
useInput((input, key) => {
  if (key.return) { /* handle enter */ }
  if (key.escape) { /* handle escape */ }
  if (key.upArrow) { /* handle up */ }
  if (input) { /* handle character input */ }
});
```

### Cursor Text Input
Reusable `CursorText` component for text input with cursor:
```javascript
<CursorText value={input} cursorIndex={cursor} active={isActive} />
```

### Command Structure
Commands are stored as:
```javascript
{
  label: 'Display Name',
  command: ['executable', 'arg1', 'arg2'],  // Array form
  source: 'builtin' | 'custom' | 'framework' | 'plugin' | 'ai'
}
```

---

## Potential Bug Areas

### 1. **Config Loading**
- `loadConfig()` is called in `useState(() => loadConfig())` 
- If config file is corrupted, falls back to defaults but doesn't persist the fix

### 2. **Process Killing on Windows**
- Line 242: `execa('taskkill', ['/pid', proc.pid, '/f', '/t'])`
- May not properly kill child processes

### 3. **Log Buffer Memory**
- Capped at 500 lines, but truncation happens in `addLogToTask`
- If many tasks run simultaneously, memory could grow

### 4. **fast-glob Depth**
- `projectDetection.js` line 155: `deep: 5`
- Could miss deeply nested projects or be slow on large directories

### 5. **AI JSON Parsing**
- `AIHorizon.js` line 173: `aiText.match(/{[\s\S]*?}/)`
- Regex may fail on malformed JSON or if AI returns code blocks

---

## Enhancement Opportunities

### 1. **Add More Detectors**
- Flutter (`pubspec.yaml`)
- Elixir (`mix.exs`)
- Swift (`Package.swift`)
- Haskell (`stack.yaml` or `.cabal`)

### 3. **Improve Log Viewing**
- Add search/filter in log panel
- Click to expand collapsed logs
- Export per-task logs (currently exports active only)

### 4. **Enhanced AI Integration**
- Stream AI responses (currently waits for full response)
- Support more AI providers (OpenAI, Anthropic directly)
- Cache AI suggestions per project

### 5. **Configuration UI**
- Add a settings view to configure:
  - maxVisibleProjects
  - AI provider settings
  - Custom keybindings
  - Theme/colors

### 6. **Task Dependencies**
- Allow tasks to depend on other tasks
- Sequential task execution

### 7. **Project Groups/Tags**
- Allow users to tag projects
- Filter projects by tag

### 8. **WebSocket/Real-time Updates**
- Watch for file changes and re-detect projects
- Hot-reload when `plugins.json` changes

---

## File Reference Quick Links

| File | Line Numbers | Purpose |
|------|-------------|---------|
| `src/cli.js` | 1-840 | Main app, all state, input handling |
| `src/projectDetection.js` | 1-189 | Detection orchestrator |
| `src/detectors/utils.js` | 1-148 | Shared utilities |
| `src/detectors/frameworks.js` | 1-877 | Framework plugins |
| `src/detectors/node.js` | 1-140 | Node.js detection |
| `src/detectors/python.js` | 1-208 | Python detection |
| `src/components/Navigator.js` | 1-110 | Project list |
| `src/components/TaskManager.js` | 1-82 | Task management |
| `src/components/AIHorizon.js` | 1-426 | AI analysis |
| `src/configPaths.js` | 1-13 | Config file paths |

---

## Development Commands

```bash
# Start the app
node src/cli.js

# Test project detection only
node src/cli.js --mode test

# Lint
npm run lint

# Directories
~/.project-compass/config.json    # User config
~/.project-compass/plugins.json   # Custom framework plugins
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ink` | ^5.1.0 | React for CLI (TUI) |
| `react` | ^18.2.0 | UI framework |
| `execa` | ^9.5.2 | Process execution |
| `fast-glob` | ^3.3.3 | File searching |
| `kleur` | ^4.1.5 | Terminal colors |

---

**Last Updated:** 2026-05-08  
**Context For:** Bug fixes, enhancements, feature development
