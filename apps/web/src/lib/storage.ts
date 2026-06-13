import { serverEnv } from './env';
import { supabaseAdmin } from './supabase';

/** Uploads a file to the Supabase Storage bucket. */
export async function uploadObject(
  key: string,
  body: ArrayBuffer | Uint8Array | Blob,
  contentType: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .storage.from(serverEnv.supabase.bucket)
    .upload(key, body, { contentType, upsert: true });
  if (error) throw error;
}

export async function deleteObject(key: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .storage.from(serverEnv.supabase.bucket)
    .remove([key]);
  if (error) throw error;
}

/** Public URL for an object (requires the bucket to be public). */
export function publicUrlFor(key: string): string {
  const base = serverEnv.supabase.url.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${serverEnv.supabase.bucket}/${key}`;
}
