import Link from 'next/link';
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import {
  ArrowRight,
  SlidersHorizontal,
  Fingerprint,
  TrendingUp,
  Users,
  Archive,
  Bookmark,
  Star,
  Globe,
  MapPin,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import '@/styles/landing.scss';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});
const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: 'Rule-builder filters',
    body: 'Category, city, review min/max, rating, has/no website, contact & social presence — stack rules to surface intent.',
  },
  {
    icon: Fingerprint,
    title: 'Place-ID dedupe',
    body: 'Every business exists exactly once, keyed by its Google Place ID. Re-scan freely — it updates, never duplicates.',
  },
  {
    icon: TrendingUp,
    title: 'Review-growth tracking',
    body: 'Each scan snapshots reviews & rating, so you can see which businesses are heating up over time.',
  },
  {
    icon: Users,
    title: 'Team & attribution',
    body: 'Shared pool, but everything is stamped — who added a lead, who ran the scan, who owns it now.',
  },
  {
    icon: Archive,
    title: 'Soft-delete archive',
    body: 'Nothing is ever truly gone. Rejected today can be revisited in six months, fully recoverable.',
  },
  {
    icon: Bookmark,
    title: 'Saved templates',
    body: 'Save “High-Potential Restaurants” once, run it across Patna, Ranchi, Delhi without reconfiguring.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Scan',
    body: 'Run a search in Google Maps. The extension auto-scrolls every result, opens each place, and streams it to your database.',
  },
  {
    n: '02',
    title: 'Dedupe & store',
    body: 'Each business lands once, keyed by Place ID, with website, phone, address, rating and a growing scan history.',
  },
  {
    n: '03',
    title: 'Qualify',
    body: 'Slice the pool with the rule-builder — successful businesses with no website are your warmest leads.',
  },
];

