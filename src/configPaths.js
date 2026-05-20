import fs from 'fs';
import os from 'os';
import path from 'path';

export const CONFIG_DIR = path.join(os.homedir(), '.project-compass');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
export const PLUGIN_FILE = path.join(CONFIG_DIR, 'plugins.json');
export const TASKS_DIR = path.join(CONFIG_DIR, 'tasks');
export const TASKS_MANIFEST_PATH = path.join(CONFIG_DIR, 'tasks.json');

export function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, {recursive: true});
  }
  if (!fs.existsSync(TASKS_DIR)) {
    fs.mkdirSync(TASKS_DIR, {recursive: true});
  }
}

export function saveConfig(config) {
  try {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(`Unable to persist config: ${error.message}`);
  }
}

export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const payload = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(payload || '{}');
      return {
        customCommands: {},
        showArtBoard: true,
        showHelpCards: false,
        showStructureGuide: false,
        maxVisibleProjects: 3,
        taskRenames: {},
        ...parsed,
      };
    }
  } catch (error) {
    console.error(`Ignoring corrupt config: ${error.message}`);
  }
  return {customCommands: {}, showArtBoard: true, showHelpCards: false, showStructureGuide: false, maxVisibleProjects: 3, taskRenames: {}};
}
