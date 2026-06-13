import { desc } from 'drizzle-orm';
import { Radar } from 'lucide-react';
import { db } from '@/db';
import { scanJobs } from '@/db/schema';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TONE = {
  running: 'amber',
  completed: 'emerald',
  failed: 'rose',
} as const;

export default async function ScansPage() {
  const jobs = await db.select().from(scanJobs).orderBy(desc(scanJobs.startedAt)).limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scan Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Every run from the extension, with new vs updated counts.
        </p>
      </div>

      <Card className="overflow-hidden">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <Radar className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No scans yet</p>
            <p className="text-xs text-muted-foreground">
              Run a search in Google Maps with the GeoScout extension to populate this.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Query</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Found</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.query}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{j.area ?? '—'}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[j.status]}>{j.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(j.foundCount)}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-300">
                    {formatNumber(j.newCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sky-300">
                    {formatNumber(j.updatedCount)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatRelativeTime(j.startedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
