import { DEFAULT_CONFIG, type ExtensionConfig } from './types';

const CONFIG_KEY = 'geoscout_config';

export async function getConfig(): Promise<ExtensionConfig> {
  const stored = await chrome.storage.local.get(CONFIG_KEY);
  return { ...DEFAULT_CONFIG, ...(stored[CONFIG_KEY] ?? {}) };
}

export async function setConfig(config: Partial<ExtensionConfig>): Promise<void> {
  const current = await getConfig();
  await chrome.storage.local.set({ [CONFIG_KEY]: { ...current, ...config } });
}
