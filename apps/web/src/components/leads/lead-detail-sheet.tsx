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
  Send,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
  type PublicUser,
} from '@geoscout/shared';
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
import { Badge } from '@/components/ui/badge';
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

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  authorId: string | null;
  authorName: string | null;
}

interface Detail {
  business: Business;
  createdByName: string | null;
  assignedToName: string | null;
  history: ScanHistoryRow[];
  attachments: Attachment[];
}

interface Props {
  businessId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

const UNASSIGNED = '__unassigned__';

export function LeadDetailSheet({ businessId, onClose, onUpdated }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [dRes, cRes] = await Promise.all([
        fetch(`/api/businesses/${id}`),
        fetch(`/api/businesses/${id}/comments`),
      ]);
      if (!dRes.ok) throw new Error('Failed to load');
      setDetail(await dRes.json());
      setComments(cRes.ok ? await cRes.json() : []);
    } catch {
      toast.error('Could not load lead');
    } finally {
      setLoading(false);
    }
  }, []);

  // Members list (for the assignee dropdown) — fetched once.
  useEffect(() => {
    fetch('/api/users')
      .then((r) => (r.ok ? r.json() : []))
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  useEffect(() => {
    if (businessId) load(businessId);
    else {
      setDetail(null);
      setComments([]);
    }
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

  async function changeStatus(status: LeadStatus) {
    await patch({ status });
    toast.success(`Marked ${LEAD_STATUS_LABELS[status]}`);
  }

  async function changeAssignee(value: string) {
    await patch({ assignedTo: value === UNASSIGNED ? null : value });
    toast.success('Assignment updated');
  }

  async function toggleArchive() {
    if (!detail) return;
    await patch({ isArchived: !detail.business.isArchived });
    toast.success(detail.business.isArchived ? 'Restored' : 'Archived');
  }

  async function postComment() {
    if (!businessId || !newComment.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      if (!res.ok) throw new Error();
      setNewComment('');
      const cRes = await fetch(`/api/businesses/${businessId}/comments`);
      setComments(cRes.ok ? await cRes.json() : []);
    } catch {
      toast.error('Could not post comment');
    } finally {
      setPosting(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('businessId', businessId);
      const res = await fetch('/api/attachments', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Upload failed');
      }
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
              <div className="pr-8">
                <SheetTitle className="text-xl">{b.name}</SheetTitle>
                <SheetDescription>{b.category ?? 'Uncategorized'}</SheetDescription>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detail.createdByName && (
                    <Badge tone="zinc">Added by {detail.createdByName}</Badge>
                  )}
                  {detail.assignedToName && (
                    <Badge tone="gold">
                      <UserCheck className="mr-1 h-3 w-3" />
                      {detail.assignedToName}
                    </Badge>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-6 pb-10">
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

              {/* Status + assignee + archive */}
              <div className="space-y-2">
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
                <Select value={b.assignedTo ?? UNASSIGNED} onValueChange={changeAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Contact */}
              <div className="space-y-2.5 text-sm">
                <ContactRow icon={<MapPin className="h-4 w-4" />} value={b.address} />
                <ContactRow icon={<Phone className="h-4 w-4" />} value={b.phone} href={b.phone ? `tel:${b.phone}` : undefined} />
                <ContactRow icon={<Mail className="h-4 w-4" />} value={b.email} href={b.email ? `mailto:${b.email}` : undefined} />
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

              <Separator />

              {/* Comments */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comments
                </h4>
                <div className="space-y-3">
                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground">No comments yet. Start the thread.</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/60 bg-card/60 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gold">
                          {c.authorName ?? 'Former member'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment — call notes, owner name, next step…"
                    rows={3}
                  />
                  <Button size="sm" onClick={postComment} disabled={posting || !newComment.trim()}>
                    {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Post comment
                  </Button>
                </div>
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
  const content = <span className={highlight ? 'text-rose-300' : 'text-foreground'}>{value}</span>;
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
