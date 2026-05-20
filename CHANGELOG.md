# Changelog

All notable changes to Project Compass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.2.0] - 2026-05-20

### Added
- **Task Persistence Layer** (`src/core/TaskPersistence.js`): Every task's stdout/stderr is now tee'd to a dedicated log file at `~/.project-compass/tasks/<taskId>.log` in real-time. Task metadata (PID, status, command, project) is snaphotted to `~/.project-compass/tasks.json` after every state change.
- **Detach & Exit** (D/K/N Quit Modal): Pressing Shift+Q now shows a 3-way modal — `D` to detach all running processes (they keep running as background processes after TUI exit), `K` to kill all and exit, `N` to cancel.
- **Session Restore**: On TUI re-open, detached tasks from the previous session are rehydrated and shown in a dismissable banner. Tasks whose PID is still alive are marked `detached` (re-attachable). Tasks whose process ended while the TUI was away are marked `orphaned`.
- **Live Re-attach** (Shift+A in Task Manager): Re-attaches to a detached task — reads historical logs from the log file, then starts live-tailing the log file via a 100ms polling loop for real-time streaming. No daemon process required.
- **Shift+Z**: Dismiss the session restore banner without switching views.
- **Task Rename Persistence**: Renaming a task (Shift+R) now persists to `config.json` so the renamed label survives restarts.
- **`src/core/TaskPersistence.js`**: New module — `saveTasksManifest`, `loadTasksManifest`, `createTaskLogStream`, `readTaskLogs`, `tailTaskLog`, `pruneOldTaskLogs`, `deleteTaskLog`.
- **TASKS_DIR / TASKS_MANIFEST_PATH** exports in `configPaths.js`.

### Changed
- **Shift+D** now properly marks a task as `detached` (the process keeps running) instead of just hiding it from the active task slot.
- **Task Manager** fully rewritten: shows duration, project name, PID, detached/orphaned/restored badges, status icons and color coding, scrollable window, last-log preview for active task.
- **Output panel** shows `DETACHED` / `ORPHANED` badges and appropriate hints.
- **Status normalization**: All task statuses are now `running`, `success`, `failed`, `detached`, `orphaned`, `killed` (no more ambiguous `finished`).
- **Orbit tile** in the art board now shows detached task count when nothing is actively running.

### Fixed
- `logOffset` was not reset when switching between tasks — now resets to 0 on every `setActiveTaskId` call.
- `Shift+T` (Task Manager) no longer causes a `console.clear()` flash.
- `Shift+L` (rerun last command) no longer stacks gimmicky error tasks — errors are auto-dismissed after 4s.
- Task renames now persist across sessions via `config.taskRenames`.
- `Shift+D` was previously just `setActiveTaskId(null)` leaving the task invisible but still `running` in the list.
- ANSI escape codes are stripped before storing log lines in memory (log files receive clean text).
- Port config and custom command input modes now show inline banners in the navigator instead of being invisible.

## [5.1.0] - 2026-05-20

### Fixed
- **Systemd Service Generalization**: Removed hardcoded local service file and refactored generation logic to be system-agnostic.
- **Service Installation Options**: Added support and documentation for both System-wide and User-level systemd services.
- **Gitignore Hygiene**: Added `project-compass.service` to `.gitignore` to prevent accidental commits of local configurations.

## [5.0.0] - 2026-05-20

### Added
- **Neural Convergence Architecture**: Single-Brain core (`Orchestrator`) powering CLI, TUI, and Web.
- **Synchronized Web Dashboard**: Real-time web interface with 1:1 parity with the TUI.
- **Zero-Mock Scaffolding**: Real-world project creation for Next.js, Rust, Django, and more.
- **Omni-Updater**: Self-updating capability via `project-compass --update`.
- **High-Fidelity AI DNA**: Manifest-driven project analysis with deep context awareness.
- **Unified Audit Engine**: Shared diagnostic logic for CLI `--studio` and Web Studio view.

### Changed
- **Unified Task Engine**: All processes across all interfaces are now tracked in a single, trusted task pool.
- **Deterministic Identity**: Projects are now tracked via stable, path-based IDs for reliable cross-interface state.
- **Production-Build Server**: The web server now serves a compiled production bundle for maximum performance.

## [4.5.0] - 2026-05-20


### Added
- **Agentic AI Horizon**: State-of-the-art AI integration with Context Chat and Error Analysis.
- **Dynamic Search/Filter**: Press `/` in the Navigator to filter projects by name or type in real-time.
- **Animated Splash Screen**: Premium high-fidelity startup experience with ASCII branding.
- **Deep Scan Mode**: Use `--deep` flag for unlimited discovery depth in massive workspaces.
- **Git Visibility**: Real-time branch and status indicators integrated into the Navigator rows.
- **Orbit Cleanup**: Robust SIGINT/SIGTERM handlers to ensure all background processes are terminated on exit.
- **Verification Suite**: `test_projects/` directory with 7 language samples for engine validation.

### Changed
- **Enhanced Header UI**: New structured layout with borders and high-visibility status indicators.
- **Navigator Aesthetics**: Rounded borders and improved typography for a "production-grade" look.
- **CLI Help Revamp**: Professional, high-fidelity help documentation.
- **Detection Depth**: Increased default discovery depth to 7 for better out-of-the-box coverage.

### Fixed
- **Duplicate State Declarations**: Fixed syntax errors in `cli.js` that caused TUI boot failures.
- **Reference Errors**: Fixed `getGitInfo` reference error in the detection orchestrator.
- **Boundary Guards**: Fixed pagination and selection logic to respect filtered search results.

## [4.3.8] - 2026-05-10

### Added
- Initial v4.3 features including Framework Plugins and TUI core.
- Multi-language detection for 8 core languages.
- Orbit Task Manager for background process orchestration.
