import { Building2, Globe2, Flame, BadgeCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { DashboardStats } from '@/lib/queries';

const ITEMS = [
  { key: 'total', label: 'Total leads', icon: Building2, tone: 'text-sky-300' },
  { key: 'noWebsite', label: 'No website', icon: Globe2, tone: 'text-rose-300' },
  { key: 'highOpportunity', label: 'High opportunity', icon: Flame, tone: 'text-amber-300' },
  { key: 'clients', label: 'Clients', icon: BadgeCheck, tone: 'text-emerald-300' },
] as const;

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ITEMS.map(({ key, label, icon: Icon, tone }) => (
        <Card key={key} className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
            <Icon className={`h-4 w-4 ${tone}`} />
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {formatNumber(stats[key])}
          </div>
        </Card>
      ))}
    </div>
  );
}
