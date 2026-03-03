# 🧭 Project Compass

**Futuristic Project Navigator & Runner for the Modern Developer**

Project Compass is a high-performance, TUI (Terminal User Interface) workspace orchestrator built with Ink and React. It transforms your terminal into a command center for managing complex, multi-stack environments with a focus on speed, safety, and visual clarity.

## 🛠️ Installation

```bash
npm install -g project-compass
```

## 🔗 Links
- **NPM**: [npmjs.com/package/project-compass](https://www.npmjs.com/package/project-compass)
- **GitHub**: [github.com/CrimsonDevil333333/project-compass](https://github.com/CrimsonDevil333333/project-compass)

![Navigator View](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/navigator.jpg)

## 🌟 Premium Features

### 🌌 The Navigator (Main Interface)
- **Automatic Discovery**: Instantly identifies **Node.js, Python, Rust, Go, Java, PHP, Ruby, .NET, and Shell/Make**.
- **Paginated Control**: Optimized for massive workspaces. Jump through project pages with **Page Up / Page Down**.
- **Configurable UI**: Customize your view with `maxVisibleProjects` (set to 2 or 3 for tight terminals).

### 🤖 AI Horizon (`Shift+O` or `0`)
- **Agentic Intelligence**: Real-world integration with **OpenRouter, Gemini, Claude, and Ollama**.
- **DNA Mapping**: Automatically analyzes your project structure and **injects optimized BRIT commands** (Build, Run, Install, Test) into your config.
- **Persistent Auth**: Save your API tokens once; Compass handles the secure handshake thereafter.

### 🔌 Infrastructure Control (`Shift+R`)
- **Manual Port Mapping**: Directly assign specific ports to projects. Config is saved persistently to prevent conflicts.
- **Metadata Awareness**: AI Horizon uses your manual port settings to suggest smarter deployment scripts.

### 🛰️ Orbit Task Manager (`Shift+T`)
- **Background Orchestration**: Keep tasks running while you navigate.
- **Process Management**: Kill (`Shift+K`) or Rename (`Shift+R`) background tasks on the fly.

### 📦 Package Registry (`Shift+P`)
- **Context-Aware Management**: Automatically detects **npm, pnpm, yarn, bun, pip, cargo, composer, and dotnet**.

### 🏗️ Project Architect (`Shift+N`)
- **Rapid Scaffolding**: Create new projects from scratch using industry-standard templates.

## ⌨️ Command Reference

| Shortcut | Action |
| :--- | :--- |
| `↑ / ↓` | Move project focus |
| `PgUp / PgDn`| Jump full project page |
| `Enter` | Toggle project Detail View |
| `0` | Trigger **AI DNA Analysis** (Inside Details) |
| `B / T / R / I`| Macro: Build, Test, Run, Install |
| `Shift + R` | **Configure Port** (Inside Details) |
| `Shift + O` | **AI Horizon** Dashboard |
| `Shift + T` | **Orbit**: Task Manager |
| `Shift + P` | **Registry**: Package Manager |
| `Shift + Q` | **Quit** (with terminal clear) |

## ⚙️ Configuration

Edit `~/.project-compass/config.json` to customize:
- `maxVisibleProjects`: How many rows per page.
- `aiToken / aiModel`: Your intelligence credentials.

---
**Crafted with ❤️ by Satyaa & Clawdy**
