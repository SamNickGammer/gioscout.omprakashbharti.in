import { getConfig, setConfig } from '../lib/storage';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const apiBaseUrl = $<HTMLInputElement>('apiBaseUrl');
const apiKey = $<HTMLInputElement>('apiKey');
const maxResults = $<HTMLInputElement>('maxResults');
const deepScrape = $<HTMLInputElement>('deepScrape');
const status = $('status');

function setStatus(text: string, ok?: boolean) {
  status.textContent = text;
  status.className = `status ${ok === undefined ? '' : ok ? 'ok' : 'err'}`;
}

async function load() {
  const cfg = await getConfig();
  apiBaseUrl.value = cfg.apiBaseUrl;
  apiKey.value = cfg.apiKey;
  maxResults.value = String(cfg.maxResults);
  deepScrape.checked = cfg.deepScrape;
}

$('save').addEventListener('click', async () => {
  await setConfig({
    apiBaseUrl: apiBaseUrl.value.trim(),
    apiKey: apiKey.value.trim(),
    maxResults: Math.max(0, parseInt(maxResults.value, 10) || 0),
    deepScrape: deepScrape.checked,
  });
  setStatus('Saved.', true);
});

$('test').addEventListener('click', async () => {
  setStatus('Testing…');
  try {
    const res = await fetch(`${apiBaseUrl.value.trim().replace(/\/$/, '')}/api/ingest`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey.value.trim() },
    });
    if (res.ok) setStatus('Connection OK — API key accepted.', true);
    else if (res.status === 401) setStatus('Reached the server, but the API key was rejected.', false);
    else setStatus(`Unexpected response: ${res.status}`, false);
  } catch {
    setStatus('Could not reach the server. Check the URL.', false);
  }
});

load();
