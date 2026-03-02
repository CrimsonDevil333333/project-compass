import React from 'react';
import { Box, Text } from 'ink';

export default function Header({ projectCountLabel, rootPath, running, statusHint, toggleHint, orbitHint, artHint }) {
  return React.createElement(
    Box,
    { justifyContent: 'space-between' },
    React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(Text, { color: 'magenta', bold: true }, 'Project Compass'),
      React.createElement(Text, { dimColor: true }, `${projectCountLabel} detected in ${rootPath}`)
    ),
    React.createElement(
      Box,
      { flexDirection: 'column', alignItems: 'flex-end' },
      React.createElement(Text, { color: running ? 'yellow' : 'green' }, statusHint),
      React.createElement(Text, { dimColor: true }, `${toggleHint} · ${orbitHint} · ${artHint} · Shift+Q: Quit`)
    )
  );
}
