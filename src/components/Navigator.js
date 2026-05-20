import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import path from 'path';

export default function Navigator({ 
  projects, 
  selectedIndex, 
  rootPath, 
  loading, 
  error, 
  maxVisibleProjects = 3,
  searchQuery = '',
  CursorText,
  searchCursor = 0
}) {
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const page = Math.floor(selectedIndex / maxVisibleProjects);
  const start = page * maxVisibleProjects;
  const end = start + maxVisibleProjects;
  const visibleProjects = filteredProjects.slice(start, end);

  const projectRows = useMemo(() => {
    if (loading) return [React.createElement(Text, { key: 'scanning', dimColor: true }, 'Scanning projects...')];
    if (error) return [React.createElement(Text, { key: 'error', color: 'red' }, `Unable to scan: ${error}`)];
    if (filteredProjects.length === 0) return [React.createElement(Text, { key: 'empty', dimColor: true }, searchQuery ? 'No projects match your search.' : 'No recognizable project manifests found.')];

    const rows = [];

    visibleProjects.forEach((project, index) => {
      const absoluteIndex = start + index;
      const isSelected = absoluteIndex === selectedIndex;
      const frameworkBadges = (project.frameworks || []).map((f) => `${f.icon} ${f.name}`).join('  ');
      const hasMissingRuntime = project.missingBinaries && project.missingBinaries.length > 0;

      // Git info without leading spaces — placed on the RIGHT via space-between
      const gitText = project.git?.available
        ? `[${project.git.branch}${project.git.dirty ? '*' : ''}]`
        : '';

      // Row 1 is pure ASCII only (no emoji) for guaranteed border alignment.
      // Emoji live on rows 2 & 3 inside single truncated Text nodes.
      const indicator   = isSelected ? '> ' : '  ';
      const titleColor  = isSelected ? 'cyan'    : 'white';
      const gitColor    = isSelected ? 'cyan'    : 'gray';
      const infoColor   = isSelected ? 'yellow'  : 'gray';
      const frameColor  = isSelected ? 'green'   : 'gray';
      const relPath     = path.relative(rootPath, project.path) || '.';
      const runtimeTag  = hasMissingRuntime ? '  !! MISSING RUNTIME' : '';
      const infoLine    = `${project.icon} ${project.type} · ${relPath}`;

      rows.push(
        React.createElement(
          Box,
          { key: project.id, flexDirection: 'column' },

          // ── Row 1: indicator  NAME (truncated)  [branch*] right-aligned ──────────
          React.createElement(
            Box, { flexDirection: 'row', justifyContent: 'space-between' },
            // Left: indicator + name
            React.createElement(
              Box, { flexDirection: 'row', flexShrink: 1, minWidth: 0 },
              React.createElement(Text, { color: isSelected ? 'magenta' : 'gray', bold: isSelected }, indicator),
              React.createElement(Text, { color: titleColor, bold: isSelected, wrap: 'truncate-end' }, project.name.toUpperCase())
            ),
            // Right: git branch tag — pushed to the far right
            gitText && React.createElement(Text, { color: gitColor, dimColor: !isSelected }, ` ${gitText}`)
          ),

          // ── Row 2: icon  type  [!! MISSING]  ·  path ────────────────────────────
          React.createElement(
            Box, { flexDirection: 'row' },
            React.createElement(Text, { color: isSelected ? 'magenta' : 'gray' }, '  '),
            React.createElement(Text, {
              color: hasMissingRuntime ? 'red' : infoColor,
              dimColor: !isSelected && !hasMissingRuntime,
              bold: hasMissingRuntime,
              wrap: 'truncate-end'
            }, infoLine),
            hasMissingRuntime && React.createElement(Text, { color: 'red', bold: true }, runtimeTag)
          ),

          // ── Row 3: framework badges (emoji safe here, isolated single Text) ──────
          frameworkBadges
            ? React.createElement(
                Box, { flexDirection: 'row' },
                React.createElement(Text, { color: isSelected ? 'magenta' : 'gray' }, '  '),
                React.createElement(Text, { color: frameColor, dimColor: !isSelected, wrap: 'truncate-end' }, frameworkBadges)
              )
            : null,

          // ── Separator: thin dim line between cards ────────────────────────────────
          React.createElement(
            Box, { marginTop: 1, marginBottom: 0 },
            React.createElement(Text, { dimColor: true }, '')
          )
        )
      );
    });

    return rows;

  }, [loading, error, filteredProjects, visibleProjects, selectedIndex, start, rootPath, searchQuery]);

  const totalPages = Math.ceil(filteredProjects.length / maxVisibleProjects);

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    searchQuery !== null && React.createElement(
      Box,
      { marginBottom: 1, flexDirection: 'row' },
      React.createElement(Text, { color: 'cyan', bold: true }, '/ '),
      React.createElement(CursorText, { value: searchQuery, cursorIndex: searchCursor })
    ),
    ...projectRows,
    filteredProjects.length > maxVisibleProjects && React.createElement(
      Box,
      { marginTop: 1, justifyContent: 'center' },
      React.createElement(Text, { color: 'magenta', dimColor: true }, `-- pg ${page + 1}/${totalPages}  (${filteredProjects.length} of ${projects.length}) --`)
    )
  );
}
