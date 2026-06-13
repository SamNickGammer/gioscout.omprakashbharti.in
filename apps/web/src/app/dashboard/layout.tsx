import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <Sidebar role={session.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={session.name} email={session.email} role={session.role} />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
