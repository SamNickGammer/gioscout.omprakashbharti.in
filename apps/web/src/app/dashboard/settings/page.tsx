import { eq } from 'drizzle-orm';
import { Chrome, KeyRound, Link2, Database } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CopyField } from '@/components/team/copy-field';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const storageConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [me] = session
    ? await db.select({ apiKey: users.apiKey }).from(users).where(eq(users.id, session.userId)).limit(1)
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Connect the Chrome extension and review integrations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5 text-gold" /> Your Chrome extension
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Build the extension (<code className="rounded bg-muted px-1.5 py-0.5">yarn ext:build</code>), load{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">apps/extension/dist</code> as an unpacked extension in{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">chrome://extensions</code>, then paste these into its Options:
          </p>
          <CopyField label="API base URL" value={appUrl} icon="link" />
          <CopyField
            label="Your personal API key"
            value={me?.apiKey ?? '—'}
            icon="key"
            secret
            hint="Unique to you — scans you run are credited to your account. Don't share it."
          />
          <Separator />
          <p className="text-xs text-muted-foreground">
            Open Google Maps, run a search like “restaurant in Patna”, and click{' '}
            <span className="font-medium text-foreground">Start scan</span> in the GeoScout popup. Leads stream
            into the shared pool, deduped by Google Place ID and tagged as added by you.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-gold" /> Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Database" value="Supabase Postgres" ok />
          <Row
            label="File storage"
            value={storageConfigured ? 'Supabase Storage' : 'Not configured'}
            ok={storageConfigured}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={ok ? 'text-emerald-300' : 'text-amber-300'}>{value}</span>
    </div>
  );
}
