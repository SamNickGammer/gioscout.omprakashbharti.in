import { opportunityTier } from '@geoscout/shared';
import { cn } from '@/lib/utils';

const TIER_STYLES = {
  high: { label: 'High', bar: 'bg-emerald-400', text: 'text-emerald-300' },
  medium: { label: 'Medium', bar: 'bg-amber-400', text: 'text-amber-300' },
  low: { label: 'Low', bar: 'bg-zinc-500', text: 'text-zinc-400' },
} as const;

export function OpportunityMeter({ score }: { score: number }) {
  const tier = opportunityTier(score);
  const s = TIER_STYLES[tier];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', s.bar)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('text-xs font-medium', s.text)}>{s.label}</span>
    </div>
  );
}
