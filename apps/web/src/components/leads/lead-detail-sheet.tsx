'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Star,
  Trash2,
  Upload,
  Loader2,
  Archive,
  ArchiveRestore,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from '@geoscout/shared';
import type { Attachment, Business, ScanHistoryRow } from '@/db/schema';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { OpportunityMeter } from './opportunity-meter';
import { Sparkline } from './sparkline';

interface Detail {
  business: Business;
  history: ScanHistoryRow[];
  attachments: Attachment[];
}

interface Props {
  businessId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function LeadDetailSheet({ businessId, onClose, onUpdated }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data: Detail = await res.json();
      setDetail(data);
      setNotes(data.business.notes ?? '');
    } catch {
      toast.error('Could not load lead');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (businessId) load(businessId);
    else setDetail(null);
  }, [businessId, load]);

  async function patch(body: Record<string, unknown>) {
    if (!businessId) return;
    const res = await fetch(`/api/businesses/${businessId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast.error('Update failed');
      return;
    }
    await load(businessId);
    onUpdated();
  }

  async function saveNotes() {
    setSavingNotes(true);
    await patch({ notes });
    setSavingNotes(false);
    toast.success('Notes saved');
  }

  async function changeStatus(status: LeadStatus) {
    await patch({ status });
    toast.success(`Marked ${LEAD_STATUS_LABELS[status]}`);
  }

  async function toggleArchive() {
    if (!detail) return;
    await patch({ isArchived: !detail.business.isArchived });
    toast.success(detail.business.isArchived ? 'Restored' : 'Archived');
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    setUploading(true);
    try {
      const signRes = await fetch('/api/attachments/sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ businessId, fileName: file.name, mime: file.type || 'application/octet-stream' }),
      });
      if (!signRes.ok) {
        const data = await signRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Could not get upload URL');
      }
      const { uploadUrl, key } = await signRes.json();
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error('Upload to storage failed');
      await fetch('/api/attachments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ businessId, key, fileName: file.name, mime: file.type, size: file.size }),
      });
      toast.success('File attached');
      await load(businessId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function deleteAttachment(id: string) {
    await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
    if (businessId) await load(businessId);
  }

  const b = detail?.business;
  const reviewSeries = detail?.history.map((h) => h.reviewCount) ?? [];

  return (
    <Sheet open={!!businessId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        {loading || !b ? (
          <DetailSkeleton />
        ) : (
          <>
            <SheetHeader className="px-0">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <SheetTitle className="text-xl">{b.name}</SheetTitle>
                  <SheetDescription>{b.category ?? 'Uncategorized'}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-6 pb-10">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Reviews" value={formatNumber(b.reviewCount)} />
                <Stat
                  label="Rating"
                  value={
                    b.rating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        {b.rating}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <Stat label="Score" value={<OpportunityMeter score={b.opportunityScore} />} />
              </div>

              {/* Status + archive */}
              <div className="flex items-center gap-2">
                <Select value={b.status} onValueChange={(v) => changeStatus(v as LeadStatus)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={toggleArchive} title={b.isArchived ? 'Restore' : 'Archive'}>
                  {b.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
              </div>

              <Separator />

              {/* Contact */}
              <div className="space-y-2.5 text-sm">
                <ContactRow icon={<MapPin className="h-4 w-4" />} value={b.address} />
                <ContactRow
                  icon={<Phone className="h-4 w-4" />}
                  value={b.phone}
                  href={b.phone ? `tel:${b.phone}` : undefined}
                />
                <ContactRow
                  icon={<Mail className="h-4 w-4" />}
                  value={b.email}
                  href={b.email ? `mailto:${b.email}` : undefined}
                />
                <ContactRow
                  icon={<Globe className="h-4 w-4" />}
                  value={b.website ?? 'No website'}
                  href={b.website ?? undefined}
                  highlight={!b.hasWebsite}
                />
                {b.googleUrl && (
                  <a
                    href={b.googleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
                  </a>
                )}
              </div>

              <Separator />

              {/* Review growth */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Review growth
                </h4>
                <div className="rounded-lg border border-border/60 bg-card/60 p-3">
                  <Sparkline values={reviewSeries} width={460} className="w-full" />
                  <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>First seen {formatRelativeTime(b.firstSeenAt)}</span>
                    <span>Last scan {formatRelativeTime(b.lastScannedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Call notes, owner name, quote details…"
                  rows={4}
                />
                <Button size="sm" className="mt-2" onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save notes
                </Button>
              </div>

              <Separator />

              {/* Attachments */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Attachments
                  </h4>
                  <input ref={fileInput} type="file" hidden onChange={onPickFile} />
                  <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Upload
                  </Button>
                </div>
                {detail.attachments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No files yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {detail.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-card/60 px-3 py-2 text-sm"
                      >
                        <span className="inline-flex items-center gap-2 truncate">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">{a.fileName}</span>
                        </span>
                        <button
                          onClick={() => deleteAttachment(a.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function ContactRow({
  icon,
  value,
  href,
  highlight,
}: {
  icon: React.ReactNode;
  value?: string | null;
  href?: string;
  highlight?: boolean;
}) {
  if (!value) return null;
  const content = (
    <span className={highlight ? 'text-rose-300' : 'text-foreground'}>{value}</span>
  );
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
