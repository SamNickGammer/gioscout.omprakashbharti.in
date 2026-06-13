'use client';

import { Globe, Phone, Star } from 'lucide-react';
import type { Business } from '@/db/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';
import { StatusBadge } from './status-badge';
import { OpportunityMeter } from './opportunity-meter';

interface Props {
  rows: Business[];
  loading: boolean;
  onSelect: (id: string) => void;
}

export function LeadsTable({ rows, loading, onSelect }: Props) {
  if (loading) return <LeadsTableSkeleton />;

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <p className="text-sm font-medium">No leads match these filters</p>
        <p className="text-xs text-muted-foreground">
          Adjust the rule-builder, or run a scan from the Chrome extension to collect leads.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Business</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Reviews</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Web</TableHead>
          <TableHead>Opportunity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((b) => (
          <TableRow key={b.id} className="cursor-pointer" onClick={() => onSelect(b.id)}>
            <TableCell>
              <div className="font-medium text-foreground">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.category ?? '—'}</div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {b.city ?? '—'}
              {b.state ? `, ${b.state}` : ''}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatNumber(b.reviewCount)}
            </TableCell>
            <TableCell>
              {b.rating ? (
                <span className="inline-flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                  {b.rating}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {b.hasWebsite ? (
                <Globe className="h-4 w-4 text-emerald-400" />
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-xs text-rose-300"
                  title="No website — prime lead"
                >
                  <Globe className="h-4 w-4 opacity-40" />
                </span>
              )}
            </TableCell>
            <TableCell>
              <OpportunityMeter score={b.opportunityScore} />
            </TableCell>
            <TableCell>
              <StatusBadge status={b.status} />
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground">
              {formatRelativeTime(b.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LeadsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'grid grid-cols-[2fr_1fr_0.6fr_0.6fr_0.4fr_1fr_0.8fr_0.6fr] items-center gap-3 rounded-md px-2 py-3',
          )}
        >
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-10 justify-self-end" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-2 w-16" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-12 justify-self-end" />
        </div>
      ))}
    </div>
  );
}
