/** Centralized, validated access to server env vars. Fail fast & loud. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const serverEnv = {
  get jwtSecret() {
    return required('JWT_SECRET');
  },
  get authEmail() {
    return required('AUTH_EMAIL');
  },
  get authPasswordHash() {
    return required('AUTH_PASSWORD_HASH');
  },
  get ingestApiKey() {
    return required('INGEST_API_KEY');
  },
  r2: {
    get accountId() {
      return required('R2_ACCOUNT_ID');
    },
    get accessKeyId() {
      return required('R2_ACCESS_KEY_ID');
    },
    get secretAccessKey() {
      return required('R2_SECRET_ACCESS_KEY');
    },
    get bucket() {
      return process.env.R2_BUCKET ?? 'geoscout';
    },
    get publicUrl() {
      return process.env.R2_PUBLIC_URL ?? '';
    },
    get configured() {
      return !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY
      );
    },
  },
};
