import React from 'react';
import { Box, Text } from 'ink';

export default function Footer({ toggleHint, running, stdinBuffer, stdinCursor, CursorText }) {
  return React.createElement(
    Box,
    { flexDirection: 'column', marginTop: 1 },
    React.createElement(
      Box,
      { flexDirection: 'row', justifyContent: 'space-between' },
      React.createElement(Text, { dimColor: true }, running ? 'Type to feed stdin; Enter: submit.' : 'Run a command or press Shift+T to switch tasks.'),
      React.createElement(Text, { dimColor: true }, `${toggleHint}, Shift+S: Structure Guide`)
    ),
    React.createElement(
      Box,
      { marginTop: 1, flexDirection: 'row', borderStyle: 'round', borderColor: running ? 'green' : 'gray', paddingX: 1 },
      React.createElement(Text, { bold: true, color: running ? 'green' : 'white' }, running ? ' Stdin buffer ' : ' Input ready '),
      React.createElement(
        Box,
        { marginLeft: 1 },
        React.createElement(CursorText, { value: stdinBuffer || (running ? '' : 'Start a command to feed stdin'), cursorIndex: stdinCursor, active: running })
      )
    )
  );
}
