import React, {useState, useEffect, memo} from 'react';
import {Box, Text} from 'ink';
import {execa} from 'execa';
import {checkBinary} from '../projectDetection.js';

const create = React.createElement;

const Studio = memo(() => {
  const [runtimes, setRuntimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checks = [
      {name: 'Node.js', binary: 'node', versionCmd: ['-v']},
      {name: 'npm', binary: 'npm', versionCmd: ['-v']},
      {name: 'Python', binary: process.platform === 'win32' ? 'python' : 'python3', versionCmd: ['--version']},
      {name: 'Rust (Cargo)', binary: 'cargo', versionCmd: ['--version']},
      {name: 'Go', binary: 'go', versionCmd: ['version']},
      {name: 'Java', binary: 'java', versionCmd: ['-version']},
      {name: 'PHP', binary: 'php', versionCmd: ['-v']},
      {name: 'Ruby', binary: 'ruby', versionCmd: ['-v']},
      {name: '.NET', binary: 'dotnet', versionCmd: ['--version']}
    ];

    (async () => {
      const results = await Promise.all(checks.map(async (lang) => {
        if (!checkBinary(lang.binary)) {
          return {...lang, status: 'missing', version: 'not installed'};
        }
        try {
          const {stdout, stderr} = await execa(lang.binary, lang.versionCmd);
          const version = (stdout || stderr || '').split('\n')[0].trim();
          return {...lang, status: 'ok', version};
        } catch {
          return {...lang, status: 'error', version: 'failed to check'};
        }
      }));
      setRuntimes(results);
      setLoading(false);
    })();
  }, []);

  return create(
    Box,
    {flexDirection: 'column', borderStyle: 'double', borderColor: 'blue', padding: 1, width: '100%'},
    create(Text, {bold: true, color: 'blue'}, '💎 Omni-Studio | Environment Intelligence'),
    create(Text, {dimColor: true, marginBottom: 1}, 'Overview of installed languages and build tools.'),
    loading
      ? create(Text, {dimColor: true}, 'Gathering intelligence...')
      : create(
          Box,
          {flexDirection: 'column'},
          ...runtimes.map(r => create(
            Box,
            {key: r.name, marginBottom: 0},
            create(Text, {width: 20, color: r.status === 'ok' ? 'green' : 'red'}, `${r.status === 'ok' ? '✓' : '✗'} ${r.name}`),
            create(Text, {dimColor: r.status !== 'ok'}, `:  ${r.version}`)
          )),
          create(Text, {marginTop: 1, dimColor: true}, 'Press Shift+A to return to Navigator.')
        )
  );
});

export default Studio;
