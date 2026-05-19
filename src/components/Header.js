import React from 'react';
import { Box, Text } from 'ink';

export default function Header({ projectCountLabel, rootPath, running, statusHint, toggleHint, orbitHint, artHint }) {
  return React.createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    React.createElement(
      Box,
      { 
        justifyContent: 'space-between', 
        borderStyle: 'single', 
        borderColor: 'magenta', 
        paddingX: 2,
        paddingY: 0
      },
      React.createElement(
        Box,
        { flexDirection: 'column' },
        React.createElement(Text, { color: 'magenta', bold: true }, '🧭 PROJECT COMPASS v4.5.0'),
        React.createElement(Text, { dimColor: true }, `📂 ${rootPath.length > 40 ? '...' + rootPath.slice(-37) : rootPath}`)
      ),
      React.createElement(
        Box,
        { flexDirection: 'column', alignItems: 'flex-end' },
        React.createElement(Text, { color: running ? 'yellow' : 'green', bold: true }, `● ${statusHint.toUpperCase()}`),
        React.createElement(Text, { dimColor: true }, `${projectCountLabel} active projects`)
      )
    ),
    React.createElement(
      Box,
      { justifyContent: 'space-between', paddingX: 1, marginTop: 0 },
      React.createElement(Text, { dimColor: true }, ` ${toggleHint} · ${orbitHint} · ${artHint} `),
      React.createElement(Text, { color: 'red', bold: true }, 'Shift+Q QUIT')
    )
  );

}
