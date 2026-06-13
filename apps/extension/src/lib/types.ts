import type { ScrapedBusiness } from '@geoscout/shared';

export type { ScrapedBusiness };

/** Persistent connection settings — the only two things in Options. */
export interface ExtensionConfig {
  apiBaseUrl: string;
  apiKey: string;
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  apiBaseUrl: 'https://geoscout.omprakashbharti.in',
  apiKey: '',
};

export interface ScanProgress {
  running: boolean;
  query: string;
  found: number;
  sent: number;
  created: number;
  updated: number;
  status: 'idle' | 'scanning' | 'sending' | 'done' | 'error';
  message?: string;
}

export const IDLE_PROGRESS: ScanProgress = {
  running: false,
  query: '',
  found: 0,
  sent: 0,
  created: 0,
  updated: 0,
  status: 'idle',
};

/** content ⇄ background ⇄ popup message protocol. */
export type Message =
  | { type: 'START_SCAN' }
  | { type: 'STOP_SCAN' }
  | { type: 'GET_STATE' }
  | { type: 'SCAN_OPENED'; query: string }
  | { type: 'INGEST_BATCH'; businesses: ScrapedBusiness[] }
  | { type: 'SCAN_PROGRESS'; found: number; message?: string }
  | { type: 'SCAN_DONE'; found: number }
  | { type: 'SCAN_ERROR'; message: string }
  | { type: 'STATE'; progress: ScanProgress };
