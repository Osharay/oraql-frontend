'use client';

import { useEffect, useState } from 'react';
import { Layers, X, Copy, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { cn, formatProbability, formatKickoff } from '@/lib/utils';
import { ProbabilityBadge } from '@/components/ui/ProbabilityBadge';
import { Button } from '@/components/ui/Button';
import { useBuilderStore } from '@/stores/builder.store';
import Link from 'next/link';
import { marketShortLabel, marketSubject } from '@/lib/market-copy';

export default function BuilderPage() {
  const { selections, count, combinedProbability, load, remove, clear, exportText, isLoading } =
    useBuilderStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    try {
      const text = await exportText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-0">
      {/* Header Section - Dark Surface with Confidence Display */}
      <div className="relative overflow-hidden bg-dark-ink px-6 py-10 md:px-8 md:py-12">
        {/* Decorative background letter */}
        <div className="absolute inset-0 flex items-start justify-end overflow-hidden">
          <span className="text-white/[0.04] font-display text-[300px] leading-none -right-12 -top-20 absolute">
            B
          </span>
        </div>

        <div className="relative z-10">
          {/* Title and Selection Count */}
          <div className="flex items-center gap-4 mb-6">
            <Layers className="h-7 w-7 text-oracle-gold flex-shrink-0" />
            <div className="flex-1">
              <h1 className="font-display text-display-md tracking-tight text-txt-inverse">
                Bet Builder
              </h1>
            </div>
            {count > 0 && (
              <span className="rounded-full bg-warm-cream font-mono text-body-sm font-bold text-txt-secondary px-3 py-2 flex-shrink-0">
                {count}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-body text-txt-inverse-2 max-w-2xl mb-8">
            Your multi-match strategy. Add picks from different matches, see how likely it is that they all land, and export when ready.
          </p>

          {/* Combined Probability and Actions */}
          {count > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-end gap-8">
              {/* Probability Display - Largest Element */}
              <div className="flex-1">
                <p className="text-caption text-txt-inverse-2 mb-2">
                  Chance every selection lands
                </p>
                <p className="font-mono text-display-sm font-bold text-oracle-gold">
                  {formatProbability(combinedProbability)}
                </p>
                <p className="mt-2 text-caption text-txt-inverse-2">
                  Assumes the selections are independent of one another.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                <Button variant="gold" onClick={handleExport} className="flex-1 sm:flex-none">
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Export'}
                </Button>
                <Button
                  variant="ghost"
                  className="text-txt-inverse-2 hover:text-danger hover:bg-danger/10 flex-1 sm:flex-none"
                  onClick={() => clear()}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selections Section - Warm Light Surface */}
      {isLoading ? (
        <div className="bg-warm-white px-6 py-8 md:px-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-oracle-md bg-warm-cream/40" />
            ))}
          </div>
        </div>
      ) : count > 0 ? (
        <div className="bg-warm-white px-6 py-8 md:px-8">
          <div className="space-y-3">
            {selections.map((s, idx) => (
              <div
                key={s.id}
                className="group flex items-center gap-4 rounded-oracle-md bg-white border border-warm-sand transition-all duration-200 hover:border-oracle-gold hover:shadow-sm p-5"
              >
                {/* Selection Number Badge */}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-cream font-mono text-body-sm font-bold text-txt-secondary flex-shrink-0">
                  {idx + 1}
                </span>

                {/* Event Information */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-heading tracking-tight text-txt-primary truncate">
                    {s.market.event.homeTeam.shortName || s.market.event.homeTeam.name} vs{' '}
                    {s.market.event.awayTeam.shortName || s.market.event.awayTeam.name}
                  </p>
                  <p className="text-body-sm text-txt-secondary mt-1">
                    {marketShortLabel(s.market, s.market.event)}
                    <span className="mx-2 text-warm-stone">·</span>
                    {marketSubject(s.market, s.market.event)}
                  </p>
                  <p className="text-caption text-txt-tertiary mt-0.5">
                    {s.market.event.league.name}
                    <span className="mx-2 text-warm-stone">·</span>
                    {formatKickoff(s.market.event.kickoffAt)}
                  </p>
                </div>

                {/* Probability Badge */}
                <ProbabilityBadge
                  probability={s.market.probability}
                  isValueBet={s.market.isValueBet}
                  subject={marketShortLabel(s.market, s.market.event).toLowerCase()}
                />

                {/* Remove Button */}
                <button
                  onClick={() => remove(s.market.id)}
                  className="rounded-md p-2 text-txt-tertiary opacity-0 transition-all duration-200 hover:bg-danger/10 hover:text-danger group-hover:opacity-100 flex-shrink-0"
                  aria-label="Remove selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-warm-white px-6 py-12 md:px-8">
          <div className="flex flex-col items-center justify-center rounded-oracle-lg border-2 border-dashed border-warm-stone py-16 text-center">
            <Sparkles className="mb-6 h-12 w-12 text-warm-taupe" />
            <h3 className="font-display text-display-sm tracking-tight text-txt-primary mb-3">
              Your builder is empty
            </h3>
            <p className="text-body text-txt-secondary mb-8 max-w-md">
              Browse today&apos;s fixtures and OraQL_ Picks, then add selections to build your multi-match strategy.
            </p>
            <Link href="/dashboard">
              <Button variant="primary">
                Browse Events <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
