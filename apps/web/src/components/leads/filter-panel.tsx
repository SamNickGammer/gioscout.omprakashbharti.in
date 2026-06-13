'use client';

import { Star, Globe, Phone, Mail, Instagram, Facebook, Linkedin, RotateCcw } from 'lucide-react';
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '@geoscout/shared';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DEFAULT_FILTERS, type FilterState } from './filter-state';
import '@/styles/rule-builder.scss';

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}

export function FilterPanel({ filters, onChange }: Props) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  const toggle = (key: keyof FilterState) =>
    onChange({ ...filters, [key]: !filters[key] });

  return (
    <div className="ruleBuilder">
      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">Search</span>
        <Input
          placeholder="Name, address or category…"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">Business</span>
        <Input
          placeholder="Category (e.g. Restaurant)"
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
        />
        <Input
          placeholder="City (e.g. Patna)"
          value={filters.city}
          onChange={(e) => set('city', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="State" value={filters.state} onChange={(e) => set('state', e.target.value)} />
          <Input placeholder="Country" value={filters.country} onChange={(e) => set('country', e.target.value)} />
        </div>
      </div>

      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">Reviews</span>
        <div className="ruleBuilder__range">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.reviewsMin}
            onChange={(e) => set('reviewsMin', e.target.value)}
          />
          <span className="dash">—</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.reviewsMax}
            onChange={(e) => set('reviewsMax', e.target.value)}
          />
        </div>
      </div>

      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">
          <Star className="h-3 w-3" /> Minimum rating
        </span>
        <div className="ruleBuilder__chips">
          {['', '4.0', '4.2', '4.5'].map((r) => (
            <button
              key={r || 'any'}
              type="button"
              className="ruleBuilder__chip"
              data-active={filters.ratingMin === r}
              onClick={() => set('ratingMin', r)}
            >
              {r ? `${r}+` : 'Any'}
            </button>
          ))}
        </div>
      </div>

      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">
          <Globe className="h-3 w-3" /> Website
        </span>
        <div className="ruleBuilder__chips">
          {(['any', 'has', 'none'] as const).map((w) => (
            <button
              key={w}
              type="button"
              className="ruleBuilder__chip"
              data-active={filters.website === w}
              onClick={() => set('website', w)}
            >
              {w === 'any' ? 'Any' : w === 'has' ? 'Has website' : 'No website'}
            </button>
          ))}
        </div>
      </div>

      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">Contact & social</span>
        <div className="ruleBuilder__chips">
          <Chip active={filters.hasPhone} onClick={() => toggle('hasPhone')} icon={<Phone className="h-3 w-3" />}>
            Phone
          </Chip>
          <Chip active={filters.hasEmail} onClick={() => toggle('hasEmail')} icon={<Mail className="h-3 w-3" />}>
            Email
          </Chip>
          <Chip active={filters.instagram} onClick={() => toggle('instagram')} icon={<Instagram className="h-3 w-3" />}>
            Instagram
          </Chip>
          <Chip active={filters.facebook} onClick={() => toggle('facebook')} icon={<Facebook className="h-3 w-3" />}>
            Facebook
          </Chip>
          <Chip active={filters.linkedin} onClick={() => toggle('linkedin')} icon={<Linkedin className="h-3 w-3" />}>
            LinkedIn
          </Chip>
        </div>
      </div>

      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">Opportunity</span>
        <div className="ruleBuilder__chips">
          {(['high', 'medium', 'low'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className="ruleBuilder__chip capitalize"
              data-active={filters.opportunity === t}
              onClick={() => set('opportunity', filters.opportunity === t ? undefined : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="ruleBuilder__group">
        <span className="ruleBuilder__group-title">Status</span>
        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) => set('status', v === 'all' ? undefined : (v as FilterState['status']))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {LEAD_STATUSES.filter((s) => s !== 'archived').map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-1 w-full"
        onClick={() => onChange({ ...DEFAULT_FILTERS })}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset filters
      </Button>
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn('ruleBuilder__chip inline-flex items-center gap-1')}
      data-active={active}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
