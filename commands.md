# Project Compass · Commands & Shortcuts

This document lists all supported languages, frameworks, and their built-in commands and keyboard shortcuts.

## Keyboard Guide (Navigator)

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move project focus |
| Enter | Toggle deep detail view / Switch back from sub-views |
| **Esc** | **Global Back**: Return to Main Navigator from any view |
| **Shift+A** | Open **Omni-Studio** (Environment & Runtime audit) |
| **Shift+T** | Open **Orbit Task Manager** (Manage background processes) |
| **Shift+P** | Open **Package Registry** (Manage dependencies) |
| **Shift+N** | Open **Project Architect** (Scaffold new projects) |
| **Shift+D** | **Detach** from active task (runs in background) |
| **Shift+B** | Toggle **Art Board** Build Atlas (Saved to config) |
| **Shift+H** | Toggle **Help Cards** UI (Saved to config) |
| **Shift+S** | Toggle **Structure Guide** (Saved to config) |
| **Shift+X** | **Clear** active task output logs |
| **Shift+E** | **Export** logs to a timestamped `.txt` file |
| **Shift+L** | **Rerun** the last executed command |
| **Shift+C** | Add a **Custom Command** (`label|cmd`) in detail view |
| **Shift+Q** | **Quit** application (Confirms if tasks are running) |
| Shift+↑ / ↓ | Scroll output logs |
| ? | Toggle help overlay |
| Ctrl+C | Interrupt running command |

## Supported Languages & Runtimes

Compass scans for the following manifests and requires their binaries in your PATH:

- **Node.js** (`node`, `npm`): `package.json`
- **Python** (`python3`, `pip`): `pyproject.toml`, `requirements.txt`, `Pipfile`, `setup.py`
- **Rust** (`cargo`): `Cargo.toml`
- **Go** (`go`): `go.mod`
- **Java/Kotlin** (`java`, `mvn`, `gradle`): `pom.xml`, `build.gradle`
- **Scala** (`sbt`): `build.sbt`
- **PHP** (`php`, `composer`): `composer.json`
- **Ruby** (`ruby`, `bundle`): `Gemfile`
- **.NET** (`dotnet`): `*.csproj`
- **Shell** (`sh`, `make`): `Makefile`, `build.sh`

## Built-in Framework Intelligence

| Framework | Icon | Commands |
| --- | --- | --- |
| **Next.js** | 🧭 | install, dev, build, test, start |
| **React** | ⚛️ | install, dev, build, test |
| **Vue.js** | 🟩 | install, dev, build, test |
| **NestJS** | 🛡️ | install, dev (start:dev), build, test |
| **Angular** | 🅰️ | install, serve, build, test |
| **SvelteKit** | 🌀 | install, dev, build, test, preview |
| **Nuxt** | 🪄 | install, dev, build, start |
| **Astro** | ✨ | install, dev, build, preview |
| **Django** | 🌿 | pip install, runserver, test, migrate |
| **Flask** | 🍶 | pip install, run, pytest |
| **FastAPI** | ⚡ | pip install, uvicorn reload, pytest |
| **Vite** | ⚡ | install, dev, build, preview |
| **Spring Boot** | 🌱 | bootRun (Gradle) / spring-boot:run (Maven), build, test |
| **ASP.NET Core**| 🌐 | restore, run, watch, test |
| **Laravel** | 🧡 | composer install, artisan serve, test, migrate |
| **Rocket** | 🚀 | cargo fetch, run, test |
| **Actix Web** | 🦀 | cargo fetch, run, test |
| **Prisma** | ◮ | install, generate, studio |
| **Tailwind** | 🎨 | install |

## Orbit Task Manager Shortcuts (Shift+T)

- **Shift+K**: Kill a running process or remove a finished task.
- **Shift+R**: Rename a task for better organization.
- **Arrows**: Move focus between tasks.
- **Enter / Shift+T**: Return to Navigator.

## Package Registry Shortcuts (Shift+P)

- **A**: Add a new package to the project.
- **R**: Remove an existing package.
- **S**: **Internal Switcher**: Quick-swap between detected projects.
- **Esc / Shift+P**: Return to Navigator.

## Project Architect Shortcuts (Shift+N)

- **↑ / ↓**: Select a project template (Next.js, Vite, Rust, Go, etc.).
- **Enter**: Confirm selection and move to next step.
- **Esc / Shift+N**: Exit architect mode.
