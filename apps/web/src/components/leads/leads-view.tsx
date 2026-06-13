'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import type { Business } from '@/db/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { formatNumber } from '@/lib/utils';
import { FilterPanel } from './filter-panel';
import { LeadsTable } from './leads-table';
import { LeadDetailSheet } from './lead-detail-sheet';
import { TemplatesBar } from './templates-bar';
import { DEFAULT_FILTERS, countActiveFilters, filtersToParams, type FilterState } from './filter-state';

const PAGE_SIZE = 50;

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Recently updated' },
  { value: 'reviewCount', label: 'Most reviews' },
  { value: 'rating', label: 'Highest rating' },
  { value: 'opportunityScore', label: 'Best opportunity' },
  { value: 'name', label: 'Name (A–Z)' },
] as const;

export function LeadsView({ archived = false }: { archived?: boolean }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const debounced = useDebounce(filters, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtersToParams(debounced, page, PAGE_SIZE, archived);
      const res = await fetch(`/api/businesses?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.rows);
      setTotal(data.total);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debounced, page, archived]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Filter rail */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-gold" /> Rule Builder
            </span>
            {activeCount > 0 && <Badge tone="gold">{activeCount} active</Badge>}
          </div>
          <FilterPanel filters={filters} onChange={setFilters} />
        </Card>
      </div>

      {/* Results */}
      <div className="min-w-0 space-y-4">
        {!archived && <TemplatesBar current={filters} onApply={setFilters} />}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${formatNumber(total)} ${archived ? 'archived' : ''} lead${total === 1 ? '' : 's'}`}
          </p>
          <Select
            value={filters.sort}
            onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as FilterState['sort'] }))}
          >
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="overflow-hidden">
          <LeadsTable rows={rows} loading={loading} onSelect={setSelectedId} />
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <LeadDetailSheet businessId={selectedId} onClose={() => setSelectedId(null)} onUpdated={load} />
    </div>
  );
}
