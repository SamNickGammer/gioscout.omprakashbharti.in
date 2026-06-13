import { Chrome, KeyRound, Link2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const r2Configured = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Connect the Chrome extension and review integrations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-5 w-5 text-gold" /> Chrome extension
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Build the extension (<code className="rounded bg-muted px-1.5 py-0.5">yarn ext:build</code>), load{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">apps/extension/dist</code> as an unpacked extension in{' '}
            <code className="rounded bg-muted px-1.5 py-0.5">chrome://extensions</code>, then set these in its Options:
          </p>
          <Field icon={<Link2 className="h-4 w-4" />} label="API base URL" value={appUrl} />
          <Field
            icon={<KeyRound className="h-4 w-4" />}
            label="Ingest API key"
            value="The INGEST_API_KEY from your environment"
          />
          <Separator />
          <p className="text-xs text-muted-foreground">
            Open Google Maps, run a search like “restaurant in Patna”, and click{' '}
            <span className="font-medium text-foreground">Start scan</span> in the GeoScout popup. Leads stream
            here automatically, deduped by Google Place ID.
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
          <Row label="Database" value="Neon Postgres" ok />
          <Row label="File storage (R2)" value={r2Configured ? 'Configured' : 'Not configured'} ok={r2Configured} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/60 p-3">
      <div className="mb-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="font-mono text-sm">{value}</div>
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
