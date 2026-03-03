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

## 🌌 The Navigator
![Navigator View](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/navigator.jpg)

### 🌟 Premium Features

### 🌌 The Navigator (Main Interface)
- **Automatic Discovery**: Instantly identifies **Node.js, Python, Rust, Go, Java, PHP, Ruby, .NET, and Shell/Make**.
- **Paginated Control**: Optimized for massive workspaces. View projects in clean, manageable pages with **Page Up / Page Down** support.
- **Configurable UI**: Customize your view with `maxVisibleProjects` and toggleable Art Boards and Help Cards.

### 🛰️ Orbit Task Manager (`Shift+T`)
![Task Manager](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/taskmanager.jpg)
- **Background Orchestration**: Keep tasks running while you navigate.
- **Process Management**: Kill (`Shift+K`) or Rename (`Shift+R`) background tasks on the fly.

### 📦 Package Registry (`Shift+P`)
![Package Registry](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/registry.jpg)
- **Native Logic**: Automatically uses your project's preferred package manager (**npm, pnpm, yarn, bun, pip, cargo, composer, dotnet**).
- **Internal Switcher**: Quick-swap between detected projects directly inside the registry.

### 🏗️ Project Architect (`Shift+N`)
![Project Architect](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/architect.jpg)
- **Modern Templates**: Scaffold high-performance projects with built-in support for **Bun, Next.js, Vite, Rust, and Django**.

### 🤖 AI Horizon (`Shift+O` or `0`)
- **Agentic Intelligence**: Real-world integration with **OpenRouter, Gemini, Claude, and Ollama**.
- **DNA Mapping**: Automatically analyzes your project structure and **injects optimized BRIT commands** (Build, Run, Install, Test) into your config.
- **Persistent Auth**: Save your API tokens once; Compass handles the secure handshake thereafter.

### 🔌 Infrastructure Control (`Shift+R`)
- **Manual Port Mapping**: Directly assign specific ports to projects. Config is saved persistently to prevent conflicts.
- **Metadata Awareness**: AI Horizon uses your manual port settings to suggest smarter deployment scripts.

### 🎨 Omni-Studio & Art Board
![Omni-Studio](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/studio.jpg)
![Art Board](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/artboard.jpg)

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
| `Shift + A` | **Studio**: Environment Health |
| `Shift + B` | Toggle **Art Board** visibility |
| `Shift + H` | Toggle **Help Cards** |
| `Shift + S` | Toggle **Structure Guide** |
| `Shift + Q` | **Quit** (with terminal clear) |

## ⚙️ Configuration

Edit `~/.project-compass/config.json` to customize:
- `maxVisibleProjects`: How many rows per page (default: 3).
- `aiToken / aiModel`: Your intelligence credentials.

---
**Crafted with ❤️ by Satyaa & Clawdy**
