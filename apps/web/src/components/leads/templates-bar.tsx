'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DEFAULT_FILTERS, type FilterState } from './filter-state';

interface Template {
  id: string;
  name: string;
  filters: Partial<FilterState>;
}

interface Props {
  current: FilterState;
  onApply: (f: FilterState) => void;
}

export function TemplatesBar({ current, onApply }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  async function refresh() {
    const res = await fetch('/api/filter-templates');
    if (res.ok) setTemplates(await res.json());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!name.trim()) return;
    const res = await fetch('/api/filter-templates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), filters: current }),
    });
    if (res.ok) {
      toast.success('Template saved');
      setName('');
      setOpen(false);
      refresh();
    } else {
      toast.error('Could not save template');
    }
  }

  async function remove(id: string) {
    await fetch(`/api/filter-templates/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Bookmark className="h-3.5 w-3.5" /> Templates
      </span>

      {templates.length === 0 && (
        <span className="text-xs text-muted-foreground">None saved yet</span>
      )}

      {templates.map((t) => (
        <span
          key={t.id}
          className="group inline-flex items-center gap-1 rounded-full border border-border bg-card/60 py-1 pl-3 pr-1 text-xs transition-colors hover:border-gold/40"
        >
          <button
            onClick={() => onApply({ ...DEFAULT_FILTERS, ...t.filters })}
            className="font-medium hover:text-gold"
          >
            {t.name}
          </button>
          <button
            onClick={() => remove(t.id)}
            className="rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Save current
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save filter template</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="e.g. High-Potential Restaurants"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
