import { randomBytes } from 'node:crypto';

/** Personal extension API key, e.g. gsk_3f9a… (32 hex chars). */
export function generateApiKey(): string {
  return `gsk_${randomBytes(16).toString('hex')}`;
}
