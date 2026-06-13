import { getConfig } from '../lib/storage';
import {
  IDLE_PROGRESS,
  type Message,
  type ScanProgress,
  type ScrapedBusiness,
} from '../lib/types';

// In-memory run state. Mirrored to session storage so the popup can recover it
// if the service worker was respawned.
let progress: ScanProgress = { ...IDLE_PROGRESS };
let scanJobId: string | null = null;

async function persist() {
  await chrome.storage.session.set({ progress, scanJobId });
}

async function restore() {
  const s = await chrome.storage.session.get(['progress', 'scanJobId']);
  if (s.progress) progress = s.progress;
  if (s.scanJobId) scanJobId = s.scanJobId;
}
restore();

function api(path: string, base: string) {
  return `${base.replace(/\/$/, '')}${path}`;
}

async function openScanJob(query: string) {
  const cfg = await getConfig();
  try {
    const res = await fetch(api('/api/scan-jobs', cfg.apiBaseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey },
      body: JSON.stringify({ query, area: query, source: 'extension' }),
    });
    if (res.ok) {
      const data = await res.json();
      scanJobId = data.id ?? null;
    }
  } catch (err) {
    console.warn('[geoscout] openScanJob failed', err);
  }
}

async function closeScanJob(status: 'completed' | 'failed') {
  if (!scanJobId) return;
  const cfg = await getConfig();
  try {
    await fetch(api(`/api/scan-jobs/${scanJobId}`, cfg.apiBaseUrl), {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey },
      body: JSON.stringify({
        status,
        foundCount: progress.found,
        newCount: progress.created,
        updatedCount: progress.updated,
      }),
    });
  } catch (err) {
    console.warn('[geoscout] closeScanJob failed', err);
  } finally {
    scanJobId = null;
  }
}

async function sendBatch(businesses: ScrapedBusiness[]) {
  const cfg = await getConfig();
  const res = await fetch(api('/api/ingest', cfg.apiBaseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey },
    body: JSON.stringify({ scanJobId, businesses }),
  });
  if (!res.ok) {
    throw new Error(`Ingest failed (${res.status})`);
  }
  return (await res.json()) as { created: number; updated: number };
}

async function forwardToActiveTab(message: Message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && tab.url?.includes('google.com/maps')) {
    await chrome.tabs.sendMessage(tab.id, message);
    return true;
  }
  return false;
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'GET_STATE':
        sendResponse({ type: 'STATE', progress });
        break;

      case 'START_SCAN': {
        progress = { ...IDLE_PROGRESS, running: true, status: 'scanning' };
        await persist();
        const ok = await forwardToActiveTab({ type: 'START_SCAN' });
        if (!ok) {
          progress = { ...IDLE_PROGRESS, status: 'error', message: 'Open a Google Maps search tab first.' };
          await persist();
        }
        sendResponse({ type: 'STATE', progress });
        break;
      }

      case 'STOP_SCAN':
        await forwardToActiveTab({ type: 'STOP_SCAN' });
        progress = { ...progress, running: false, status: 'done' };
        await closeScanJob('completed');
        await persist();
        sendResponse({ type: 'STATE', progress });
        break;

      case 'SCAN_OPENED':
        progress = { ...progress, query: message.query, running: true, status: 'scanning' };
        await openScanJob(message.query);
        await persist();
        sendResponse({ ok: true });
        break;

      case 'INGEST_BATCH': {
        try {
          progress.status = 'sending';
          const { created, updated } = await sendBatch(message.businesses);
          progress.created += created;
          progress.updated += updated;
          progress.sent += message.businesses.length;
          progress.status = 'scanning';
          await persist();
          sendResponse({ ok: true, created, updated });
        } catch (err) {
          progress.status = 'error';
          progress.message = err instanceof Error ? err.message : 'Ingest error';
          await persist();
          sendResponse({ ok: false, error: progress.message });
        }
        break;
      }

      case 'SCAN_PROGRESS':
        progress.found = message.found;
        if (message.message) progress.message = message.message;
        await persist();
        sendResponse({ ok: true });
        break;

      case 'SCAN_DONE':
        progress.found = message.found;
        progress.running = false;
        progress.status = 'done';
        await closeScanJob('completed');
        await persist();
        sendResponse({ ok: true });
        break;

      case 'SCAN_ERROR':
        progress.running = false;
        progress.status = 'error';
        progress.message = message.message;
        await closeScanJob('failed');
        await persist();
        sendResponse({ ok: true });
        break;
    }
  })();
  return true; // keep the message channel open for the async response
});
