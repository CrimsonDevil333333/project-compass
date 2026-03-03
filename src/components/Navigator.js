import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import path from 'path';

export default function Navigator({ 
  projects, 
  selectedIndex, 
  rootPath, 
  loading, 
  error, 
  maxVisibleProjects = 4 
}) {
  const page = Math.floor(selectedIndex / maxVisibleProjects);
  const start = page * maxVisibleProjects;
  const end = start + maxVisibleProjects;
  const visibleProjects = projects.slice(start, end);

  const projectRows = useMemo(() => {
    if (loading) return [React.createElement(Text, { key: 'scanning', dimColor: true }, 'Scanning projects…')];
    if (error) return [React.createElement(Text, { key: 'error', color: 'red' }, `Unable to scan: ${error}`)];
    if (projects.length === 0) return [React.createElement(Text, { key: 'empty', dimColor: true }, 'No recognizable project manifests found.')];

    return visibleProjects.map((project, index) => {
      const absoluteIndex = start + index;
      const isSelected = absoluteIndex === selectedIndex;
      const frameworkBadges = (project.frameworks || []).map((frame) => `${frame.icon} ${frame.name}`).join(', ');
      const hasMissingRuntime = project.missingBinaries && project.missingBinaries.length > 0;
      
      return React.createElement(
        Box,
        { key: project.id, flexDirection: 'column', marginBottom: 1, padding: 1 },
        React.createElement(
          Box,
          { flexDirection: 'row' },
          React.createElement(Text, { color: isSelected ? 'cyan' : 'white', bold: isSelected }, `${project.icon} ${project.name}`),
          hasMissingRuntime && React.createElement(Text, { color: 'red', bold: true }, '  ⚠️ Runtime missing')
        ),
        React.createElement(Text, { dimColor: true }, `  ${project.type} · ${path.relative(rootPath, project.path) || '.'}`),
        frameworkBadges && React.createElement(Text, { dimColor: true }, `   ${frameworkBadges}`)
      );
    });
  }, [loading, error, projects.length, visibleProjects, selectedIndex, start, rootPath]);

  const totalPages = Math.ceil(projects.length / maxVisibleProjects);

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    ...projectRows,
    projects.length > maxVisibleProjects && React.createElement(
      Box,
      { marginTop: 1, justifyContent: 'center' },
      React.createElement(Text, { dimColor: true }, `Page ${page + 1} of ${totalPages} (Total: ${projects.length})`)
    )
  );
}
