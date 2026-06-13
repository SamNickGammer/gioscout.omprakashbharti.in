/**
 * Lead lifecycle status. A business is NEVER hard-deleted — it moves through
 * these states. `archived` + the `isArchived` flag drive the soft-delete view.
 */
export const LEAD_STATUSES = [
  'active',
  'contacted',
  'interested',
  'quotation_sent',
  'client',
  'rejected',
  'archived',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  active: 'Active',
  contacted: 'Contacted',
  interested: 'Interested',
  quotation_sent: 'Quotation Sent',
  client: 'Client',
  rejected: 'Rejected',
  archived: 'Archived',
};

/** Tailwind/token color hints per status, used by the dashboard badges. */
export const LEAD_STATUS_TONE: Record<LeadStatus, string> = {
  active: 'sky',
  contacted: 'amber',
  interested: 'violet',
  quotation_sent: 'gold',
  client: 'emerald',
  rejected: 'rose',
  archived: 'zinc',
};

export const OPPORTUNITY_TIERS = ['high', 'medium', 'low'] as const;
export type OpportunityTier = (typeof OPPORTUNITY_TIERS)[number];
