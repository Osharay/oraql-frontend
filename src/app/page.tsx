import Link from 'next/link';
import {
  Trophy,
  ArrowRight,
  Boxes,
  CircleCheck,
  Flame,
  Gauge,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-warm-sand/60 bg-warm-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-oracle-sm bg-dark-ink">
              <Trophy className="h-5 w-5 text-oracle-gold" />
            </div>
            <span className="font-display text-display-sm tracking-tight text-dark-ink">
              OraQL_
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-body-sm font-medium text-txt-secondary transition-colors hover:text-txt-primary"
            >
              Sign In
            </Link>
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-2 rounded-oracle-sm bg-dark-ink px-4 py-2 text-body-sm font-semibold text-txt-inverse transition-all hover:bg-dark-charcoal"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero (Warm Cream Surface) ─── */}
      <section className="relative overflow-hidden bg-warm-cream pt-32 pb-20">
        <span
          className="pointer-events-none absolute -right-16 -top-20 select-none font-display font-bold text-warm-sand"
          style={{ fontSize: '32rem', lineHeight: '0.8', opacity: 0.5 }}
        >
          O
        </span>
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-warm-stone bg-warm-white px-4 py-1.5 text-caption font-semibold uppercase tracking-widest text-oracle-gold-dark">
            <ShieldCheck className="h-3 w-3" />
            Evidence, not tips
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-display-xl tracking-tight text-dark-ink">
            Smarter bets start with{' '}
            <span className="text-oracle-gradient">proof.</span>
          </h1>

          <p className="mt-6 max-w-xl text-body-lg leading-relaxed text-txt-secondary">
            OraQL_ finds the team patterns that happen far more often than normal, gives
            each one an honest chance of landing, and shows its full record — wins and
            losses — so you can judge it before you stake a naira.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-2 rounded-oracle-md bg-oracle-gold px-6 py-3 font-display text-body-lg font-semibold text-dark-ink transition-all hover:bg-oracle-gold-light hover:shadow-glow"
            >
              Start your free trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-oracle-md border border-warm-stone bg-warm-white px-6 py-3 font-display text-body-lg font-medium text-txt-primary transition-all hover:bg-warm-cream hover:border-warm-taupe"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 text-body-sm text-txt-tertiary">
            <span>
              <strong className="text-txt-secondary">2-day</strong> free trial
            </span>
            <span>
              <strong className="text-txt-secondary">Every pick</strong> locked before kickoff
            </span>
            <span>
              <strong className="text-txt-secondary">Full record</strong>, losses included
            </span>
          </div>
        </div>
      </section>

      {/* ─── How It Works (Dark Ink Surface) ─── */}
      <section className="bg-dark-ink py-20">
        <div className="mx-auto max-w-6xl px-6">
          <span
            className="pointer-events-none absolute right-0 select-none font-display font-bold text-white"
            style={{ fontSize: '20rem', lineHeight: '0.8', opacity: 0.03 }}
          >
            H
          </span>
          <p className="text-caption font-semibold uppercase tracking-widest text-oracle-gold">
            How It Works
          </p>
          <h2 className="mt-2 font-display text-display-md tracking-tight text-txt-inverse">
            From pattern to proof in three steps
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Find the patterns',
                desc: 'Every day OraQL_ checks teams across goals, results, corners, cards and more for patterns that happen far more often than usual. Lucky runs are filtered out, not sold to you.',
              },
              {
                step: '02',
                icon: Gauge,
                title: 'Give an honest chance',
                desc: 'Each pick gets a chance you can trust: short or lucky records are pulled back down, nothing is shown above 90%, and you see the price at which it is worth backing.',
              },
              {
                step: '03',
                icon: CircleCheck,
                title: 'Prove it',
                desc: 'Every pick is locked before kickoff and settled after the final whistle. The record shows how often OraQL_ lands against what it expected — win or lose.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group rounded-oracle-lg border border-dark-graphite bg-dark-charcoal p-6 transition-all hover:border-dark-slate"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-mono text-caption font-bold text-oracle-gold">
                    {item.step}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-oracle-sm bg-oracle-gold/15">
                    <item.icon className="h-5 w-5 text-oracle-gold" />
                  </div>
                </div>
                <h3 className="font-display text-heading tracking-tight text-txt-inverse">
                  {item.title}
                </h3>
                <p className="mt-2 text-body-sm leading-relaxed text-txt-inverse-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features (Warm White Surface) ─── */}
      <section className="bg-warm-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-caption font-semibold uppercase tracking-widest text-oracle-gold-dark">
            Features
          </p>
          <h2 className="mt-2 font-display text-display-md tracking-tight">
            Everything you need to bet with evidence
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Flame,
                title: 'Streaks',
                desc: 'Team patterns that stand out from the usual rate, with the record behind each one and how the team does against stronger and weaker sides.',
              },
              {
                icon: Boxes,
                title: 'Clusters',
                desc: "OraQL_'s strongest picks from unrelated matches, gathered into one view with the honest chance that they all land.",
              },
              {
                icon: Star,
                title: 'OraQL_ Picks',
                desc: 'The likeliest outcomes for each covered match, ranked, each with the reasons behind it in plain words.',
              },
              {
                icon: Layers,
                title: 'Bet Builder',
                desc: 'Combine selections from different matches and see the chance they all land — with a warning when two of them clash.',
              },
              {
                icon: Lock,
                title: 'My clusters',
                desc: 'Save your own cluster and see whether it would have landed. Test your picks before you spend anything.',
              },
              {
                icon: CircleCheck,
                title: 'Results & daily record',
                desc: 'Every call, every day, settled against the real result. Nothing deleted, nothing changed after kickoff.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-oracle-md border border-warm-sand bg-warm-cream/50 p-6 transition-all hover:border-warm-stone hover:shadow-card"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-oracle-sm bg-oracle-gold/10">
                  <feature.icon className="h-5 w-5 text-oracle-gold-dark" />
                </div>
                <h3 className="font-display text-heading tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-body-sm leading-relaxed text-txt-secondary">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA (Dark Charcoal Surface) ─── */}
      <section className="relative overflow-hidden bg-dark-charcoal py-20">
        <span
          className="pointer-events-none absolute -left-10 -bottom-10 select-none font-display font-bold text-white"
          style={{ fontSize: '20rem', lineHeight: '0.8', opacity: 0.03 }}
        >
          G
        </span>
        <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-display-md tracking-tight text-txt-inverse">
            See the record for yourself.
          </h2>
          <p className="mt-4 text-body-lg text-txt-inverse-2">
            Two days of full access, free. No card needed to start.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-2 rounded-oracle-md bg-oracle-gold px-6 py-3 font-display text-body-lg font-semibold text-dark-ink transition-all hover:bg-oracle-gold-light hover:shadow-glow"
            >
              Start your free trial
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer (Dark Ink Surface) ─── */}
      <footer className="border-t border-dark-graphite bg-dark-ink py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-oracle-gold" />
            <span className="font-display text-body-sm font-semibold text-txt-inverse">
              OraQL_
            </span>
          </div>
          <p className="text-caption text-txt-inverse-2">
            OraQL_ is a research tool. It does not take bets or promise winnings. 18+ only — bet responsibly.
          </p>
        </div>
      </footer>
    </div>
  );
}
