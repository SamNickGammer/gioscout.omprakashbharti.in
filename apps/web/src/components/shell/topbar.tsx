'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import type { UserRole } from '@geoscout/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar({ name, email, role }: { name: string; email: string; role: UserRole }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="text-sm text-muted-foreground">
        Lead Intelligence Dashboard
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-bold text-gold-foreground">
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div>{name}</div>
            <div className="text-[11px] font-normal text-muted-foreground">{email}</div>
            <div className="mt-1 text-[11px] font-normal capitalize text-gold">{role}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
