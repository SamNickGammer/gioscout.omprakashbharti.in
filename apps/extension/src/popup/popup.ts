import { getConfig } from '../lib/storage';
import { IDLE_PROGRESS, type Message, type ScanProgress } from '../lib/types';

const $ = (id: string) => document.getElementById(id)!;

const els = {
  needsConfig: $('needs-config'),
  dot: $('dot'),
  statusText: $('status-text'),
  query: $('query'),
  found: $('found'),
  sent: $('sent'),
  created: $('created'),
  updated: $('updated'),
  message: $('message'),
  action: $('action') as HTMLButtonElement,
};

let progress: ScanProgress = { ...IDLE_PROGRESS };
let pollTimer: number | undefined;

async function getState(): Promise<ScanProgress> {
  const res = (await chrome.runtime.sendMessage({ type: 'GET_STATE' } as Message).catch(() => null)) as
    | { progress: ScanProgress }
    | null;
  return res?.progress ?? { ...IDLE_PROGRESS };
}

const STATUS_LABEL: Record<ScanProgress['status'], string> = {
  idle: 'Idle',
  scanning: 'Scanning…',
  sending: 'Saving…',
  done: 'Done',
  error: 'Error',
};

function render() {
  els.dot.className = 'dot';
  if (progress.status === 'scanning' || progress.status === 'sending') els.dot.classList.add('scanning');
  else if (progress.status === 'done') els.dot.classList.add('done');
  else if (progress.status === 'error') els.dot.classList.add('error');

  els.statusText.textContent = STATUS_LABEL[progress.status];
  els.query.textContent = progress.query || '';
  els.found.textContent = String(progress.found);
  els.sent.textContent = String(progress.sent);
  els.created.textContent = String(progress.created);
  els.updated.textContent = String(progress.updated);
  els.message.textContent = progress.message ?? '';

  if (progress.running) {
    els.action.textContent = 'Stop scan';
    els.action.classList.add('stop');
  } else {
    els.action.textContent = 'Start scan';
    els.action.classList.remove('stop');
  }
}

function startPolling() {
  stopPolling();
  pollTimer = window.setInterval(async () => {
    progress = await getState();
    render();
    if (!progress.running) stopPolling();
  }, 1000);
}
function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = undefined;
}

els.action.addEventListener('click', async () => {
  if (progress.running) {
    await chrome.runtime.sendMessage({ type: 'STOP_SCAN' } as Message);
  } else {
    els.action.disabled = true;
    const res = (await chrome.runtime.sendMessage({ type: 'START_SCAN' } as Message)) as {
      progress: ScanProgress;
    };
    els.action.disabled = false;
    if (res?.progress) progress = res.progress;
    startPolling();
  }
  progress = await getState();
  render();
});

function openOptions(e: Event) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
}
$('open-options').addEventListener('click', openOptions);
$('open-options-2').addEventListener('click', openOptions);

$('open-dashboard').addEventListener('click', async (e) => {
  e.preventDefault();
  const cfg = await getConfig();
  chrome.tabs.create({ url: `${cfg.apiBaseUrl.replace(/\/$/, '')}/dashboard` });
});

(async function init() {
  const cfg = await getConfig();
  els.needsConfig.classList.toggle('hidden', !!cfg.apiKey && !!cfg.apiBaseUrl);
  progress = await getState();
  render();
  if (progress.running) startPolling();
})();
