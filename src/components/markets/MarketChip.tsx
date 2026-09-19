'use client';

import { cn, formatProbability, getProbabilityTier } from '@/lib/utils';
import {
  marketShortLabel,
  marketSubject,
  VALUE_BET_SHORT,
  type EventLike,
} from '@/lib/market-copy';
import type { Market } from '@/types';

interface MarketChipProps {
  market: Market;
  /** The fixture, so home/away markets can name the actual club. */
  event?: EventLike;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function MarketChip({
  market,
  event,
  isSelected,
  onClick,
  variant = 'light',
  className,
}: MarketChipProps) {
  const tier = getProbabilityTier(market.probability);
  const isDark = variant === 'dark';
  const label = marketShortLabel(market, event);
  const subject = marketSubject(market, event);

  return (
    <button
      onClick={onClick}
      aria-label={`${label}. ${subject}. ${formatProbability(market.probability)} chance.`}
      className={cn(
        'flex w-full items-center gap-3 rounded-oracle-sm border px-4 py-3 text-left transition-all duration-normal',
        isDark
          ? [
              'border-dark-slate',
              isSelected
                ? 'bg-oracle-gold/15 border-oracle-gold/40'
                : 'bg-dark-graphite hover:bg-dark-slate',
            ]
          : [
              'border-warm-sand',
              isSelected
                ? 'bg-oracle-gold/10 border-oracle-gold/30 shadow-soft'
                : 'bg-white hover:bg-warm-cream hover:border-warm-stone',
            ],
        className,
      )}
    >
      {/* Probability bar */}
      <div className="relative h-8 w-1 shrink-0 overflow-hidden rounded-full bg-warm-sand">
        <div
          className={cn('absolute bottom-0 w-full rounded-full transition-all', {
            'bg-prob-high': tier === 'high',
            'bg-prob-mid': tier === 'mid',
            'bg-dark-ash': tier === 'low',
          })}
          style={{ height: `${market.probability * 100}%` }}
        />
      </div>

      {/* Content — the outcome, then who it is about. The second line is the
          one that answers "which team?", so it is never dropped. */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-body-sm font-medium',
            isDark ? 'text-txt-inverse' : 'text-txt-primary',
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'truncate text-caption',
            isDark ? 'text-txt-inverse-2' : 'text-txt-tertiary',
          )}
        >
          {subject}
        </p>
      </div>

      {/* Probability */}
      <span
        className={cn('shrink-0 font-mono text-body-sm font-semibold', {
          'text-prob-high': tier === 'high',
          'text-prob-mid': tier === 'mid',
          'text-txt-tertiary': tier === 'low',
        })}
      >
        {formatProbability(market.probability)}
      </span>

      {/* Value bet indicator */}
      {market.isValueBet && (
        <span className="shrink-0 rounded-full bg-value/15 px-2 py-0.5 text-[10px] font-bold text-value">
          {VALUE_BET_SHORT}
        </span>
      )}
    </button>
  );
}
