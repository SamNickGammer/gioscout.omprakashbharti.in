import { LEAD_STATUS_LABELS, LEAD_STATUS_TONE, type LeadStatus } from '@geoscout/shared';
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: LeadStatus }) {
  const tone = LEAD_STATUS_TONE[status] as
    | 'gold'
    | 'sky'
    | 'amber'
    | 'violet'
    | 'emerald'
    | 'rose'
    | 'zinc';
  return <Badge tone={tone}>{LEAD_STATUS_LABELS[status]}</Badge>;
}
