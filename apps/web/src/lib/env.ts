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
  supabase: {
    get url() {
      return required('NEXT_PUBLIC_SUPABASE_URL');
    },
    get anonKey() {
      return (
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        ''
      );
    },
    get serviceRoleKey() {
      return required('SUPABASE_SERVICE_ROLE_KEY');
    },
    get bucket() {
      return process.env.SUPABASE_STORAGE_BUCKET ?? 'geoscout';
    },
    /** Storage needs the service-role key for server-side upload/delete. */
    get configured() {
      return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    },
  },
};
