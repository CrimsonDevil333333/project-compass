import { execa } from 'execa';
import { checkBinary } from '../detectors/utils.js';

export const SUPPORTED_RUNTIMES = [
  { name: 'Node.js', bins: ['node'], cmd: ['-v'], icon: '🟢' },
  { name: 'NPM', bins: ['npm'], cmd: ['-v'], icon: '📦' },
  { name: 'Python', bins: ['python3', 'python', 'uv'], cmd: ['--version'], icon: '🐍' },
  { name: 'Rust', bins: ['cargo'], cmd: ['--version'], icon: '🦀' },
  { name: 'Go', bins: ['go'], cmd: ['version'], icon: '🐹' },
  { name: 'Java', bins: ['java'], cmd: ['-version'], icon: '☕' },
  { name: 'PHP', bins: ['php'], cmd: ['-v'], icon: '🐘' },
  { name: 'Ruby', bins: ['ruby'], cmd: ['-v'], icon: '💎' },
  { name: '.NET', bins: ['dotnet'], cmd: ['--version'], icon: '🔷' }
];

export async function runFullAudit() {
  return await Promise.all(SUPPORTED_RUNTIMES.map(async (r) => {
    if (r.name === 'Node.js') {
      return { ...r, status: 'online', version: process.version, activeBin: 'node' };
    }

    for (const bin of r.bins) {
      if (checkBinary(bin)) {
        try {
          const { stdout, stderr } = await execa(bin, r.cmd);
          const version = (stdout || stderr || '').split('\n')[0].replace(/Python |cargo |go version /i, '').trim();
          return { ...r, status: 'online', version, activeBin: bin };
        } catch {
          // Try next binary
        }
      }
    }
    return { ...r, status: 'offline', version: 'Not Installed' };
  }));
}
