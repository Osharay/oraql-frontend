'use client';

import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProbabilityBadge } from '@/components/ui/ProbabilityBadge';
import { Button } from '@/components/ui/Button';
import {
  marketHeadline,
  marketSubject,
  evidenceNote,
  probabilityPhrase,
  VALUE_BET_LABEL,
} from '@/lib/market-copy';
import { useBuilderStore } from '@/stores/builder.store';
import type { Pick } from '@/types';

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

  const headline = marketHeadline(pick.market, pick.event);
  const subject = marketSubject(pick.market, pick.event);
  const evidence = evidenceNote(pick.market.confidence);

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
      {/* Header. The outcome is stated as a sentence, and the line beneath it
          says who it is about — the question the market name alone left open. */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          {pick.rank === 1 && (
            <Star className="mt-1 h-5 w-5 shrink-0 fill-oracle-gold text-oracle-gold" />
          )}
          <div className="min-w-0">
            <p className={cn(
              'font-display text-heading tracking-tight',
              isDark ? 'text-txt-inverse' : 'text-txt-primary',
            )}>
              {headline}
            </p>
            <p className={cn(
              'text-caption',
              isDark ? 'text-txt-inverse-2' : 'text-txt-tertiary',
            )}>
              {subject}
              {pick.market.isValueBet && (
                <span className="ml-2 inline-flex items-center gap-1 text-value">
                  <Sparkles className="h-3 w-3" /> {VALUE_BET_LABEL}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <ProbabilityBadge
            probability={pick.probability}
            isValueBet={pick.market.isValueBet}
            size="lg"
            subject={headline.toLowerCase()}
          />
        </div>
      </div>

      {/* What the percentage means in words. */}
      <p className={cn(
        'mb-2 text-body-sm',
        isDark ? 'text-txt-inverse-2' : 'text-txt-secondary',
      )}>
        {probabilityPhrase(pick.probability)}.
      </p>

      {/* How much evidence sits behind the number. Without this a figure built
          on league averages looks identical to one built on real form. */}
      {evidence && (
        <div
          className={cn(
            'mb-3 flex items-start gap-2 text-caption',
            isDark ? 'text-txt-inverse-2' : 'text-txt-tertiary',
          )}
        >
          <span
            className={cn(
              'mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full',
              evidence.tone === 'strong'
                ? 'bg-prob-high'
                : evidence.tone === 'moderate'
                  ? 'bg-prob-mid'
                  : 'bg-txt-tertiary',
            )}
          />
          <span>
            <span className="font-medium">{evidence.label}.</span> {evidence.detail}
          </span>
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
            <ChevronDown className="h-4 w-4" /> How did we get this number?
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
