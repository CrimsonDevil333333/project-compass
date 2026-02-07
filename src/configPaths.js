import fs from 'fs';
import os from 'os';
import path from 'path';

export const CONFIG_DIR = path.join(os.homedir(), '.project-compass');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
export const PLUGIN_FILE = path.join(CONFIG_DIR, 'plugins.json');

export function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, {recursive: true});
  }
}
