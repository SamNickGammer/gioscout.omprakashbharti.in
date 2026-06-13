'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Radar, Archive, Settings, Users } from 'lucide-react';
import type { UserRole } from '@geoscout/shared';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Leads', icon: LayoutGrid, adminOnly: false },
  { href: '/scans', label: 'Scan Jobs', icon: Radar, adminOnly: false },
  { href: '/archive', label: 'Archive', icon: Archive, adminOnly: false },
  { href: '/team', label: 'Team', icon: Users, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, adminOnly: false },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const nav = NAV.filter((item) => !item.adminOnly || role === 'admin');
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border/70 bg-card/40 px-3 py-5 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <Logo size={32} />
        <span className="text-lg font-semibold tracking-tight text-gold-gradient">
          GeoScout
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-gold/10 text-gold ring-1 ring-gold/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 text-xs text-muted-foreground">
        <p>v0.1.0 · single-query engine</p>
      </div>
    </aside>
  );
}
