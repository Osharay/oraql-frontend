'use client';

import { useState } from 'react';
import { Layers, X, Copy, Trash2, ChevronUp } from 'lucide-react';
import { cn, formatProbability } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ProbabilityBadge } from '@/components/ui/ProbabilityBadge';
import { marketShortLabel, marketSubject } from '@/lib/market-copy';
import { useBuilderStore } from '@/stores/builder.store';

export function BuilderBar() {
  const { selections, count, combinedProbability, remove, clear, exportText } =
    useBuilderStore();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (count === 0) return null;

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
    <div className="fixed bottom-0 left-0 right-0 z-30 animate-slide-up lg:left-64">
      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-dark-slate bg-dark-charcoal p-4">
          <div className="mx-auto max-w-4xl space-y-2">
            {selections.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-oracle-sm bg-dark-graphite px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-medium text-txt-inverse">
                    {marketShortLabel(s.market, s.market.event)}
                  </p>
                  <p className="text-caption text-txt-inverse-2">
                    {s.market.event.homeTeam.shortName || s.market.event.homeTeam.name} v{' '}
                    {s.market.event.awayTeam.shortName || s.market.event.awayTeam.name}
                    {' · '}
                    {marketSubject(s.market, s.market.event)}
                  </p>
                </div>
                <ProbabilityBadge
                  probability={s.market.probability}
                  size="sm"
                  subject={marketShortLabel(s.market, s.market.event).toLowerCase()}
                />
                <button
                  onClick={() => remove(s.market.id)}
                  aria-label="Remove from builder"
                  className="ml-3 rounded p-1 text-txt-inverse-2 hover:bg-dark-slate hover:text-danger transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <p className="pt-1 text-caption text-txt-inverse-2">
              Combined chance assumes every selection lands, and that they are
              independent of one another.
            </p>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t border-dark-slate bg-dark-ink px-6 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 text-txt-inverse"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-oracle-sm bg-oracle-gold/20">
              <Layers className="h-5 w-5 text-oracle-gold" />
            </div>
            <div className="text-left">
              <p className="text-body font-display font-semibold">
                Bet Builder
                <span className="ml-2 rounded-full bg-oracle-gold/20 px-2 py-0.5 text-caption font-bold text-oracle-gold">
                  {count}
                </span>
              </p>
              <p className="text-caption text-txt-inverse-2">
                {formatProbability(combinedProbability)} chance all{' '}
                {count === 1 ? 'of it lands' : `${count} land`}
              </p>
            </div>
            <ChevronUp
              className={cn(
                'h-4 w-4 text-txt-inverse-2 transition-transform',
                expanded && 'rotate-180',
              )}
            />
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clear()}
              className="text-txt-inverse-2 hover:text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button variant="gold" size="sm" onClick={handleExport}>
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Export'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
