import { DEFAULT_CONFIG, type ExtensionConfig } from './types';

const KEY = 'geoscout_config';

export async function getConfig(): Promise<ExtensionConfig> {
  const stored = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_CONFIG, ...(stored[KEY] ?? {}) };
}

export async function setConfig(config: Partial<ExtensionConfig>): Promise<void> {
  const current = await getConfig();
  await chrome.storage.local.set({ [KEY]: { ...current, ...config } });
}
