import { getDashboardStats } from '@/lib/queries';
import { StatCards } from '@/components/leads/stat-cards';
import { LeadsView } from '@/components/leads/leads-view';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Your continuously-refreshed prospect database. Slice it with the rule-builder.
        </p>
      </div>

      <StatCards stats={stats} />
      <LeadsView />
    </div>
  );
}
