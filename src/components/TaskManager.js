/**
 * TaskManager.js — Orbit Task Manager
 * 
 * v5.2.0: Full overhaul.
 * - Duration display (elapsed / total)
 * - Project name per task
 * - Status color coding
 * - Detached / Orphaned / Rehydrated badges
 * - Scrollable list
 * - Re-attach (Shift+A) and kill (Shift+K) hints
 * - Output preview (last 2 log lines) per task
 */

import React, { memo, useMemo } from 'react';
import { Box, Text } from 'ink';

const create = React.createElement;

function formatDuration(startTime, endTime) {
  const ms = (endTime || Date.now()) - (startTime || Date.now());
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function statusColor(status) {
  switch (status) {
    case 'running':   return 'yellow';
    case 'success':   return 'green';
    case 'failed':    return 'red';
    case 'detached':  return 'blue';
    case 'orphaned':  return 'gray';
    case 'killed':    return 'gray';
    case 'rehydrated': return 'cyan';
    default:           return 'white';
  }
}

function statusIcon(status) {
  switch (status) {
    case 'running':   return '⟳';
    case 'success':   return '✓';
    case 'failed':    return '✗';
    case 'detached':  return '⊘';
    case 'orphaned':  return '?';
    case 'killed':    return '⊗';
    default:           return '·';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'running':   return 'RUNNING';
    case 'success':   return 'DONE';
    case 'failed':    return 'FAILED';
    case 'detached':  return 'DETACHED';
    case 'orphaned':  return 'ORPHANED';
    case 'killed':    return 'KILLED';
    default:           return status.toUpperCase();
  }
}

const MAX_VISIBLE_TASKS = 8;

const TaskManager = memo(({ tasks, activeTaskId, renameMode, renameInput, renameCursor, CursorText }) => {
  const activeIndex = useMemo(() => {
    if (!activeTaskId) return 0;
    const idx = tasks.findIndex(t => t.id === activeTaskId);
    return idx >= 0 ? idx : 0;
  }, [tasks, activeTaskId]);

  // Sliding window: keep activeIndex visible
  const windowStart = useMemo(() => {
    const half = Math.floor(MAX_VISIBLE_TASKS / 2);
    const start = Math.max(0, activeIndex - half);
    const end = start + MAX_VISIBLE_TASKS;
    if (end > tasks.length) return Math.max(0, tasks.length - MAX_VISIBLE_TASKS);
    return start;
  }, [activeIndex, tasks.length]);

  const visibleTasks = tasks.slice(windowStart, windowStart + MAX_VISIBLE_TASKS);
  const hasMore = tasks.length > MAX_VISIBLE_TASKS;

  const runningCount = tasks.filter(t => t.status === 'running').length;
  const detachedCount = tasks.filter(t => t.status === 'detached').length;
  const activeTask = tasks.find(t => t.id === activeTaskId);

  return create(
    Box,
    { flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', padding: 1 },

    // ── Header ───────────────────────────────────────────────
    create(Box, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
      create(Text, { bold: true, color: 'yellow' }, '🛰️  Orbit Task Manager'),
      create(Text, { dimColor: true },
        `${runningCount} running · ${detachedCount} detached · ${tasks.length} total`
      )
    ),

    // ── Keyboard hint ─────────────────────────────────────────
    create(Text, { dimColor: true, marginBottom: 1 },
      '↑/↓ focus  ·  Shift+K kill  ·  Shift+A reattach  ·  Shift+R rename  ·  Enter back'
    ),

    // ── Task list ─────────────────────────────────────────────
    ...visibleTasks.map((t) => {
      const isActive = t.id === activeTaskId;
      const color = statusColor(t.status);
      const icon = statusIcon(t.status);
      const label = statusLabel(t.status);
      const duration = formatDuration(t.startTime, t.endTime || (t.status === 'running' ? null : t.endTime));
      const lastLog = t.logs?.length > 0 ? t.logs[t.logs.length - 1] : null;
      const rehydratedBadge = t.rehydrated ? ' [RESTORED]' : '';
      const pidBadge = t.pid ? ` PID:${t.pid}` : '';

      return create(
        Box,
        { key: t.id, flexDirection: 'column', marginBottom: 1 },

        // Task header row
        create(
          Box,
          { flexDirection: 'row', alignItems: 'center' },
          create(Text, { color: isActive ? 'cyan' : 'gray', bold: isActive }, isActive ? '▶ ' : '  '),
          create(Text, { color, bold: true }, `${icon} `),
          create(Text, { color: isActive ? 'cyan' : 'white', bold: isActive },
            isActive && renameMode
              ? ''
              : t.name
          ),
          isActive && renameMode
            ? create(Box, { flexDirection: 'row' },
                create(Text, { color: 'cyan' }, 'Rename → '),
                create(CursorText, { value: renameInput, cursorIndex: renameCursor })
              )
            : null,
        ),

        // Meta row
        create(
          Box,
          { flexDirection: 'row', marginLeft: 4 },
          create(Text, { color, bold: true }, `[${label}]`),
          create(Text, { dimColor: true }, `  ${t.projectName || t.projectId || 'system'}  ·  ${duration}${rehydratedBadge}${pidBadge}`)
        ),

        // Last log line preview (active task only)
        isActive && lastLog
          ? create(Box, { marginLeft: 4, marginTop: 0 },
              create(Text, { dimColor: true, wrap: 'truncate-end' }, `↳ ${lastLog}`)
            )
          : null,
      );
    }),

    // ── Empty state ───────────────────────────────────────────
    !tasks.length && create(
      Box, { flexDirection: 'column', alignItems: 'center', marginY: 1 },
      create(Text, { dimColor: true }, 'No active or background tasks.'),
      create(Text, { dimColor: true }, 'Run a command from the Navigator to start one.')
    ),

    // ── Scroll indicator ─────────────────────────────────────
    hasMore && create(
      Box, { flexDirection: 'row', justifyContent: 'center', marginTop: 0 },
      create(Text, { dimColor: true },
        `Showing ${windowStart + 1}–${Math.min(windowStart + MAX_VISIBLE_TASKS, tasks.length)} of ${tasks.length} tasks`
      )
    ),

    // ── Footer ───────────────────────────────────────────────
    create(Text, { marginTop: 1, dimColor: true },
      'Press Enter or Shift+T to return to Navigator.'
    )
  );
});

export default TaskManager;
