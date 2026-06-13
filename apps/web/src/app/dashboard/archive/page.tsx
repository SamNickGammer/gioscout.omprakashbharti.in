import { LeadsView } from '@/components/leads/leads-view';

export const dynamic = 'force-dynamic';

export default function ArchivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
        <p className="text-sm text-muted-foreground">
          Soft-deleted leads. Nothing is ever truly gone — restore any record from its drawer.
        </p>
      </div>
      <LeadsView archived />
    </div>
  );
}
