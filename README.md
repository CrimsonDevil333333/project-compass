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
- **Paginated Control**: Optimized for massive workspaces. View projects in clean, manageable pages with **Page Up / Page Down** support.
- **Configurable UI**: Customize your view with `maxVisibleProjects` and toggleable Art Boards and Help Cards.

### 📦 Package Registry (`Shift+P`)
- **Native Logic**: Automatically uses your project's preferred package manager (**npm, pnpm, yarn, bun, pip, cargo, composer, dotnet**). No more "command not found" errors.
- **Internal Switcher**: Quick-swap between detected projects directly inside the registry.

### 🏗️ Project Architect (`Shift+N`)
- **Modern Templates**: Scaffold high-performance projects with built-in support for **Bun, Next.js, Vite, Rust, and Django**.

### 🔌 Manual Infrastructure\n- **Port Mapping**: Hit `Shift + R` in details to manually assign ports to projects. Settings are saved persistently.\n\n### 🤖 AI Horizon (`Shift+O` or `0`)
- **Intelligence Persistence**: Configure your provider (**OpenRouter, Gemini, Claude, Ollama**) once; Compass remembers your settings.
- **Deep DNA Analysis**: Press `0` on any project to analyze its structure.
- **Auto-Config (BRIT)**: AI automatically detects and configures missing **Build, Run, Install, and Test** commands, saving them directly to your `config.json`.
- **Direct Access**: Launch straight into intelligence mode with `project-compass --ai`.

## Command Reference

| Shortcut | Action |
| :--- | :--- |
| `↑ / ↓` | Move project focus |
| `Enter` | Toggle project Detail View |
| `B / T / R / I`| Macro: Build, Test, Run, **Install** |
| `Shift + T` | **Orbit**: Task Manager |
| `Shift + P` | **Registry**: Package Manager |
| `Shift + N` | **Architect**: Project Creator |
| `Shift + A` | **Studio**: Environment Health |
| `Shift + B` | Toggle **Art Board** visibility |
| `Shift + H` | Toggle **Help Cards** |
| `Shift + S` | Toggle **Structure Guide** |
| `Shift + Q` | Quit (with safe-exit confirmation) |
| `?` | Toggle Help Overlay |

### 🛡️ Safe Termination
- **Process Protection**: Compass won't let you accidentally kill your work. If tasks are running, a dedicated confirmation dialog ensures you intended to quit.

![Exit Confirmation](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/exit-confirm.jpg)

## ⚙️ Configuration & Customization

Project Compass is designed to be personalized. All settings and custom commands are stored in a local JSON file.

- **Linux/macOS**: `~/.project-compass/config.json`
- **Windows**: `C:\Users\<YourUser>\.project-compass\config.json`

### 🛠️ Adding Custom Commands
You can add your own project-specific commands directly within the app by pressing **Shift+C** in the Detail View. Use the format `Label|Command` (e.g., `Deploy|npm run deploy`).

### 📁 Manual Config Structure
If you prefer manual editing, the `config.json` follows this structure:

```json
{
  "showArtBoard": true,
  "showHelpCards": false,
  "showStructureGuide": false,
  "customCommands": {
    "/path/to/your/project": [
      {
        "label": "Build Production",
        "command": ["npm", "run", "build", "--prod"]
      }
    ]
  }
}
```

- `showArtBoard/HelpCards/Structure`: Persistence for your UI visibility preferences.
- `customCommands`: A map of absolute project paths to arrays of command objects.

---

## 🚀 Vision
Project Compass is designed to be the "Last Terminal Tool" you ever need to open. It bridges the gap between raw CLI commands and full IDEs, giving you a professional, reactive cockpit for all your development work.

---
**Crafted with ❤️ by Satyaa & Clawdy**
*MIT License*
