#!/usr/bin/env node
// Create (or seed) a user directly in the DB.
// Usage: node scripts/create-user.mjs <email> <name> <password> [admin|member]
import { config } from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

config({ path: '.env.local' });

const [, , email, name, password, role = 'member'] = process.argv;
if (!email || !name || !password) {
  console.error('Usage: node scripts/create-user.mjs <email> <name> <password> [admin|member]');
  process.exit(1);
}
if (!['admin', 'member'].includes(role)) {
  console.error('Role must be "admin" or "member"');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set (apps/web/.env.local).');
  process.exit(1);
}

const sql = postgres(url, { prepare: false });
const apiKey = `gsk_${randomBytes(16).toString('hex')}`;
const passwordHash = bcrypt.hashSync(password, 10);

try {
  const existing = await sql`select id from users where lower(email) = ${email.toLowerCase()} limit 1`;
  if (existing.length) {
    console.error(`A user with email ${email} already exists.`);
    process.exit(1);
  }
  const [row] = await sql`
    insert into users (email, name, password_hash, role, api_key)
    values (${email}, ${name}, ${passwordHash}, ${role}, ${apiKey})
    returning id, email, name, role
  `;
  console.log('\n✓ User created:\n');
  console.log(`  name:    ${row.name}`);
  console.log(`  email:   ${row.email}`);
  console.log(`  role:    ${row.role}`);
  console.log(`  api key: ${apiKey}   (paste into the Chrome extension Options)\n`);
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
