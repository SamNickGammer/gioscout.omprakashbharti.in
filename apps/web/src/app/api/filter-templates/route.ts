import { type NextRequest } from 'next/server';
import { desc } from 'drizzle-orm';
import { filterTemplateSchema } from '@geoscout/shared';
import { json, errorJson } from '@/lib/api';
import { db } from '@/db';
import { filterTemplates } from '@/db/schema';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await db
    .select()
    .from(filterTemplates)
    .orderBy(desc(filterTemplates.createdAt));
  return json(rows);
}

export async function POST(req: NextRequest) {
  const parsed = filterTemplateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorJson('Invalid payload', 422, { issues: parsed.error.flatten() });
  }
  const [row] = await db
    .insert(filterTemplates)
    .values({ name: parsed.data.name, filters: parsed.data.filters })
    .returning();
  return json(row);
}
