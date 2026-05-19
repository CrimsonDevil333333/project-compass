# Project Compass · Complete Commands & Shortcuts Reference

This document lists **ALL** supported languages, frameworks, commands, keyboard shortcuts, and CLI arguments available in Project Compass (v5.1.0).


---

## Table of Contents

1. [CLI Arguments (Non-TUI Mode)](#cli-arguments-non-tui-mode)
2. [TUI Keyboard Shortcuts](#tui-keyboard-shortcuts)
3. [Navigation Commands](#navigation-commands)
4. [Quick Actions](#quick-actions)
5. [View Toggles](#view-toggles)
6. [Task Management](#task-management)
7. [Package Management](#package-management)
8. [Project Scaffolding](#project-scaffolding)
9. [AI Features](#ai-features)
10. [Supported Languages](#supported-languages)
11. [Built-in Frameworks](#built-in-frameworks)
12. [Advanced Configuration](#advanced-configuration)

---

## CLI Arguments (Non-TUI Mode)

### Basic Usage

```bash
# Show help (all commands)
project-compass --help
project-compass -h

# Show version
project-compass --version
project-compass -v

# Launch TUI (default: navigator view)
project-compass
project-compass --dir /path/to/workspace
project-compass --deep                  # Launch with unlimited scan depth
```

### Direct View Launch

```bash
# Launch directly into specific views
project-compass --studio              # Launch in Studio view
project-compass --ai                   # Launch in AI Horizon view
project-compass --task                  # Launch in Task Manager view
project-compass --tasks                 # Alias for --task
```

### Project Detection (No TUI)

```bash
# Legacy test mode (simple list)
project-compass --mode test
project-compass --dir /path/to/workspace --mode test

# Enhanced project listing (RECOMMENDED)
project-compass --list-projects
project-compass --list-projects --dir /path/to/workspace
project-compass --list-projects --deep # Deep scan mode

# Get project info by index
project-compass --project-info 0
project-compass --project-info 1 --dir /path/to/workspace

# Output as JSON (for scripting/automation)
project-compass --list-projects --json
project-compass --project-info 0 --json
```

### Run Commands Directly (No TUI)

```bash
# Run any command in a project directory
project-compass --run "npm install" --dir /path/to/project
project-compass --run "uv sync" --dir /path/to/python
project-compass --run "cargo build" --dir /path/to/rust
project-compass --run "go mod tidy" --dir /path/to/go

# Command runs with:
# - Working directory: --dir value (or current directory)
# - Inherit stdin/stdout/stderr
# - Current environment variables
# - Waits for completion before exiting
```

### Server & MCP Mode (Omni-Upgrade v5.0)

```bash
# Launch the high-fidelity Web Server & Dashboard
project-compass --server
project-compass --server --port 8080 --host 127.0.0.1

# Launch as a native Model Context Protocol (MCP) server
project-compass --mcp
```

### System & Updates (No TUI)

```bash
# Generate systemd service for background mode
project-compass --setup-service
project-compass --setup-service --port 7654 --host 0.0.0.0

# Update Project Compass to the latest version
project-compass --update
```

### Package Management (No TUI)

```bash
# Add packages to project
project-compass --add-pkg "express" --dir /path/to/node-project
project-compass --add-pkg "fastapi" --dir /path/to/python-project
project-compass --add-pkg "lodash" --dir /path/to/project

# Remove packages from project
project-compass --remove-pkg "lodash" --dir /path/to/node-project
project-compass --remove-pkg "requests" --dir /path/to/python-project

# Auto-detects package manager:

# - Node.js: npm/yarn/pnpm/bun
# - Python: pip/uv/poetry/pipenv
# - Rust: cargo
# - Go: go
# - Java: maven/gradle
# - PHP: composer
# - Ruby: bundler
# - .NET: dotnet
```

### Project Scaffolding (No TUI)

```bash
# Create new projects from templates
project-compass --scaffold nextjs --name my-app --dir /path/to/output
project-compass --scaffold nextjs-bun --name my-app --dir /path/to/output
project-compass --scaffold react-vite --name my-app --dir /path/to/output
project-compass --scaffold react-vite-npm --name my-app --dir /path/to/output
project-compass --scaffold vue-vite --name my-app --dir /path/to/output
project-compass --scaffold rust --name my-app --dir /path/to/output
project-compass --scaffold django --name my-app --dir /path/to/output
project-compass --scaffold python-basic --name my-app --dir /tmp
project-compass --scaffold go --name my-app --dir /path/to/output

# Available templates:
# - nextjs: Next.js with npm
# - nextjs-bun: Next.js with Bun
# - react-vite: React with Vite (pnpm)
# - react-vite-npm: React with Vite (npm)
# - vue-vite: Vue with Vite
# - rust: Rust Cargo binary
# - django: Django project (startproject)
# - python-basic: Basic Python directory
# - go: Go module (mod init)
```

### Environment Health Check (No TUI)

```bash
# Check installed runtimes
project-compass --studio-check

# Output example:
# Environment Health Check:
# ✓ Node.js: v24.15.0
# ✓ npm: 11.12.1
# ✓ Python: Python 3.13.5
# ✗ Rust (Cargo): not installed
# ✓ Go: go version go1.24.4 linux/arm64
# ✓ Java: openjdk version "21.0.11" 2026-04-21
# ✗ PHP: not installed
# ✓ Ruby: ruby 3.3.8 (2025-04-09 revision b200bad6cd)
# ✗ .NET: not installed

# Checks these runtimes:
# - Node.js (node)
# - npm
# - Python (python3/python)
# - Rust (cargo)
# - Go (go)
# - Java (java)
# - PHP (php)
# - Ruby (ruby)
# - .NET (dotnet)
```

### AI Analysis

```bash
# AI analysis requires interactive TUI mode for API configuration
project-compass --ai
project-compass --ai --dir /path/to/project

# Note: --ai-analyze flag shows message to use TUI mode
project-compass --ai-analyze
# Output: "AI analysis requires interactive TUI mode for API configuration."
#         "Please use: project-compass --ai"
```

### JSON Output (For Scripting)

```bash
# Output project list as JSON
project-compass --list-projects --json

# Output specific project info as JSON
project-compass --project-info 0 --json

# Use with jq for parsing:
project-compass --list-projects --json | jq '.[0].name'
project-compass --list-projects --json | jq '.[0].frameworks'
project-compass --list-projects --json | jq -r '.[0].path'
```

---

## TUI Keyboard Shortcuts

### Navigation (All Modes)

| Key | Action | Context | Description |
|-----|--------|---------|-------------|
| `↑` | Move project focus up | Navigator | Move to previous project in list |
| `↓` | Move project focus down | Navigator | Move to next project in list |
| `PgUp` | Jump full project page up | Navigator | Jump up by `maxVisibleProjects` (default: 3) |
| `PgDn` | Jump full project page down | Navigator | Jump down by `maxVisibleProjects` (default: 3) |
| `Enter` | Toggle project Detail View | Navigator | Show/hide project details |
| `Enter` | Select/deselect task | Task Manager | Select task for actions |
| `Enter` | Confirm selection | All sub-views | Confirm current selection |
| `Esc` | **Global Back** | Global | Return to Main Navigator from any view |
| `?` | Toggle help overlay | Navigator | Show/hide help overlay |
| `Shift+Q` | **Quit** application | Global | Quit (confirms if tasks are running) |
| `Ctrl+C` | Interrupt running command | When process running | Send SIGINT to running process |

### Quick Actions (Detail View & Navigator)

| Key | Action | Context |
|-----|--------|---------|
| `0` | **Quick AI Analysis** | Detail View |
| `A` | **AI Error Analysis** | Navigator (when task failed) |
| `C` | **AI Context Chat** | AI Horizon |
| `B` | **Build** project | Detail View |
| `T` | **Test** project | Detail View |
| `R` | **Run** project | Detail View |
| `I` | **Install** dependencies | Detail View |
| `1-9` | **Run numbered commands** | Detail View |
| `Shift+1-9` (A-Z) | **Run commands 10+** | Detail View |
| `Shift+L` | **Rerun** last command | Navigator |

### View Toggles

| Key | Action | Target View | Description |
|-----|--------|--------------|-------------|
| `Shift+O` | **AI Horizon** Dashboard | `ai` | Workspace intelligence & analysis |
| `Shift+T` | **Orbit Task Manager** | `tasks` | Manage background processes |
| `Shift+P` | **Package Registry** | `registry` | Dependency management |
| `Shift+N` | **Project Architect** | `architect` | Scaffold new projects |
| `Shift+A` | **Omni-Studio** | `studio` | Environment & runtime health |

### UI Toggles (Saved to Config)

| Key | Action | Config Key | Description |
|-----|--------|----------|-------------|
| `Shift+B` | Toggle **Art Board** visibility | `showArtBoard` | Show/hide build atlas |
| `Shift+H` | Toggle **Help Cards** UI | `showHelpCards` | Show/hide help cards |
| `Shift+S` | Toggle **Structure Guide** | `showStructureGuide` | Show/hide structure guide |

### Task Management

| Key | Action | Context | Description |
|-----|--------|---------|-------------|
| `Shift+K` | **Kill** running process | Task Manager | Kill selected task |
| `Shift+R` | **Rename** task | Task Manager | Rename selected task (opens input) |
| `Shift+R` | **Configure Port** | Detail View | Set port for selected project |
| `Shift+D` | **Detach** from active task | Navigator | Detach (runs in background) |
| `Shift+X` | **Clear** active task output logs | Navigator | Clear log buffer |
| `Shift+E` | **Export** logs to `.txt` | Navigator | Export to `compass-task-*.txt` |
| `Shift+L` | **Rerun** the last executed command | Navigator | Repeat last command |
| `↑` / `↓` | Move focus between tasks | Task Manager | Select different task |
| `Enter` | Select/deselect task | Task Manager | Confirm task selection |

### Log Scrolling

| Key | Action | Description |
|-----|--------|-------------|
| `Shift+↑` | Scroll output logs up | Scroll up in active task log |
| `Shift+↓` | Scroll output logs down | Scroll down in active task log |

### Project Configuration

| Key | Action | Context | Description |
|-----|--------|---------|-------------|
| `Shift+R` | **Configure Port** | Detail View | Set port for selected project |
| `Shift+R` | **Rename task** | Task Manager | Rename selected task |
| `Shift+C` | **Add Custom Command** | Detail View | Add `label\|cmd` to project |

### Stdin Input (When Process Running)

| Key | Action | Description |
|-----|--------|-------------|
| `Type` | Feed stdin | Characters typed go to process stdin |
| `Enter` | Submit stdin | Sends `stdinBuffer + '\n'` to process |
| `Backspace` / `Delete` | Delete character | Remove character before cursor |
| `←` / `→` | Move cursor | Move cursor left/right in input |

### Text Input Modes (Custom Command, Port Config, Rename, etc.)

| Key | Action | Description |
|-----|--------|-------------|
| `Type` | Enter text | Characters typed go into input buffer |
| `Enter` | Confirm | Submit current input |
| `Esc` | Cancel | Cancel current input mode |
| `Backspace` / `Delete` | Delete | Remove character before cursor |
| `←` / `→` | Move cursor | Move cursor left/right |

---

## Navigation Commands

### Main Navigator

The main project list view shows:
- Project name with icon
- Project type (Node.js, Python, etc.)
- Relative path from workspace root
- Framework badges (if detected)
- Missing runtime warnings (⚠️)

### Pagination

- Uses `config.maxVisibleProjects` (default: 3)
- `PgUp` / `PgDn` jump full pages
- Page indicator shows: `--- Page X/Y (N projects) ---`

### Detail View

Press `Enter` on a project to see:
- Project name with icon
- Type and manifest file
- Relative path
- Description (if available)
- Framework badges
- Missing runtime warnings (if any)
- **Commands** section with all available commands
- Custom commands (if added)
- Framework-suggested commands

---

## Quick Actions

### Quick Action Bar (in Navigator)

When a project is selected, a quick action bar shows:
```
Quick: [B] Build · [T] Test · [R] Run · [I] Install · [0] AI
```

### Command Execution

- Press `B` / `b` → Runs `commands.build`
- Press `T` / `t` → Runs `commands.test`
- Press `R` / `r` → Runs `commands.run` (`Shift+R` opens port config)
- Press `I` / `i` → Runs `commands.install`

### AI Analysis (Detail View)

Press `0` in detail view to:
1. Switch to AI Horizon view
2. Auto-select the current project
3. Show AI provider/model info
4. Press `Enter` to run analysis

---

## View Toggles

### Orbit Task Manager (`Shift+T`)

**Features:**
- Background process management
- Live log streaming
- Task status colors (green=running, cyan=finished, red=failed, yellow=killed)
- Select tasks with `↑/↓`
- Kill tasks with `Shift+K`
- Rename tasks with `Shift+R`
- Mini log preview (last 5 lines)
- Task counter: `[N ACTIVE]`

### Package Registry (`Shift+P`)

**Features:**
- Native package manager detection (npm/yarn/pnpm/bun/uv/pip/cargo/etc.)
- Project switcher (internal: `S` key)
- Package listing with `A` (add) and `R` (remove)
- Python venv creation with `V` (Python projects only)
- Dependency listing from project metadata

### Project Architect (`Shift+N`)

**Features:**
- 7+ project templates
- Multi-step wizard: framework → path → name
- Command execution via Orbit

**Templates:**
1. Next.js (npm)
2. Next.js (Bun)
3. React (Vite/pnpm)
4. React (Vite/npm)
5. Vue (Vite)
6. Rust (Cargo)
7. Django (startproject)
8. Python (Basic)
9. Go (mod init)

### AI Horizon (`Shift+O` or `0`)

**Features:**
- Multi-step wizard: provider → model → token → analyze
- AI providers: OpenRouter, Gemini, Claude, Ollama
- Raw AI response display
- Editable suggestions (`E` to edit)
- Save to config (`S` to save)
- Reset auth (`R` to reset)

**Steps:**
1. Select AI provider (↑/↓, Enter)
2. Configure model (type, Enter)
3. Enter API token (type, Enter)
4. Press Enter to analyze
5. Review/edit suggestions
6. Save to config with `S`

### Omni-Studio (`Shift+A`)

**Features:**
- Runtime health check (8 languages checked)
- Version display for installed runtimes
- Status indicators (✓/✗)

---

## Task Management

### Task Object Structure

```javascript
{
  id: 'task-' + Date.now(),   // Unique task ID
  name: `${project.name} · ${commandLabel}`,  // Display name
  status: 'running' | 'finished' | 'failed' | 'killed',
  logs: ['line1', 'line2', ...],    // Log lines (capped at 500)
  project: 'Project Name'            // Source project name
}
```

### Task Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| `running` | green | Process is executing |
| `finished` | cyan | Process completed successfully |
| `failed` | red | Process exited with error |
| `killed` | yellow | Process was forcefully terminated |

### Log Management

- **Live Streaming**: Logs appear in real-time
- **Log Window**: Shows last 8 lines (OUTPUT_WINDOW_SIZE)
- **Scroll**: `Shift+↑/↓` to scroll through logs
- **Clear**: `Shift+X` clears active task logs
- **Export**: `Shift+E` exports to `compass-task-*.txt`

### Process Management

- **Kill**: `Shift+K` in Task Manager
  - Windows: `taskkill /pid <pid> /f /t`
  - Unix: `process.kill(-pid, 'SIGKILL')` (process group)
- **Kill All**: When quitting with `Shift+Q`
- **Detach**: `Shift+D` in Navigator (keeps running in background)

---

## Package Management

### Supported Package Managers

| Language | Package Manager | Add Command | Remove Command |
|----------|----------------|-------------|-----------------|
| Node.js | npm | `npm install <pkg>` | `npm uninstall <pkg>` |
| Node.js | yarn | `yarn add <pkg>` | `yarn remove <pkg>` |
| Node.js | pnpm | `pnpm add <pkg>` | `pnpm remove <pkg>` |
| Node.js | bun | `bun add <pkg>` | `bun remove <pkg>` |
| Python | pip | `pip install <pkg>` | `pip uninstall -y <pkg>` |
| Python | uv | `uv add <pkg>` | `uv remove <pkg>` |
| Python | poetry | `poetry add <pkg>` | `poetry remove <pkg>` |
| Python | pipenv | `pipenv install <pkg>` | `pipenv uninstall <pkg>` |
| Rust | cargo | `cargo add <pkg>` | `cargo remove <pkg>` |
| Go | go | `go get <pkg>` | (manual removal) |
| Java | maven | `mvn dependency:copy-dependencies` | (manual removal) |
| PHP | composer | `composer require <pkg>` | `composer remove <pkg>` |
| Ruby | bundler | `bundle add <pkg>` | `bundle remove <pkg>` |
| .NET | dotnet | `dotnet add package <pkg>` | `dotnet remove package <pkg>` |

### TUI Usage (Shift+P)

1. Press `Shift+P` to open Package Registry
2. Use `↑/↓` to select project (or `S` to switch)
3. Press `A` to add package
4. Type package name, press `Enter`
5. Press `R` to remove package
6. Type package name, press `Enter`
7. Press `Esc` or `Shift+P` to return

### CLI Usage

```bash
# Add package
project-compass --add-pkg "express" --dir /path/to/project

# Remove package
project-compass --remove-pkg "lodash" --dir /path/to/project
```

---

## Project Scaffolding

### Available Templates

| Template | Command | Description |
|----------|---------|-------------|
| `nextjs` | `npx create-next-app@latest <path>` | Next.js with npm |
| `nextjs-bun` | `bun create next-app <path>` | Next.js with Bun |
| `react-vite` | `pnpm create vite <path> --template react` | React with Vite (pnpm) |
| `react-vite-npm` | `npm create vite@latest <path> -- --template react` | React with Vite (npm) |
| `vue-vite` | `npm create vite@latest <path> -- --template vue` | Vue with Vite |
| `rust` | `cargo new <path>` | Rust Cargo binary |
| `django` | `django-admin startproject <name> <path>` | Django project |
| `python-basic` | `mkdir -p <path>` | Basic Python directory |
| `go` | `mkdir -p <path> && cd <path> && go mod init <name>` | Go module |

### TUI Usage (Shift+N)

1. Press `Shift+N` to open Project Architect
2. Use `↑/↓` to select template
3. Press `Enter` to confirm
4. Type target path (or accept default), press `Enter`
5. Type project name (or accept default), press `Enter`
6. Project will be scaffolded via Orbit

### CLI Usage

```bash
# Create Next.js project
project-compass --scaffold nextjs --name my-app --dir /path/to/output

# Create Python basic project
project-compass --scaffold python-basic --name my-script --dir /tmp
```

---

## AI Features

### AI Providers

| Provider | ID | Endpoint | API Key Required |
|----------|-----|----------|-----------------|
| **OpenRouter** | `openrouter` | `https://openrouter.ai/api/v1/chat/completions` | Yes |
| **Google Gemini** | `gemini` | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | Yes |
| **Anthropic Claude** | `claude` | `https://api.anthropic.com/v1/messages` | Yes |
| **Ollama (Local)** | `ollama` | `http://localhost:11434/api/generate` | No (local) |

### AI Analysis Flow

1. **Select Provider** (in TUI):
   - Press `Shift+O` or `0` (in detail view)
   - Use `↑/↓` to select provider
   - Press `Enter`

2. **Configure Model**:
   - Default: `deepseek/deepseek-r1`
   - Type model name
   - Press `Enter`

3. **Enter API Token**:
   - Type your API token
   - Press `Enter`
   - (Saved to config for future use)

4. **Run Analysis**:
   - Press `Enter` to analyze
   - AI receives project context:
     - Project name, type, path
     - Package manager
     - Detected frameworks
     - Available scripts
     - Dependencies (first 30)
     - README content (first 1500 chars)
     - Main file content (first 1500 chars)
     - Config file content (first 1500 chars)

5. **Review Suggestions**:
   - AI returns JSON with commands: build, run, install, test
   - Raw AI response displayed
   - Use `↑/↓` to select suggestion
   - Press `E` to edit command
   - Modify command, press `Enter` to confirm

6. **Save to Config**:
   - Press `S` to save suggestions
   - Commands added to `config.customCommands[project.path]`
   - Saved to `~/.project-compass/config.json`

### AI Command Structure

```javascript
// AI returns JSON like:
{
  "build": "npm run build",
  "run": "npm run dev",
  "install": "npm install",
  "test": "npm run test"
}

// Converted to:
[
  { key: 'build', label: 'Build', command: ['npm', 'run', 'build'], source: 'ai' },
  { key: 'run', label: 'Run', command: ['npm', 'run', 'dev'], source: 'ai' },
  { key: 'install', label: 'Install', command: ['npm', 'install'], source: 'ai' },
  { key: 'test', label: 'Test', command: ['npm', 'run', 'test'], source: 'ai' }
]
```

---

## Supported Languages

### Language Detection

| Language | Priority | Manifest Files | Binaries | Auto-Detected Package Manager |
|----------|----------|----------------|----------|-----------------------------|
| **Node.js** | 100 | `package.json` | `node`, `npm` | npm/yarn/pnpm/bun |
| **Python** | 95 | `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`, `manage.py` | `python3`, `python`, `uv` | uv/poetry/pipenv/pip |
| **Rust** | 90 | `Cargo.toml` | `cargo`, `rustc` | cargo |
| **Go** | 85 | `go.mod` | `go` | go |
| **Java** | 80 | `pom.xml`, `build.gradle`, `build.gradle.kts` | `java`, `mvn`, `gradle` | maven/gradle |
| **PHP** | 75 | `composer.json` | `php`, `composer` | composer |
| **Ruby** | 70 | `Gemfile` | `ruby`, `bundle` | bundler |
| **.NET** | 65 | `*.csproj`, `*.fsproj` | `dotnet` | dotnet |
| **Generic** | 10 | `Makefile`, `build.sh` | (varies) | (none) |

### Package Manager Detection

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
|-----------|------|----------|---------------|---------------|
| **Next.js** | 🧭 | 115 | install, dev, build, test, start | ✓ |
| **React** | ⚛️ | 112 | install, dev, build, test | ✓ |
| **Vue.js** | 🟩 | 111 | install, dev, build, test | ✓ |
| **NestJS** | 🛡️ | 110 | install, dev (start:dev), build, test | ✓ |
| **Nuxt** | 🟢 | 110 | install, dev, build, generate | ✓ |
| **Express** | 🚂 | 108 | install, start, dev | ✓ |
| **Svelte** | 🧡 | 109 | install, dev, build, test | ✓ |
| **Astro** | 🚀 | 108 | install, dev, build, preview | ✓ |
| **Fastify** | ⚡ | 107 | install, start, dev | ✓ |
| **Koa** | 🎋 | 106 | install, start | ✓ |
| **Vite** | ⚡ | 100 | install, dev, build, preview | ✓ |
| **Tailwind CSS** | 🎨 | 50 | init | ✓ |
| **Prisma** | ◮ | 50 | install, generate, studio | ✓ |
| **tRPC** | 🔌 | 45 | dev, build | ✓ |
| **GraphQL** | ◼️ | 48 | start, dev | ✓ |

### Python Frameworks (12+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|---------------|---------------|
| **FastAPI** | ⚡ | 112 | install, run (uvicorn), test | ✓ |
| **Flask** | 🌶️ | 111 | install, run, test | ✓ |
| **Django** | 🌿 | 110 | install, runserver, test, migrate | ✓ |
| **Sanic** | 🚀 | 106 | run, test | ✓ |
| **AioHTTP** | 🔄 | 105 | test | ✓ |
| **Tornado** | 🌪️ | 104 | run, test | ✓ |
| **Pytest** | ✅ | 50 | run, coverage | ✓ |
| **SQLAlchemy** | 🗄️ | 48 | test | ✓ |
| **Pandas** | 🐼 | 45 | test | ✓ |
| **PyTorch** | 🔥 | 45 | test | ✓ |
| **TensorFlow** | 🧠 | 45 | test | ✓ |

### Rust Frameworks (9+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|---------------|---------------|
| **Actix Web** | 🎭 | 110 | fetch, run, test, build | ✓ |
| **Axum** | 🗡️ | 108 | fetch, run, test | ✓ |
| **Rocket** | 🚀 | 105 | fetch, run, test | ✓ |
| **Warp** | 🌀 | 104 | run, test | ✓ |
| **Tokio** | ⚡ | 50 | run, test | ✓ |
| **Serde** | 🔄 | - | - | ✓ |
| **SQLx** | 🗄️ | - | - | ✓ |
| **Diesel** | 🛢️ | - | - | ✓ |
| **Tonic** | 🎵 | - | - | ✓ |
| **Tower** | 🏰 | - | - | ✓ |

### Go Frameworks (4+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|---------------|---------------|
| **Gin** | 🍸 | 110 | mod tidy, run, test, build | ✓ |
| **Fiber** | 🔥 | 109 | run, test | ✓ |
| **Echo** | 🔊 | 108 | run, test | ✓ |
| **Chi** | 🤝 | 105 | run, test | ✓ |

### Java Frameworks (3+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|---------------|---------------|
| **Spring Boot** | 🍃 | 115 | install, run, test, build | ✓ |
| **Quarkus** | ⚡ | 108 | dev, build, test | ✓ |
| **Micronaut** | 🚀 | 106 | run, test | ✓ |

### PHP Frameworks (3+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|---------------|---------------|
| **Laravel** | 🧡 | 110 | install, serve, test, migrate | ✓ |
| **Symfony** | 🎵 | 108 | install, server:start, test | ✓ |
| **CodeIgniter** | 🔥 | 104 | test | ✓ |

### Ruby Frameworks (2+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|---------------|---------------|
| **Ruby on Rails** | 🛤️ | 110 | install, server, test, migrate | ✓ |
| **Sinatra** | 🎷 | 105 | install, rackup | ✓ |

### .NET Frameworks (2+)

| Framework | Icon | Priority | Commands | Auto-Detected |
|-----------|------|----------|---------------|---------------|
| **ASP.NET Core** | 🔷 | 110 | restore, run, test, build | ✓ |
| **Blazor** | 🌀 | 105 | run, build | ✓ |

---

## Advanced Configuration

### Main Config File: `~/.project-compass/config.json`

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

| Option | Type | Default | Description | Example |
|--------|------|---------|-------------|---------|
| `customCommands` | Object | `{}` | Per-project custom commands | `{"path": [{"label": "test", "command": ["npm", "test"]}]}` |
| `showArtBoard` | Boolean | `true` | Show/hide the art board | `true` / `false` |
| `showHelpCards` | Boolean | `false` | Show/hide help cards | `true` / `false` |
| `showStructureGuide` | Boolean | `false` | Show/hide structure guide | `true` / `false` |
| `maxVisibleProjects` | Number | `3` | Projects per page in navigator | `5`, `10`, etc. |
| `aiProvider` | String | `"openrouter"` | AI provider ID | `"openrouter"`, `"gemini"`, `"claude"`, `"ollama"` |
| `aiModel` | String | `"deepseek/deepseek-r1"` | AI model to use | `"gpt-4"`, `"claude-3"`, etc. |
| `aiToken` | String | `""` | API token for AI provider | `"sk-..."` |
| `projectMeta` | Object | `{}` | Per-project metadata (ports, etc.) | `{"path": {"port": "7654"}}` |

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

**Features:**
- Automatically loaded during project detection
- Merged into project data (commands + frameworks)
- Applied BEFORE framework plugin detection
- Can override/add commands and frameworks

### Custom Framework Plugins: `~/.project-compass/plugins.json`

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
        "dev": { 
          "label": "Dev", 
          "command": ["my-cli", "dev"] 
        }
      }
    }
  ]
}
```

**Plugin Detection:**
- Uses `dependencyMatches()` (not file existence)
- Can boost project priority
- Commands merged into project
- Loaded once and cached

---

*Built for the modern developer.*  
