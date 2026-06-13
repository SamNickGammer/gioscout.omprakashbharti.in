import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { TeamManager } from '@/components/team/team-manager';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Add teammates so they can log in, run scans, and work the shared lead pool. Each member
          gets a personal API key (visible on their own Settings page) for the Chrome extension.
        </p>
      </div>
      <TeamManager currentUserId={session.userId} />
    </div>
  );
}
