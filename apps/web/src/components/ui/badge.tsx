import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      tone: {
        gold: 'border-gold/30 bg-gold/10 text-gold',
        sky: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
        amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
        emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
        zinc: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { tone: 'zinc' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
