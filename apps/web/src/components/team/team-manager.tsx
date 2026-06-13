'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, UserPlus, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { PublicUser } from '@geoscout/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export function TeamManager({ currentUserId }: { currentUserId: string }) {
  const [members, setMembers] = useState<PublicUser[] | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch('/api/users');
    if (res.ok) setMembers(await res.json());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Could not create user');
      toast.success(`${name} added. Share their temp password so they can sign in.`);
      setEmail('');
      setName('');
      setPassword('');
      setRole('member');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(id: string, label: string) {
    if (!confirm(`Remove ${label}? Their leads/comments stay but become unattributed.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('User removed');
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? 'Could not remove user');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members === null ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-gold-foreground">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {m.name}
                        {m.id === currentUserId && <Badge tone="gold">You</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={m.role === 'admin' ? 'violet' : 'zinc'}>
                      {m.role === 'admin' ? (
                        <Shield className="mr-1 h-3 w-3" />
                      ) : (
                        <UserIcon className="mr-1 h-3 w-3" />
                      )}
                      {m.role}
                    </Badge>
                    {m.id !== currentUserId && (
                      <button
                        onClick={() => removeUser(m.id, m.name)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit ring-gold">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4 text-gold" /> Add member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addUser} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-email">Email</Label>
              <Input
                id="m-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-pass">Temp password</Label>
              <Input
                id="m-pass"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create member
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