export default function LandingPage() {
  return (
    <div className={`lp ${display.variable} ${body.variable} ${mono.variable} min-h-screen`}>
      <div className="lp-atmos" />
      <div className="lp-grid" />
      <div className="lp-contour" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo full size={30} />
        <nav className="flex items-center gap-7 text-sm">
          <a href="#how" className="hidden text-zinc-400 transition-colors hover:text-zinc-100 sm:inline">
            How it works
          </a>
          <a href="#features" className="hidden text-zinc-400 transition-colors hover:text-zinc-100 sm:inline">
            Features
          </a>
          <Link
            href="/login"
            className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 font-medium text-gold transition-colors hover:bg-gold/20"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p
              className="lp-mono lp-rise mb-6 text-xs uppercase tracking-[0.28em] text-gold/80"
              style={{ animationDelay: '0ms' }}
            >
              ◎ Field intelligence · dedupe · qualify
            </p>
            <h1
              className="lp-rise text-5xl leading-[1.04] md:text-[4.1rem]"
              style={{ animationDelay: '80ms' }}
            >
              Turn Google Maps into a{' '}
              <span className="text-gold-gradient italic">pipeline of qualified leads.</span>
            </h1>
            <p
              className="lp-rise mt-6 max-w-xl text-lg leading-relaxed text-zinc-400"
              style={{ animationDelay: '160ms' }}
            >
              GeoScout scans Maps, stores every business once, and hands you a rule-built list of
              prospects who are already successful — and ready for the website or automation you sell.
            </p>
            <div className="lp-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 font-semibold text-[#1c1607] shadow-lg shadow-gold/20 transition-[filter] hover:brightness-110"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 font-medium text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/5"
              >
                See how it works
              </a>
            </div>
            <p className="lp-mono lp-rise mt-8 text-xs text-zinc-500" style={{ animationDelay: '320ms' }}>
              LAT 25.5941 · LNG 85.1376 — open-source · self-hosted
            </p>
          </div>

          {/* Hero visual: radar + dossier card */}
          <div className="lp-rise relative mx-auto w-full max-w-md" style={{ animationDelay: '300ms' }}>
            <div className="lp-radar absolute -right-6 -top-10 h-64 w-64 opacity-70 md:h-80 md:w-80" />
            <div className="relative rounded-2xl border border-white/10 bg-[hsl(222_24%_9%/0.85)] p-5 shadow-2xl backdrop-blur-md">
              <div className="lp-mono mb-4 flex items-center justify-between text-[11px] uppercase tracking-widest text-zinc-500">
                <span>Recon · lead record</span>
                <span className="text-gold/70">0x39ed…1a</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="lp-pin mt-1 grid h-7 w-7 place-items-center bg-gold-gradient">
                  <MapPin className="h-3.5 w-3.5 rotate-45 text-[#1c1607]" />
                </span>
                <div>
                  <div className="text-xl text-zinc-100" style={{ fontFamily: 'var(--font-display)' }}>
                    Café Doré
                  </div>
                  <div className="text-xs text-zinc-500">Restaurant · Patna</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <Metric label="Reviews" value="1,943" />
                <Metric
                  label="Rating"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      4.5
                    </span>
                  }
                />
                <Metric
                  label="Website"
                  value={<span className="inline-flex items-center gap-1 text-rose-300"><Globe className="h-3.5 w-3.5" />None</span>}
                />
              </div>

              <div className="mt-5">
                <div className="lp-mono mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                  <span>Opportunity</span>
                  <span className="text-emerald-300">High · 88</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-emerald-400/70 to-gold" />
                </div>
              </div>

              <div className="lp-mono mt-5 border-t border-white/5 pt-3 text-[11px] text-zinc-500">
                ↳ successful · no website · prime for a redesign pitch
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="mt-20 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-3">
          {[
            ['One record per business', 'deduped by Google Place ID'],
            ['Nothing is ever deleted', 'soft-delete archive, fully recoverable'],
            ['Filter by intent', 'reviews · rating · no-website · status'],
          ].map(([t, s]) => (
            <div key={t} className="bg-[hsl(222_24%_7%)] px-6 py-5">
              <div className="text-sm font-semibold text-zinc-100">{t}</div>
              <div className="lp-mono mt-1 text-xs text-zinc-500">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">
          From a Maps search to a qualified shortlist — in three moves.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div
                className="lp-mono text-5xl text-gold/25"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {s.n}
              </div>
              <h3 className="mt-3 text-xl text-zinc-100">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionLabel>The toolkit</SectionLabel>
        <h2 className="mt-3 max-w-2xl text-3xl md:text-4xl">
          Built for agencies who sell to local businesses.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors hover:border-gold/30 hover:bg-gold/[0.04]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-gold/20 bg-gold/10 text-gold">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg text-zinc-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/[0.10] via-transparent to-transparent px-8 py-14 text-center md:py-20">
          <div className="lp-radar absolute -bottom-40 left-1/2 h-80 w-80 -translate-x-1/2 opacity-40" />
          <h2 className="relative mx-auto max-w-2xl text-3xl md:text-5xl">
            Start scouting your market.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-zinc-400">
            Spin up your own GeoScout, point the extension at Google Maps, and watch qualified leads
            fill your database.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 font-semibold text-[#1c1607] shadow-lg shadow-gold/20 transition-[filter] hover:brightness-110"
            >
              Sign in to your dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/SamNickGammer/gioscout.omprakashbharti.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3 font-medium text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/5"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo full size={24} />
          <p className="lp-mono text-xs text-zinc-500">Open-source · MIT · Built with Next.js + Supabase</p>
          <div className="flex gap-5 text-sm text-zinc-400">
            <a href="#how" className="hover:text-zinc-100">How it works</a>
            <a href="#features" className="hover:text-zinc-100">Features</a>
            <Link href="/login" className="hover:text-gold">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] py-2">
      <div className="text-sm font-semibold text-zinc-100">{value}</div>
      <div className="lp-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp-mono inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold/80">
      <span className="h-px w-6 bg-gold/40" />
      {children}
    </div>
  );
}
