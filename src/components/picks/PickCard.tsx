'use client';

import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProbabilityBadge } from '@/components/ui/ProbabilityBadge';
import { Button } from '@/components/ui/Button';
import { useBuilderStore } from '@/stores/builder.store';
import type { Pick } from '@/types';

/**
 * Says what the number is about.
 *
 * "Over 0.5 Goals" on its own reads as though it belongs to a team, and users
 * have asked which one. Totals markets cover the whole match; result markets
 * already name their club.
 */
function subjectLabel(
  marketName: string,
  event?: { homeTeam: { name: string; shortName?: string }; awayTeam: { name: string; shortName?: string } },
): string {
  if (/^Match (Goals|Corners|Cards):/i.test(marketName)) {
    return 'Both teams combined, full match';
  }
  if (/both teams to score/i.test(marketName)) {
    return 'Both teams, full match';
  }
  if (/to win$/i.test(marketName) || /^draw$/i.test(marketName)) {
    return 'Match result';
  }
  if (event) {
    return `${event.homeTeam.shortName || event.homeTeam.name} v ${event.awayTeam.shortName || event.awayTeam.name}`;
  }
  return 'Full match';
}

interface PickCardProps {
  pick: Pick;
  variant?: 'light' | 'dark';
  showEvent?: boolean;
  className?: string;
}

export function PickCard({
  pick,
  variant = 'light',
  showEvent = false,
  className,
}: PickCardProps) {
  const [expanded, setExpanded] = useState(false);
  const addToBuilder = useBuilderStore((s) => s.add);
  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'rounded-oracle-md border p-5 transition-all duration-normal',
        isDark
          ? 'border-dark-slate bg-dark-charcoal text-txt-inverse'
          : 'border-warm-sand bg-white',
        pick.rank === 1 && !isDark && 'border-oracle-gold/30 shadow-glow',
        pick.rank === 1 && isDark && 'border-oracle-gold/40 shadow-glow',
        className,
      )}
      style={
        pick.rank === 1 && !isDark
          ? { background: 'linear-gradient(135deg, var(--color-warm-white, #FAF8F5) 0%, rgba(200,164,78,0.06) 100%)' }
          : undefined
      }
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {pick.rank === 1 && (
            <Star className="h-5 w-5 fill-oracle-gold text-oracle-gold" />
          )}
          <div>
            <p className={cn(
              'font-display text-heading tracking-tight',
              isDark ? 'text-txt-inverse' : 'text-txt-primary',
            )}>
              {pick.market.name}
            </p>
            <p className={cn(
              'text-caption',
              isDark ? 'text-txt-inverse-2' : 'text-txt-tertiary',
            )}>
              {subjectLabel(pick.market.name, pick.event)}
              {pick.market.isValueBet && (
                <span className="ml-2 inline-flex items-center gap-1 text-value">
                  <Sparkles className="h-3 w-3" /> Value Bet
                </span>
              )}
            </p>
          </div>
        </div>

        <ProbabilityBadge
          probability={pick.probability}
          isValueBet={pick.market.isValueBet}
          size="lg"
        />
      </div>

      {/* How much evidence sits behind the number. Without this a figure built
          on league averages looks identical to one built on real form. */}
      {typeof pick.market.confidence === 'number' && (
        <div
          className={cn(
            'mb-3 flex items-center gap-2 text-caption',
            isDark ? 'text-txt-inverse-2' : 'text-txt-tertiary',
          )}
        >
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full',
              pick.market.confidence >= 0.6
                ? 'bg-prob-high'
                : pick.market.confidence >= 0.45
                  ? 'bg-prob-mid'
                  : 'bg-txt-tertiary',
            )}
          />
          {pick.market.confidence >= 0.6
            ? 'Backed by recent form'
            : pick.market.confidence >= 0.45
              ? 'Limited recent data'
              : 'Thin evidence — read the reasoning'}
        </div>
      )}

      {/* Event info (when showing across events) */}
      {showEvent && pick.event && (
        <div className={cn(
          'mb-3 rounded-oracle-sm px-3 py-2 text-body-sm',
          isDark ? 'bg-dark-graphite' : 'bg-warm-cream',
        )}>
          {pick.event.homeTeam.shortName || pick.event.homeTeam.name} vs{' '}
          {pick.event.awayTeam.shortName || pick.event.awayTeam.name}
          <span className={cn('ml-2', isDark ? 'text-txt-inverse-2' : 'text-txt-tertiary')}>
            {pick.event.league.name}
          </span>
        </div>
      )}

      {/* Explanation toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-1 text-body-sm font-medium transition-colors',
          isDark
            ? 'text-txt-inverse-2 hover:text-txt-inverse'
            : 'text-txt-secondary hover:text-txt-primary',
        )}
      >
        {expanded ? (
          <>
            <ChevronUp className="h-4 w-4" /> Hide reasoning
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" /> Why this pick?
          </>
        )}
      </button>

      {/* Explanation */}
      {expanded && pick.explanation && (
        <div className={cn(
          'mt-3 rounded-oracle-sm p-4 text-body-sm leading-relaxed animate-slide-up',
          isDark ? 'bg-dark-graphite text-txt-inverse-2' : 'bg-warm-cream text-txt-secondary',
        )}>
          {pick.explanation}
        </div>
      )}

      {/* Add to Builder */}
      <div className="mt-4 flex justify-end">
        <Button
          variant={isDark ? 'gold' : 'primary'}
          size="sm"
          onClick={() => addToBuilder(pick.market.id)}
        >
          <Plus className="h-4 w-4" />
          Add to Builder
        </Button>
      </div>
    </div>
  );
}
