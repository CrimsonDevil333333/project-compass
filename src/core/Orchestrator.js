/**
 * Orchestrator.js — The Brain of Project Compass
 * 
 * Manages project scanning, task execution, persistence, and IPC.
 * 
 * v5.2.0: Full task persistence via log-file tee strategy.
 *   - Every task's stdout/stderr is streamed to ~/.project-compass/tasks/<id>.log
 *   - Task metadata is snapshotted to tasks.json after every state change
 *   - Detached tasks survive TUI exit; re-attach via historical read + fs.watch tail
 *   - On startup: rehydrates persisted tasks, checks PID liveness
 */

import { EventEmitter } from 'events';
import path from 'path';
import { execa } from 'execa';
import { discoverProjects } from '../projectDetection.js';
import { loadConfig } from '../configPaths.js';
import {
  saveTasksManifest,
  loadTasksManifest,
  createTaskLogStream,
  readTaskLogs,
  tailTaskLog,
  pruneOldTaskLogs,
  deleteTaskLog,
} from './TaskPersistence.js';

// Strip ANSI escape codes from log lines before storing
const ANSI_REGEX = /\x1B\[[0-9;]*[mGKHFJhBiAsu]/g;
function stripAnsi(str) {
  return typeof str === 'string' ? str.replace(ANSI_REGEX, '') : str;
}

class Orchestrator extends EventEmitter {
  constructor() {
    super();
    this.projects = [];
    this.tasks = new Map();          // taskId → task object (in-memory)
    this.processMap = new Map();     // taskId → execa process
    this.logStreamMap = new Map();   // taskId → fs.WriteStream
    this.tailCleanupMap = new Map(); // taskId → cleanup fn (for re-attach tailing)
    this.rootPath = process.cwd();
    this.config = {};
    this.scanning = false;

    // Rehydrate persisted tasks on startup (non-blocking)
    this._rehydrateOnStartup();
  }

  // ─────────────────────────────────────────────────────────────
  // Startup: Rehydrate persisted tasks from previous sessions
  // ─────────────────────────────────────────────────────────────
  _rehydrateOnStartup() {
    try {
      pruneOldTaskLogs();
      const persisted = loadTasksManifest();
      if (!persisted.length) return;

      for (const t of persisted) {
        // Only rehydrate detached or orphaned tasks — finished/failed are irrelevant
        if (t.status !== 'detached' && t.status !== 'orphaned' && t.status !== 'running') continue;

        // Read historical logs
        const historicalLogs = readTaskLogs(t.logPath);

        const rehydrated = {
          ...t,
          logs: historicalLogs,
          rehydrated: true,
          // Process handle is gone — we can't write stdin
          process: null,
        };

        this.tasks.set(t.id, rehydrated);
        this.emit('task_rehydrated', rehydrated);
      }

      if (persisted.some(t => t.status === 'detached' || t.status === 'orphaned')) {
        this.emit('session_restore', persisted.filter(
          t => t.status === 'detached' || t.status === 'orphaned'
        ));
      }
    } catch (err) {
      // Non-fatal
      process.stderr.write(`[Orchestrator] rehydrate failed: ${err.message}\n`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Persist current task state to tasks.json
  // ─────────────────────────────────────────────────────────────
  _persistTasks() {
    const tasks = Array.from(this.tasks.values());
    saveTasksManifest(tasks);
  }

  // ─────────────────────────────────────────────────────────────
  // Project scanning
  // ─────────────────────────────────────────────────────────────
  async scan(rootPath = this.rootPath, depth = 7) {
    this.scanning = true;
    this.emit('scan_start', { rootPath, depth });
    try {
      this.rootPath = rootPath;
      this.projects = await discoverProjects(rootPath, depth);
      this.emit('scan_complete', this.projects);
      return this.projects;
    } catch (error) {
      this.emit('scan_error', error.message);
      throw error;
    } finally {
      this.scanning = false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Run a command as a tracked task
  // ─────────────────────────────────────────────────────────────
  runCommand(projectId, commandId, customCmd = null) {
    let project = this.projects.find(p => p.id === projectId);

    // Support for system-wide commands (scaffolding, global tools)
    if (!project && projectId === 'system') {
      project = { id: 'system', name: 'System', path: this.rootPath };
    }

    if (!project) throw new Error('Project not found');

    const cmdSpec = customCmd || (commandId ? project.commands?.[commandId] : null);
    if (!cmdSpec) throw new Error('Command not found');

    let finalCommand = [...cmdSpec.command];

    // --- Smart Port Application ---
    const port = project.metadata?.port;
    if (port) {
      let cmdStr = finalCommand.join(' ').toLowerCase();
      const portStr = String(port);
      let portApplied = false;

      const patterns = [
        { match: 'uvicorn', flag: '--port' },
        { match: 'gunicorn', flag: '--bind' },
        { match: 'gunicorn', flag: '-b' },
        { match: 'hypercorn', flag: '-b' },
        { match: 'next dev', flag: '-p' },
        { match: 'vite', flag: '--port' },
        { match: 'flask', flag: '--port' },
        { match: 'webpack', flag: '--port' },
        { match: 'serve', flag: '-l' },
        { match: 'django', flag: '--port' },
        { match: 'react-scripts start', flag: '--port' }
      ];

      for (const { match, flag } of patterns) {
        if (cmdStr.includes(match.toLowerCase())) {
          const flagIdx = finalCommand.indexOf(flag);
          if (flagIdx !== -1 && flagIdx + 1 < finalCommand.length) {
            finalCommand[flagIdx + 1] = portStr;
            portApplied = true;
          } else if (flagIdx === -1) {
            finalCommand.push(flag, portStr);
            portApplied = true;
          }
          break;
        }
      }

      if (!portApplied && (cmdStr.includes('runserver') || cmdStr.includes('manage.py'))) {
        if (!finalCommand.some(t => /^\d{4,5}$/.test(t))) {
          finalCommand.push(portStr);
        }
      }
    }

    const [binary, ...args] = finalCommand;
    const taskId = `${projectId}::${commandId || 'custom'}::${Date.now()}`;

    // Create log stream for this task
    const { stream: logStream, logPath } = createTaskLogStream(taskId);
    this.logStreamMap.set(taskId, logStream);

    const proc = execa(binary, args, {
      cwd: project.path,
      all: true,
      detached: false, // We'll flip to detached mode when user detaches
      env: { ...process.env, FORCE_COLOR: 'true' },
    });

    // Prevent unhandled promise rejections
    proc.catch(() => {});

    const task = {
      id: taskId,
      projectId,
      projectName: project.name,
      commandId,
      name: cmdSpec.label,
      label: cmdSpec.label,
      command: finalCommand,
      status: 'running',
      pid: proc.pid || null,
      logPath,
      startTime: Date.now(),
      endTime: null,
      detachedAt: null,
      output: '',
      logs: [],
      rehydrated: false,
      process: proc,
    };

    this.tasks.set(taskId, task);
    this.processMap.set(taskId, proc);
    this._persistTasks();
    this.emit('task_start', task);

    proc.all.on('data', (data) => {
      const chunk = data.toString();
      task.output += chunk;

      const newLines = chunk.split(/\r?\n/).filter(l => l.length > 0);
      const stripped = newLines.map(stripAnsi);
      task.logs.push(...stripped);
      if (task.logs.length > 1000) task.logs = task.logs.slice(-1000);

      // Write raw (with ANSI) to log file for full fidelity
      try { logStream.write(stripped.map(l => l + '\n').join('')); } catch { /* ignore */ }

      this.emit('task_output', { taskId, chunk, logs: [...task.logs] });
    });

    proc.on('close', (code) => {
      task.status = code === 0 ? 'success' : 'failed';
      task.endTime = Date.now();
      this.processMap.delete(taskId);
      // Close log stream
      try { logStream.end(); } catch { /* ignore */ }
      this.logStreamMap.delete(taskId);
      this._persistTasks();
      this.emit('task_end', task);
    });

    proc.on('error', (err) => {
      task.status = 'failed';
      task.error = err.message;
      const errorMsg = `✗ Execution Error: ${err.message}`;
      task.logs.push(errorMsg);
      try { logStream.write(errorMsg + '\n'); logStream.end(); } catch { /* ignore */ }
      this.logStreamMap.delete(taskId);
      this.processMap.delete(taskId);
      this._persistTasks();
      this.emit('task_error', { taskId, error: err.message });
      this.emit('task_end', task);
    });

    return taskId;
  }

  // ─────────────────────────────────────────────────────────────
  // Detach: keep process alive, TUI stops streaming
  // ─────────────────────────────────────────────────────────────
  detachTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === 'running') {
      task.status = 'detached';
      task.detachedAt = Date.now();
      // NOTE: We do NOT kill the process — it keeps running.
      // The log stream continues to write to the log file.
      // We just stop emitting task_output events for UI updates.
      this._persistTasks();
      this.emit('task_detached', task);
    }
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // Detach All: mark all running tasks as detached, don't kill
  // Called when user chooses "Detach All & Exit" from quit modal
  // ─────────────────────────────────────────────────────────────
  detachAllTasks() {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'running') {
        task.status = 'detached';
        task.detachedAt = Date.now();
        // Unref the process so it won't block Node exit
        const proc = this.processMap.get(taskId);
        if (proc && proc.pid) {
          try { proc.unref(); } catch { /* ignore */ }
        }
        // Unref the log stream too
        const ls = this.logStreamMap.get(taskId);
        if (ls) {
          try { ls.uncork && ls.uncork(); } catch { /* ignore */ }
        }
      }
    }
    this._persistTasks();
  }

  // ─────────────────────────────────────────────────────────────
  // Re-attach: load historical logs + start tailing log file
  // Returns { logs: string[], stopTail: fn }
  // ─────────────────────────────────────────────────────────────
  reattachTask(taskId, onNewLine) {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    // Read historical logs from log file
    const historicalLogs = readTaskLogs(task.logPath);

    // Update in-memory logs with full history
    task.logs = historicalLogs;

    // Determine if process is still alive
    let pidAlive = false;
    if (task.pid) {
      try { process.kill(task.pid, 0); pidAlive = true; } catch { pidAlive = false; }
    }

    // If status was detached and PID is alive, update status back to running
    if (task.status === 'detached' && pidAlive) {
      task.status = 'running';
      this.emit('task_reattached', task);
    } else if (!pidAlive && (task.status === 'detached' || task.status === 'running')) {
      task.status = 'orphaned';
      this._persistTasks();
    }

    // Stop any existing tail for this task
    const existingCleanup = this.tailCleanupMap.get(taskId);
    if (existingCleanup) { try { existingCleanup(); } catch { /* ignore */ } }

    // Start tailing if log file exists and process alive
    let stopTail = () => {};
    if (task.logPath && pidAlive && onNewLine) {
      stopTail = tailTaskLog(task.logPath, (line) => {
        task.logs.push(line);
        if (task.logs.length > 1000) task.logs = task.logs.slice(-1000);
        onNewLine({ taskId, line, logs: [...task.logs] });
      });
      this.tailCleanupMap.set(taskId, stopTail);
    }

    return {
      logs: historicalLogs,
      pidAlive,
      stopTail,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Stop tailing a task (when user detaches view again)
  // ─────────────────────────────────────────────────────────────
  stopTailingTask(taskId) {
    const cleanup = this.tailCleanupMap.get(taskId);
    if (cleanup) {
      try { cleanup(); } catch { /* ignore */ }
      this.tailCleanupMap.delete(taskId);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Kill a task (SIGKILL)
  // ─────────────────────────────────────────────────────────────
  killTask(taskId) {
    const task = this.tasks.get(taskId);
    const proc = this.processMap.get(taskId);

    if (proc && proc.pid) {
      try {
        if (process.platform === 'win32') {
          execa('taskkill', ['/pid', proc.pid, '/f', '/t']);
        } else {
          process.kill(-proc.pid, 'SIGKILL');
        }
      } catch {
        try { proc.kill('SIGKILL'); } catch { /* ignore */ }
      }
    } else if (task?.pid && (task.status === 'detached' || task.status === 'orphaned')) {
      // Try to kill a detached process by stored PID
      try { process.kill(task.pid, 'SIGKILL'); } catch { /* ignore */ }
    }

    if (task) {
      task.status = 'killed';
      task.endTime = Date.now();
      this._persistTasks();
      this.emit('task_end', task);
    }

    // Cleanup
    this.processMap.delete(taskId);
    this.stopTailingTask(taskId);
    const ls = this.logStreamMap.get(taskId);
    if (ls) { try { ls.end(); } catch { /* ignore */ } this.logStreamMap.delete(taskId); }

    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // Kill all running tasks (for clean exit)
  // ─────────────────────────────────────────────────────────────
  killAllTasks() {
    for (const taskId of this.processMap.keys()) {
      this.killTask(taskId);
    }
    // Also try to kill any detached tasks by PID
    for (const [taskId, task] of this.tasks) {
      if ((task.status === 'detached') && task.pid) {
        try { process.kill(task.pid, 'SIGKILL'); } catch { /* ignore */ }
        task.status = 'killed';
      }
    }
    this._persistTasks();
  }

  // ─────────────────────────────────────────────────────────────
  // Rename a task
  // ─────────────────────────────────────────────────────────────
  renameTask(taskId, newName) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.name = newName;
      task.label = newName;
      this._persistTasks();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Remove a finished/failed/killed task from memory + disk
  // ─────────────────────────────────────────────────────────────
  removeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task?.logPath) deleteTaskLog(task.logPath);
    this.tasks.delete(taskId);
    this.stopTailingTask(taskId);
    this._persistTasks();
  }

  // ─────────────────────────────────────────────────────────────
  // Advanced workspace features
  // ─────────────────────────────────────────────────────────────
  getGroups() {
    const groups = new Set(['All']);
    this.projects.forEach(p => {
      if (p.metadata?.group) groups.add(p.metadata.group);
    });
    return Array.from(groups);
  }

  setProjectGroup(projectId, group) {
    const project = this.getProject(projectId);
    if (project) {
      project.metadata = { ...project.metadata, group };
      this.emit('project_updated', project);
    }
  }

  runOmniCommand(commandId, filter = null) {
    const results = [];
    this.projects.forEach(project => {
      if (!filter || filter(project)) {
        if (project.commands?.[commandId]) {
          const taskId = this.runCommand(project.id, commandId);
          results.push({ projectId: project.id, taskId });
        }
      }
    });
    return results;
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  getProject(projectId) {
    return this.projects.find(p => p.id === projectId);
  }

  async scaffold(template, name, targetParentPath) {
    const targetPath = path.resolve(targetParentPath || this.rootPath, name);
    const scaffoldCmds = {
      'nextjs': ['npx', 'create-next-app@latest', targetPath, '--typescript', '--tailwind', '--eslint'],
      'nextjs-bun': ['bun', 'create', 'next-app', targetPath],
      'react-vite': ['pnpm', 'create', 'vite', targetPath, '--template', 'react'],
      'react-vite-npm': ['npm', 'create', 'vite@latest', targetPath, '--', '--template', 'react'],
      'vue-vite': ['npm', 'create', 'vite@latest', targetPath, '--', '--template', 'vue'],
      'rust': ['cargo', 'new', targetPath],
      'django': ['django-admin', 'startproject', name, targetPath],
      'python-basic': ['mkdir', '-p', targetPath],
      'go': ['mkdir', '-p', targetPath]
    };

    const cmd = scaffoldCmds[template];
    if (!cmd) throw new Error(`Unknown template: ${template}`);

    this.emit('scaffold_start', { template, name, targetPath });

    try {
      if (template === 'go') {
        await execa('mkdir', ['-p', targetPath]);
        await execa('go', ['mod', 'init', name], { cwd: targetPath });
      } else {
        await execa(cmd[0], cmd.slice(1));
      }
      await this.scan();
      this.emit('scaffold_complete', { template, name, targetPath });
      return { success: true, path: targetPath };
    } catch (error) {
      this.emit('scaffold_error', { template, name, error: error.message });
      throw error;
    }
  }
}

export const orchestrator = new Orchestrator();
