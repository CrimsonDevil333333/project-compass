# Project Compass · Commands & Shortcuts

This document lists all supported languages, frameworks, and their built-in commands and keyboard shortcuts.

## Keyboard Guide (Navigator)

| Key | Action |
| --- | --- |
| ↑ / ↓ | Move project focus |
| Enter | Toggle detail view for selected project / Switch back from Tasks |
| **Shift+A** | Open **Omni-Studio** (Environment intelligence) |
| **Shift+T** | Open **Orbit Task Manager** |
| **Shift+D** | **Detach** from active task (runs in background) |
| **Shift+B** | Toggle **Art Board** visibility (Saved to config) |
| **Shift+H** | Toggle **Help Cards** visibility (Saved to config) |
| **Shift+S** | Toggle **Structure Guide** visibility (Saved to config) |
| **Shift+X** | **Clear** active task output logs |
| **Shift+E** | **Export** logs to a timestamped `.txt` file |
| **Shift+L** | **Rerun** the last executed command |
| **Shift+C** | Add a **Custom Command** (`label|cmd`) in detail view |
| **Shift+Q** | **Quit** application (Confirms if tasks are running) |
| Shift+↑ / ↓ | Scroll output logs (Intuitive direction) |
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

When a framework is detected, specialized commands are injected automatically:

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

## Task Manager Shortcuts (Shift+T)

- **Shift+K**: Kill a running process or remove a finished task from history.
- **Shift+R**: Rename a task for better organization.
- **Arrows**: Move focus between tasks.
- **Enter**: Jump to the selected task's logs in Navigator.
