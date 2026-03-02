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
- **Automatic Discovery**: Instantly identifies **Node.js (Next.js, React, Vue, NestJS, Angular, SvelteKit, Nuxt, Astro)**, **Python (Django, Flask, FastAPI)**, **Rust (Rocket, Actix)**, **Go**, **Java (Spring Boot)**, **.NET (ASP.NET Core)**, **PHP (Laravel)**, and **Ruby**.
- **Package Manager Intelligence**: Context-aware detection of `pnpm`, `bun`, `yarn`, and `npm`. No hardcoded commands—Compass uses your project's preferred tool.
- **Deep Detail View**: Press `Enter` to reveal project manifests, detected frameworks, and available scripts.
- **Custom Actions**: Save persistent, project-specific commands with `Shift+C` (e.g., `deploy|npm run deploy --prod`).
- **Macro Commands**: High-speed access to core workflows:
    - `B`: Build
    - `T`: Test
    - `R`: Run / Start
    - `I`: Install Dependencies (New!)
- **Live Output Panel**: Stream real-time logs from active processes with dedicated scrolling (`Shift+↑/↓`).

### 🛰️ Orbit Task Manager (`Shift+T`)
- **Background Orchestration**: Keep tasks running while you navigate the rest of your workspace.
- **Process Management**: Monitor status (Running, Finished, Failed, Killed) and forcefully terminate processes with `Shift+K`.
- **Task Identity**: Rename tasks on the fly with `Shift+R` to keep your workspace organized.
- **Cross-Platform Safety**: Automatically handles process signaling for both Unix (SIGKILL) and Windows (taskkill) to ensure clean exits.

![Task Manager](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/taskmanager.jpg)

### 📦 Package Registry (`Shift+P`)
- **Context-Aware Management**: Add or remove dependencies without leaving the app.
- **Internal Switcher**: Quick-swap projects within the registry view using `S`.
- **Multi-Runtime Support**: Handles `npm`, `pnpm`, `bun`, `pip`, and more based on project type.

![Package Registry](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/registry.jpg)

### 🏗️ Project Architect (`Shift+N`)
- **Rapid Scaffolding**: Create new projects from scratch using industry-standard templates:
    - **Next.js** (Standard & Bun variants)
    - **React/Vue** (Vite-powered with pnpm/npm support)
    - **Rust** (Cargo binary)
    - **Django** (Python web framework)
    - **Go** (Module initialization)
- **Interactive Prompts**: Safe, guided setup for directory structure and initial manifests.

![Project Architect](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/architect.jpg)

### 🎨 Omni-Studio & Art Board
- **Environment Health (`Shift+A`)**: Audit your system dependencies and runtime versions.
- **Build Atlas (`Shift+B`)**: A visual, art-coded representation of your project landscape.

![Omni-Studio](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/studio.jpg)
![Art Board](https://raw.githubusercontent.com/CrimsonDevil333333/project-compass/master/assets/screenshots/artboard.jpg)

## ⌨️ Command Reference

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
