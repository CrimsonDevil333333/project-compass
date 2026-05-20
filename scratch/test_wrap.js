import React from 'react';
import {render, Box, Text} from 'ink';

const Demo = () => {
  return React.createElement(
    Box,
    {flexDirection: 'column', width: 40, borderStyle: 'round'},
    React.createElement(Text, null, "Normal:"),
    React.createElement(Text, null, "ThisIsAnExtremelyLongLineWithoutAnySpacesToSeeIfItStretchesTheBoxOrIfItWrapsToTheNextLineAutomatically"),
    React.createElement(Text, {wrap: 'truncate-end'}, "Truncate-End: ThisIsAnExtremelyLongLineWithoutAnySpacesToSeeIfItStretchesTheBoxOrIfItWrapsToTheNextLineAutomatically"),
    React.createElement(Text, {wrap: 'truncate-middle'}, "Truncate-Middle: ThisIsAnExtremelyLongLineWithoutAnySpacesToSeeIfItStretchesTheBoxOrIfItWrapsToTheNextLineAutomatically"),
    React.createElement(Text, {wrap: 'wrap'}, "Wrap: ThisIsAnExtremelyLongLineWithoutAnySpacesToSeeIfItStretchesTheBoxOrIfItWrapsToTheNextLineAutomatically")
  );
};

render(React.createElement(Demo));
