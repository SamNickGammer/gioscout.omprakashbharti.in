'use client';

import { useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export function CopyField({
  label,
  value,
  icon,
  secret,
  hint,
}: {
  label: string;
  value: string;
  icon: 'link' | 'key';
  secret?: boolean;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 1500);
  }

  const Icon = icon === 'key' ? KeyRound : Link2;
  const display = shown ? value : '•'.repeat(Math.min(value.length, 28));

  return (
    <div className="rounded-md border border-border/60 bg-card/60 p-3">
      <div className="mb-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate font-mono text-sm">{display}</code>
        {secret && (
          <button onClick={() => setShown((s) => !s)} className="text-muted-foreground hover:text-foreground">
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        <button onClick={copy} className="text-muted-foreground hover:text-gold">
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
