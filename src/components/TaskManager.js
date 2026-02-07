import React, {memo} from 'react';
import {Box, Text} from 'ink';

const create = React.createElement;

const TaskManager = memo(({tasks, activeTaskId, renameMode, renameInput, renameCursor, CursorText}) => {
  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', padding: 1},
    create(Text, {bold: true, color: 'yellow'}, '🛰️ Orbit Task Manager | Background Processes'),
    create(Text, {dimColor: true, marginBottom: 1}, 'Up/Down: focus, Shift+K: Force Kill, Shift+R: Rename'),
    ...tasks.map(t => create(
      Box,
      {key: t.id, marginBottom: 0, flexDirection: 'column'},
      t.id === activeTaskId && renameMode 
        ? create(Box, {flexDirection: 'row'}, create(Text, {color: 'cyan'}, '→ Rename to: '), create(CursorText, {value: renameInput, cursorIndex: renameCursor}))
        : create(Text, {color: t.id === activeTaskId ? 'cyan' : 'white', bold: t.id === activeTaskId}, `${t.id === activeTaskId ? '→' : ' '} [${t.status.toUpperCase()}] ${t.name}`)
    )),
    !tasks.length && create(Text, {dimColor: true}, 'No active or background tasks.'),
    create(Text, {marginTop: 1, dimColor: true}, 'Press Enter or Shift+T to return to Navigator.')
  );
});

export default TaskManager;
