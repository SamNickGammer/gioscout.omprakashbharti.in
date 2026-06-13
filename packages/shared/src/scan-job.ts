import { z } from 'zod';

export const SCAN_JOB_STATUSES = ['running', 'completed', 'failed'] as const;
export type ScanJobStatus = (typeof SCAN_JOB_STATUSES)[number];

/** Opens a scan job when the extension starts a run. */
export const openScanJobSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  source: z.string().optional().default('extension'),
});
export type OpenScanJob = z.infer<typeof openScanJobSchema>;

/** Closes a scan job with final counts. */
export const closeScanJobSchema = z.object({
  status: z.enum(['completed', 'failed']),
  foundCount: z.number().int().min(0).optional(),
  newCount: z.number().int().min(0).optional(),
  updatedCount: z.number().int().min(0).optional(),
});
export type CloseScanJob = z.infer<typeof closeScanJobSchema>;
