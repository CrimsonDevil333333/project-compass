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
    if (loading) return [React.createElement(Text, { key: 'scanning', dimColor: true }, 'Scanning projects…')];
    if (error) return [React.createElement(Text, { key: 'error', color: 'red' }, `Unable to scan: ${error}`)];
    if (filteredProjects.length === 0) return [React.createElement(Text, { key: 'empty', dimColor: true }, searchQuery ? 'No projects match your search.' : 'No recognizable project manifests found.')];

    return visibleProjects.map((project, index) => {
      const absoluteIndex = start + index;
      const isSelected = absoluteIndex === selectedIndex;
      const frameworkBadges = (project.frameworks || []).map((frame) => `${frame.icon} ${frame.name}`).join(', ');
      const hasMissingRuntime = project.missingBinaries && project.missingBinaries.length > 0;
      const gitInfo = project.git?.available ? 
        ` ( ${project.git.branch}${project.git.dirty ? '*' : ''})` : '';
      
      return React.createElement(
        Box,
        { key: project.id, flexDirection: 'column', marginBottom: 1, borderStyle: 'round', borderColor: isSelected ? 'cyan' : 'gray', paddingX: 1 },
        React.createElement(
          Box,
          { flexDirection: 'row' },
          React.createElement(Text, { color: isSelected ? 'cyan' : 'white', bold: isSelected }, `${isSelected ? '→' : ' '} ${project.icon} ${project.name}`.toUpperCase()),
          React.createElement(Text, { color: 'blue', dimColor: !isSelected }, gitInfo),
          hasMissingRuntime && React.createElement(Text, { color: 'red', bold: true }, '  ⚠️ RUNTIME MISSING')
        ),
        React.createElement(Text, { dimColor: true }, `   ${project.type} · ${path.relative(rootPath, project.path) || '.'}`),
        frameworkBadges && React.createElement(Text, { color: isSelected ? 'yellow' : 'gray', dimColor: !isSelected }, `   ${frameworkBadges}`)
      );
    });

  }, [loading, error, filteredProjects, visibleProjects, selectedIndex, start, rootPath, searchQuery]);

  const totalPages = Math.ceil(filteredProjects.length / maxVisibleProjects);

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    searchQuery !== null && React.createElement(
      Box,
      { marginBottom: 1, flexDirection: 'row' },
      React.createElement(Text, { color: 'cyan', bold: true }, ' 🔍 SEARCH: '),
      React.createElement(CursorText, { value: searchQuery, cursorIndex: searchCursor })
    ),
    ...projectRows,
    filteredProjects.length > maxVisibleProjects && React.createElement(
      Box,
      { marginTop: 1, justifyContent: 'center' },
      React.createElement(Text, { dimColor: true }, `Page ${page + 1} of ${totalPages} (Filtered: ${filteredProjects.length}/${projects.length})`)
    )
  );
}

