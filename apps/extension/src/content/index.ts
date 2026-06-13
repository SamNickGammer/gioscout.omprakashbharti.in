import type { Message, ScrapedBusiness } from '../lib/types';
import { MapsScraper } from './scraper';

let scraper: MapsScraper | null = null;
let stopRequested = false;

function send(message: Message): Promise<unknown> {
  return chrome.runtime.sendMessage(message).catch(() => undefined);
}

async function startScan() {
  if (scraper) return; // already running
  stopRequested = false;
  scraper = new MapsScraper();

  try {
    const found = await scraper.run({
      onOpened: async (query) => {
        await send({ type: 'SCAN_OPENED', query });
      },
      onBatch: async (businesses: ScrapedBusiness[]) => {
        await send({ type: 'INGEST_BATCH', businesses });
      },
      onProgress: (found, message) => {
        void send({ type: 'SCAN_PROGRESS', found, message });
      },
      shouldStop: () => stopRequested,
    });
    await send({ type: 'SCAN_DONE', found });
  } catch (err) {
    await send({ type: 'SCAN_ERROR', message: err instanceof Error ? err.message : 'Scan failed' });
  } finally {
    scraper = null;
  }
}

function stopScan() {
  stopRequested = true;
  scraper?.stop();
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'START_SCAN') {
    startScan();
    sendResponse({ ok: true });
  } else if (message.type === 'STOP_SCAN') {
    stopScan();
    sendResponse({ ok: true });
  }
  return true;
});
