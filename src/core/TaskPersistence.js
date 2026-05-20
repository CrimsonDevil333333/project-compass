/**
 * TaskPersistence.js
 * 
 * Robust task persistence layer for Project Compass.
 * 
 * Strategy:
 *   - Each running task gets a dedicated log file: ~/.project-compass/tasks/<taskId>.log
 *   - Task metadata (id, name, pid, command, status, projectId, logPath, startTime) is
 *     saved to ~/.project-compass/tasks.json after every status change.
 *   - On TUI/server startup, we read tasks.json, check which PIDs are still alive,
 *     and mark the rest as 'orphaned' (process ended while we were away).
 *   - Re-attaching: read historical logs from log file, then tail the file via
 *     fs.createReadStream + fs.watch for live streaming.
 * 
 * Max log file age: 24 hours. Older files are pruned on startup.
 */

import fs from 'fs';
import path from 'path';
import { CONFIG_DIR, TASKS_DIR, TASKS_MANIFEST_PATH, ensureConfigDir } from '../configPaths.js';

const MAX_LOG_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_HISTORICAL_LINES = 2000;

/**
 * Get the log file path for a given task ID.
 * Sanitize taskId for filesystem safety.
 */
export function getTaskLogPath(taskId) {
  const safe = taskId.replace(/[^a-zA-Z0-9_:\-.]/g, '_');
  return path.join(TASKS_DIR, `${safe}.log`);
}

/**
 * Persist the current task manifest to tasks.json.
 * Only serializes safe fields (no process handles).
 */
export function saveTasksManifest(tasks) {
  try {
    ensureConfigDir();
    const serializable = tasks.map(t => ({
      id: t.id,
      name: t.name,
      label: t.label || t.name,
      projectId: t.projectId,
      projectName: t.projectName || '',
      command: t.command || [],
      status: t.status,
      pid: t.pid || null,
      logPath: t.logPath || null,
      startTime: t.startTime || null,
      endTime: t.endTime || null,
      detachedAt: t.detachedAt || null,
    }));
    fs.writeFileSync(TASKS_MANIFEST_PATH, JSON.stringify(serializable, null, 2));
  } catch (err) {
    // Non-fatal — persistence is best-effort
    process.stderr.write(`[TaskPersistence] saveTasksManifest failed: ${err.message}\n`);
  }
}

/**
 * Load persisted tasks from tasks.json.
 * Checks PID liveness and annotates status accordingly.
 * Returns array of task metadata objects (no process handles).
 */
export function loadTasksManifest() {
  try {
    if (!fs.existsSync(TASKS_MANIFEST_PATH)) return [];
    const raw = fs.readFileSync(TASKS_MANIFEST_PATH, 'utf-8');
    const tasks = JSON.parse(raw || '[]');
    if (!Array.isArray(tasks)) return [];

    const now = Date.now();
    return tasks
      .filter(t => {
        // Prune tasks older than MAX_LOG_AGE_MS
        if (t.startTime && (now - t.startTime) > MAX_LOG_AGE_MS) return false;
        return true;
      })
      .map(t => {
        // Check if PID is still alive
        let pidAlive = false;
        if (t.pid) {
          try {
            process.kill(t.pid, 0); // Signal 0 = existence check
            pidAlive = true;
          } catch {
            pidAlive = false;
          }
        }

        // If we thought it was running/detached but PID is gone → orphaned
        if ((t.status === 'running' || t.status === 'detached') && !pidAlive) {
          return { ...t, status: 'orphaned', pidAlive: false };
        }
        // If detached and PID alive → still detached (re-attachable)
        if (t.status === 'detached' && pidAlive) {
          return { ...t, pidAlive: true };
        }
        return { ...t, pidAlive };
      });
  } catch (err) {
    process.stderr.write(`[TaskPersistence] loadTasksManifest failed: ${err.message}\n`);
    return [];
  }
}

/**
 * Read historical log lines from a task's log file.
 * Returns up to MAX_HISTORICAL_LINES lines.
 */
export function readTaskLogs(logPath) {
  try {
    if (!logPath || !fs.existsSync(logPath)) return [];
    const raw = fs.readFileSync(logPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.length > 0);
    return lines.slice(-MAX_HISTORICAL_LINES);
  } catch {
    return [];
  }
}

