# 🧭 Project Compass

**Futuristic Project Navigator & Runner for the Modern Developer**

Project Compass is a high-performance, TUI (Terminal User Interface) workspace orchestrator built with Ink and React. It transforms your terminal into a command center for managing complex, multi-stack environments with a focus on speed, safety, and visual clarity.

---

## 🛠️ Installation

```bash
# Install globally via npm
npm install -g project-compass

# Or install from source
git clone https://github.com/CrimsonDevil333333/project-compass.git
cd project-compass
npm install
npm start
```

---

## 📸 Screenshot

![Project Compass Navigator](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/home.png)

---

## 🔗 Links

- **NPM Package**: [npmjs.com/package/project-compass](https://www.npmjs.com/package/project-compass)
- **GitHub Repository**: [github.com/CrimsonDevil333333/project-compass](https://github.com/CrimsonDevil333333/project-compass)
- **Bug Reports**: [github.com/CrimsonDevil333333/project-compass/issues](https://github.com/CrimsonDevil333333/project-compass/issues)

---

## 🌌 The Navigator (Main Interface)

### Features
- **Automatic Discovery**: Instantly identifies **Node.js, Python, Rust, Go, Java, PHP, Ruby, .NET** projects
- **Accurate Framework Detection**: No hallucinations - only detects frameworks with actual dependencies (fixed in v4.3.6)
- **Paginated Control**: Optimized for massive workspaces. View projects in clean, manageable pages with **Page Up / Page Down** support
- **Configurable UI**: Customize your view with `maxVisibleProjects` and toggleable Art Boards and Help Cards
- **Real-time Scanning**: Projects are detected automatically when you navigate to a directory

### Supported Languages & Detection
| Language | Manifest Files | Package Managers | Priority |
|----------|----------------|-------------------|----------|
| **Node.js** | `package.json` | npm, pnpm, yarn, bun | 100 |
| **Python** | `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`, `manage.py` | uv, poetry, pipenv, pip | 95 |
| **Rust** | `Cargo.toml` | cargo | 90 |
| **Go** | `go.mod` | go | 85 |
| **Java** | `pom.xml`, `build.gradle`, `build.gradle.kts` | maven, gradle | 80 |
| **PHP** | `composer.json` | composer | 75 |
| **Ruby** | `Gemfile` | bundler | 70 |
| **.NET** | `*.csproj`, `*.fsproj` | dotnet | 65 |

---

## 🛰️ Orbit Task Manager (`Shift+T`)

### Features
- **Background Orchestration**: Keep tasks running while you navigate
- **Process Management**: Kill (`Shift+K`) or Rename (`Shift+R`) background tasks on the fly
- **Live Log Streaming**: Real-time output with scroll support (`Shift+↑/↓`)
- **Log Management**: Clear logs (`Shift+X`) or export to file (`Shift+E`)
- **Multi-Task Support**: Run multiple commands simultaneously

![Orbit Task Manager](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/task_manager.png)

---

## 📦 Package Registry (`Shift+P`)

### Features
- **Native Logic**: Automatically uses your project's preferred package manager
  - Node.js: npm, pnpm, yarn, bun
  - Python: uv, poetry, pipenv, pip
  - Rust: cargo
  - Go: go
  - Java: maven, gradle
  - PHP: composer
  - Ruby: bundler
  - .NET: dotnet
- **Internal Switcher**: Quick-swap between detected projects directly inside the registry
- **Add/Remove Packages**: Interactive package management
- **Python Virtual Environments**: Create venv with `V` key

---

## 🏗️ Project Architect (`Shift+N`)

### Features
- **Modern Templates**: Scaffold high-performance projects with built-in support for:
  - **Next.js** (npm or Bun)
  - **React** (Vite with pnpm or npm)
  - **Vue** (Vite)
  - **Rust** (Cargo binary)
  - **Django** (startproject)
  - **Python** (Basic directory)
  - **Go** (mod init)

### CLI Alternative (Non-TUI)
```bash
project-compass --scaffold nextjs --name my-app --dir /path/to/output
project-compass --scaffold python-basic --name my-script --dir /tmp
```

---

## 🤖 AI Horizon (`Shift+O` or `0` in Detail View)

### Features
- **Agentic Intelligence**: Real-world integration with **OpenRouter, Gemini, Claude, and Ollama**
- **DNA Mapping**: Analyzes your project structure and **injects optimized BRIT commands** (Build, Run, Install, Test) into your config
- **Raw AI Output**: View actual AI responses before applying
- **Persistent Auth**: Save your API tokens once; Compass handles the secure handshake thereafter
- **Project-Specific Config**: Loads `compass.config.js` from project directories
- **Editable Suggestions**: Review and edit AI suggestions before saving (`E` to edit)
- **Manual Save**: Press `S` to save suggestions to config

### Supported AI Providers
| Provider | Endpoint | Configuration |
|----------|----------|----------------|
| **OpenRouter** | `https://openrouter.ai/api/v1/chat/completions` | Default provider |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | Requires API key |
| **Anthropic Claude** | `https://api.anthropic.com/v1/messages` | Requires API key |
| **Ollama (Local)** | `http://localhost:11434/api/generate` | Local installation required |

![AI Horizon](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/ai_mode.png)

---

## 🔌 Infrastructure Control (`Shift+R`)

### Features
- **Manual Port Mapping**: Directly assign specific ports to projects
- **Metadata Awareness**: AI Horizon uses your manual port settings to suggest smarter deployment scripts
- **Config Persistence**: Settings saved to `~/.project-compass/config.json`

---

## 🎨 Omni-Studio & Art Board

### Omni-Studio (`Shift+A`)
- **Runtime Health Check**: Scans for installed languages and versions
- **Environment Audit**: Quick overview of available build tools
- **CLI Alternative**: `project-compass --studio-check`

### Art Board (`Shift+B`)
- **Build Atlas**: Visual representation of your workspace
- **Toggle Visibility**: Saved to config (`showArtBoard`)

![Omni-Studio](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/languages_checker_omni_studio.png)

![Art Board](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/art_bar.png)

![Help & Structure](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/help_structure.png)

---

## ⌨️ Complete Command Reference

### Navigation (All Modes)
| Key | Action | Context |
|-----|--------|---------|
| `↑` / `↓` | Move project focus | Navigator |
| `PgUp` / `PgDn` | Jump full project page | Navigator |
| `Enter` | Toggle project Detail View / Switch back from sub-views | Navigator |
| `Esc` | **Global Back**: Return to Main Navigator from any view | Global |
| `?` | Toggle help overlay | Navigator |
| `Shift+Q` | **Quit** application (confirms if tasks are running) | Global |
| `Ctrl+C` | Interrupt running command | When process running |

### Quick Actions (Detail View Only)
| Key | Action | Description |
|-----|--------|-------------|
| `0` | **Quick AI Analysis** | Switches to AI Horizon for selected project |
| `B` | **Build** project | Runs build command |
| `T` | **Test** project | Runs test command |
| `R` | **Run** project | Runs run command |
| `I` | **Install** dependencies | Runs install command |
| `1-9` | **Run numbered commands** | Execute commands 1-9 from detail view |
| `Shift+1-9` (A-Z) | **Run commands 10+** | Execute commands 10+ (A=10, B=11, etc.) |

### View Toggles
| Key | Action | Description |
|-----|--------|-------------|
| `Shift+O` | **AI Horizon** Dashboard | Workspace intelligence & analysis |
| `Shift+T` | **Orbit Task Manager** | Manage background processes |
| `Shift+P` | **Package Registry** | Dependency management |
| `Shift+N` | **Project Architect** | Scaffold new projects |
| `Shift+A` | **Omni-Studio** | Environment & runtime health |

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
| `Shift+R` | **Rename** task | Task Manager |
| `Shift+D` | **Detach** from active task (runs in background) | Navigator |
| `Shift+X` | **Clear** active task output logs | Navigator |
| `Shift+E` | **Export** logs to a timestamped `.txt` file | Navigator |
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

---

## 💻 Complete CLI Reference (Non-TUI Mode)

### Basic Usage
```bash
# Show help
project-compass --help
project-compass -h

# Show version
project-compass --version
project-compass -v

# Launch TUI (default: navigator view)
project-compass
project-compass --dir /path/to/workspace
```

### Direct View Launch
```bash
# Launch directly into specific views
project-compass --studio          # Launch in Studio view
project-compass --ai               # Launch in AI Horizon view
project-compass --task             # Launch in Task Manager view
project-compass --tasks            # Alias for --task
```

### Project Detection (No TUI)
```bash
# List detected projects with details
project-compass --mode test
project-compass --dir /path/to/workspace --mode test

# List projects with full details
project-compass --list-projects
project-compass --list-projects --dir /path/to/workspace

# Get project info by index
project-compass --project-info 0 --dir /path/to/workspace

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
```

### Package Management (No TUI)
```bash
# Add packages to project
project-compass --add-pkg "express" --dir /path/to/node-project
project-compass --add-pkg "fastapi" --dir /path/to/python-project

# Remove packages from project
project-compass --remove-pkg "lodash" --dir /path/to/node-project
project-compass --remove-pkg "requests" --dir /path/to/python-project
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
project-compass --scaffold python-basic --name my-app --dir /path/to/output
project-compass --scaffold go --name my-app --dir /path/to/output
```

Available Templates:
- `nextjs` - Next.js with npm
- `nextjs-bun` - Next.js with Bun
- `react-vite` - React with Vite (pnpm)
- `react-vite-npm` - React with Vite (npm)
- `vue-vite` - Vue with Vite
- `rust` - Rust Cargo binary
- `django` - Django project
- `python-basic` - Basic Python directory
- `go` - Go module

### Environment Health Check (No TUI)
```bash
# Check installed runtimes
project-compass --studio-check

# Output example:
# ✓ Node.js: v24.15.0
# ✓ npm: 11.12.1
# ✓ Python: Python 3.13.5
# ✗ Rust (Cargo): not installed
# ✓ Go: go version go1.24.4 linux/arm64
```

### AI Analysis
```bash
# AI analysis requires interactive TUI mode for API configuration
project-compass --ai
project-compass --ai --dir /path/to/project

# Note: --ai-analyze flag shows message to use TUI mode
project-compass --ai-analyze  # Shows: "AI analysis requires interactive TUI mode"
```

---

## 🔧 Configuration

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
    "/path/to/project": { "port": "3000" }
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

### Project-Specific Config: `compass.config.js`

Create a `compass.config.js` in your project root:

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

This file is automatically loaded during project detection and merged into project data.

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

---

## 🏗️ Built-in Framework Intelligence

### Node.js Frameworks (40+ detected)
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **Next.js** | 🧭 | install, dev, build, test, start | ✓ |
| **React** | ⚛️ | install, dev, build, test | ✓ |
| **Vue.js** | 🟩 | install, dev, build, test | ✓ |
| **NestJS** | 🛡️ | install, dev (start:dev), build, test | ✓ |
| **Nuxt** | 🟢 | install, dev, build, generate | ✓ |
| **Express** | 🚂 | install, start, dev | ✓ |
| **Svelte** | 🧡 | install, dev, build, test | ✓ |
| **Astro** | 🚀 | install, dev, build, preview | ✓ |
| **Fastify** | ⚡ | install, start, dev | ✓ |
| **Koa** | 🎋 | install, start | ✓ |
| **Vite** | ⚡ | install, dev, build, preview | ✓ |
| **Tailwind CSS** | 🎨 | init | ✓ |
| **Prisma** | ◮ | install, generate, studio | ✓ |
| **tRPC** | 🔌 | dev, build | ✓ |
| **GraphQL** | ◼️ | start, dev | ✓ |

### Python Frameworks
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **FastAPI** | ⚡ | install, run (uvicorn), test | ✓ |
| **Flask** | 🌶️ | install, run, test | ✓ |
| **Django** | 🌿 | install, runserver, test, migrate | ✓ |
| **Sanic** | 🚀 | run, test | ✓ |
| **AioHTTP** | 🔄 | test | ✓ |
| **Tornado** | 🌪️ | run, test | ✓ |
| **Pytest** | ✅ | run, coverage | ✓ |
| **SQLAlchemy** | 🗄️ | test | ✓ |

### Rust Frameworks
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **Actix Web** | 🎭 | fetch, run, test, build | ✓ |
| **Axum** | 🗡️ | fetch, run, test | ✓ |
| **Rocket** | 🚀 | fetch, run, test | ✓ |
| **Warp** | 🌀 | run, test | ✓ |
| **Tokio** | ⚡ | run, test | ✓ |

### Go Frameworks
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **Gin** | 🍸 | mod tidy, run, test, build | ✓ |
| **Fiber** | 🔥 | run, test | ✓ |
| **Echo** | 🔊 | run, test | ✓ |
| **Chi** | 🤝 | run, test | ✓ |

### Java Frameworks
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **Spring Boot** | 🍃 | install, run, test, build | ✓ |
| **Quarkus** | ⚡ | dev, build, test | ✓ |
| **Micronaut** | 🚀 | run, test | ✓ |

### PHP Frameworks
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **Laravel** | 🧡 | install, serve, test, migrate | ✓ |
| **Symfony** | 🎵 | install, server:start, test | ✓ |
| **CodeIgniter** | 🔥 | test | ✓ |

### Ruby Frameworks
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **Ruby on Rails** | 🛤️ | install, server, test, migrate | ✓ |
| **Sinatra** | 🎷 | install, rackup | ✓ |

### .NET Frameworks
| Framework | Icon | Commands | Auto-Detected |
|-----------|------|----------|---------------|
| **ASP.NET Core** | 🔷 | restore, run, test, build | ✓ |
| **Blazor** | 🌀 | run, build | ✓ |

---

## 🎯 Recent Fixes (v4.3.6)

### 1. Framework Hallucination Bug FIXED
**Problem**: Projects without frameworks were showing random frameworks (e.g., simple Python project with `main.py` was detected as FastAPI).

**Root Cause**: Framework matchers in `frameworks.js` used file existence (`hasProjectFile`) instead of dependency matching.

**Fix Applied**:
- `fastapi` matcher: Removed `|| hasProjectFile(project.path, 'main.py')`
- `django` matcher: Removed `|| hasProjectFile(project.path, 'manage.py')`
- Java/.NET/Ruby frameworks: Now use `dependencyMatches()` instead of file checks

**Result**: Projects without explicit framework dependencies now correctly show `Frameworks: none`.

### 2. compass-config.js Integration
**Problem**: `compass-config.js` existed but was never integrated into project detection.

**Fix Applied**:
- Added import of `loadProjectConfig` in `projectDetection.js`
- Integrated into `discoverProjects()` function to load `compass.config.js` from project directories
- Project-specific commands and frameworks from `compass.config.js` are now merged into project data

### 3. AI Horizon Improvements
**Problem**: AI Horizon didn't properly show raw AI output and had poor JSON parsing.

**Fix Applied**:
- Added `rawAIResponse` state to store raw AI output
- Improved JSON parsing to handle markdown code blocks (```json ... ```)
- Raw AI response is now displayed in the UI during review step
- Better error messages showing partial AI response if JSON parsing fails

### 4. Node.js Detector Fixed
**Problem**: `node.js` detector was adding "Node.js" as a framework.

**Fix Applied**:
- Detector now only adds framework if it's not the generic "Node.js" type
- Projects using plain Node.js without frameworks now show `Frameworks: none`

### 5. Framework Deduplication
**Problem**: `applyFrameworkPlugins()` could add duplicate frameworks.

**Fix Applied**:
- Added check to avoid adding duplicate frameworks
- Now preserves detector-detected frameworks and merges with plugin-detected ones

---

## 🎯 Recent Fixes (v4.3.7)

### 1. Python Binary Detection Bug FIXED
**Problem**: `python.js` checked if ALL of `['python3', 'python', 'uv']` binaries existed, causing false "Runtime missing" warnings when only `python` or `python3` was available.

**Root Cause**: `binaries.filter(b => !checkBinary(b))` treats alternate Python binary names as separate requirements.

**Fix Applied**:
- Now checks if AT LEAST ONE Python runtime exists
- Only shows "Runtime missing" when no Python runtime is found

### 2. Removed Unused Store
**Problem**: `src/store/useProjectStore.js` existed but was never imported anywhere.

**Fix Applied**:
- Removed dead code file
- Updated all documentation

### 3. Pagination Default Values Fixed
**Problem**: Inconsistent defaults across the codebase.

**Fix Applied**:
- `Navigator.js`: Changed default from `2` to `3`
- `cli.js`: Changed fallback from `2` to `3`
- Now consistent with config default of `maxVisibleProjects: 3`

### 4. Added Screenshots to README
**Problem**: README had no images, and package wouldn't show screenshots on npmjs.com because of relative paths.

**Fix Applied**:
- Added 6 screenshots using raw GitHub URLs
- Navigator Home, Task Manager, AI Horizon, Omni-Studio, Art Board, Help Structure

---

## 🚀 Performance

- **Fast Scanning**: Uses `fast-glob` for high-speed project discovery
- **Non-Blocking**: Heavy operations (globbing, command execution) are offloaded from the main render loop
- **Smart Caching**: Framework plugins are cached after first load
- **Memory Efficient**: Log buffers capped at 500 lines per task

---

## 🔒 Security

- **No Arbitrary Execution**: Commands are only executed when explicitly requested by the user
- **Local Storage**: API tokens stored locally in `~/.project-compass/config.json`
- **Workspace Boundaries**: Project detection respects directory structure
- **Process Isolation**: Background tasks are managed via `execa` with proper cleanup

---

## 🎓 Examples

### Example 1: Navigate and Run
```bash
# Launch TUI
project-compass

# Use ↑/↓ to select project
# Press Enter to see details
# Press B/T/R/I to Build/Test/Run/Install
# Press 0 for AI analysis
```

### Example 2: Quick CLI Usage
```bash
# Detect projects
project-compass --list-projects --dir ~/workspace

# Run command
project-compass --run "npm install" --dir ~/workspace/my-project

# Add package
project-compass --add-pkg "express" --dir ~/workspace/my-project
```

### Example 3: JSON Output for Scripting
```bash
# Get project list as JSON
project-compass --list-projects --json --dir ~/workspace | jq '.[0].name'

# Get specific project info
project-compass --project-info 0 --json --dir ~/workspace
```

---

## 📦 NPM Scripts

```bash
# Start the TUI
npm start

# Run linting
npm run lint

# Test project detection
npm run test

# Run a command (uses --run flag)
npm run run -- "echo hello"
```

---

**Crafted with ❤️ by Satyaa & Clawdy (AI Agent)**
