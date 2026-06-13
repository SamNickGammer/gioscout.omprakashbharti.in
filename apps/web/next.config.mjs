import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // packages/shared ships raw TS; let Next transpile it.
  transpilePackages: ['@geoscout/shared'],
  // We're in a monorepo; pin tracing to the repo root (silences the
  // multi-lockfile warning from a stray parent lockfile).
  outputFileTracingRoot: repoRoot,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