/**
 * Create a write stream for a task's log file.
 * Returns a { stream, logPath } object.
 */
export function createTaskLogStream(taskId) {
  ensureConfigDir();
  const logPath = getTaskLogPath(taskId);
  const stream = fs.createWriteStream(logPath, { flags: 'a', encoding: 'utf-8' });
  return { stream, logPath };
}

/**
 * Tail a task log file for live streaming.
 * Calls onLine(line) for each new line written to the file.
 * Returns a cleanup function to stop watching.
 * 
 * Strategy: Polling-based (100ms interval) with fs.watch as a secondary trigger.
 * Polling is used as primary because fs.watch can be unreliable on some Linux
 * platforms (ARM, network filesystems, containers). The watcher acts as an
 * additional push trigger for low-latency environments.
 */
export function tailTaskLog(logPath, onLine) {
  if (!logPath) return () => {};
  
  // If log file doesn't exist yet, wait for it (up to 2s), then start
  if (!fs.existsSync(logPath)) {
    let waited = 0;
    const waitInterval = setInterval(() => {
      waited += 100;
      if (fs.existsSync(logPath)) {
        clearInterval(waitInterval);
        // Recurse to start tailing now that file exists
        tailTaskLog(logPath, onLine);
      } else if (waited >= 2000) {
        clearInterval(waitInterval);
      }
    }, 100);
    return () => clearInterval(waitInterval);
  }

  let readPosition = 0;
  let stopped = false;

  // Seek to end so we only get NEW data after the call
  try {
    const stat = fs.statSync(logPath);
    readPosition = stat.size;
  } catch {
    readPosition = 0;
  }

  const readNewData = () => {
    if (stopped) return;
    try {
      const stat = fs.statSync(logPath);
      if (stat.size <= readPosition) return;

      const toRead = stat.size - readPosition;
      const buf = Buffer.alloc(toRead);
      const fd = fs.openSync(logPath, 'r');
      const bytesRead = fs.readSync(fd, buf, 0, toRead, readPosition);
      fs.closeSync(fd);

      readPosition += bytesRead;

      const chunk = buf.slice(0, bytesRead).toString('utf-8');
      // Split on newlines, preserving incomplete lines at the buffer boundary
      const lines = chunk.split('\n');
      // The last element might be an incomplete line if the write was partial
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.length > 0) onLine(line);
      }
      // If the chunk ends with \n, the last element is empty — fine.
      // If not, we leave the partial line for the next poll.
      const lastPart = lines[lines.length - 1];
      if (lastPart.length > 0) {
        // Rewind so partial line is re-read next time
        readPosition -= Buffer.byteLength(lastPart, 'utf-8');
      }
    } catch {
      // File deleted or rotated; stop gracefully
      stopped = true;
    }
  };

  // Primary: polling every 100ms
  const pollInterval = setInterval(readNewData, 100);

  // Secondary: fs.watch as additional push trigger (best-effort, not all platforms)
  let watcher = null;
  try {
    watcher = fs.watch(logPath, { persistent: false }, (event) => {
      if (event === 'change' && !stopped) readNewData();
    });
    watcher.on('error', () => { /* ignore watch errors */ });
  } catch {
    // fs.watch not available — polling alone is sufficient
  }

  return () => {
    stopped = true;
    clearInterval(pollInterval);
    try { watcher?.close(); } catch { /* ignore */ }
  };
}

/**
 * Prune old log files from TASKS_DIR (files older than MAX_LOG_AGE_MS).
 */
export function pruneOldTaskLogs() {
  try {
    if (!fs.existsSync(TASKS_DIR)) return;
    const now = Date.now();
    const files = fs.readdirSync(TASKS_DIR);
    for (const file of files) {
      const filePath = path.join(TASKS_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > MAX_LOG_AGE_MS) {
          fs.unlinkSync(filePath);
        }
      } catch { /* ignore individual file errors */ }
    }
  } catch { /* ignore */ }
}

/**
 * Delete a specific task's log file.
 */
export function deleteTaskLog(logPath) {
  try {
    if (logPath && fs.existsSync(logPath)) fs.unlinkSync(logPath);
  } catch { /* ignore */ }
}
