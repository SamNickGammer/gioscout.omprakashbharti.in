#!/usr/bin/env node
// Usage: yarn workspace @geoscout/web auth:hash "your-password"
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: yarn workspace @geoscout/web auth:hash "your-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nAdd this to apps/web/.env.local:\n');
console.log(`AUTH_PASSWORD_HASH="${hash}"\n`);
