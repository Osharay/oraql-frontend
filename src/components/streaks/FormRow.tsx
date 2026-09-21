'use client';

import { cn } from '@/lib/utils';
import { ResultStrip } from './ResultStrip';
import type { TeamMarketForm } from '@/types';

const pct = (v: number) => `${Math.round(v * 100)}%`;

/**
 * How often a run like this happens by luck. In words, because a p-value
 * means nothing to the person reading the card, and because at ten matches
 * luck is common enough that the difference matters.
 */
const CHANCE_COPY: Record<string, { label: string; title: string; className: string }> = {
  rare: {
    label: 'Unlikely to be luck',
    title: 'An ordinary team would do this less than 1 time in 100.',
    className: 'bg-lift-pos/20 text-lift-strong',
  },
  unusual: {
    label: 'Unusual',
    title: 'An ordinary team would do this less than 1 time in 20.',
    className: 'bg-oracle-gold/15 text-oracle-gold-dark',
  },
  common: {
    label: 'Could be luck',
    title: 'A run like this is common for an ordinary team over so few matches.',
    className: 'bg-warm-sand text-txt-tertiary',
  },
};

/**
 * One market's recent form, with the longer record beside it — the client's
 * "extra data to weigh what you have against".
 */
export function FormRow({ market }: { market: TeamMarketForm }) {
  const chance = market.chanceBand ? CHANCE_COPY[market.chanceBand] : null;
  const lift = market.lift;

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-body font-semibold text-txt-primary">
            {market.marketLabel}
          </p>
          <p className="mt-0.5 text-caption text-txt-tertiary">{market.subject}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-h5 leading-none text-txt-primary">
            {market.recentWins}/{market.recentPlayed}
          </p>
          <p className="mt-1 text-caption text-txt-tertiary">last {market.recentPlayed}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ResultStrip last10={market.recent} />
        {market.currentRun > 1 && (
          <span className="text-body-sm text-txt-secondary">
            {market.currentRun} in a row now
          </span>
        )}
        {chance && (
          <span
            title={chance.title}
            className={cn(
              'ml-auto rounded-oracle-full px-2 py-0.5 text-caption font-semibold',
              chance.className,
            )}
          >
            {chance.label}
          </span>
        )}
      </div>

      {/* The weighing: the team's longer record, and what the market does for
          everyone. The gap to the second is what makes a run worth a look. */}
      <dl className="mt-3 grid grid-cols-3 gap-3 text-caption">
        <div>
          <dt className="text-txt-tertiary">Two seasons</dt>
          <dd className="font-semibold text-txt-primary">
            {pct(market.longRate)}{' '}
            <span className="font-normal text-txt-tertiary">of {market.longPlayed}</span>
          </dd>
        </div>
        <div>
          <dt className="text-txt-tertiary">Market usually</dt>
          <dd className="font-semibold text-txt-primary">
            {market.baselineRate != null ? pct(market.baselineRate) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-txt-tertiary">Above usual</dt>
          <dd
            className={cn(
              'font-semibold',
              lift == null
                ? 'text-txt-tertiary'
                : lift > 0.05
                  ? 'text-lift-strong'
                  : lift < 0
                    ? 'text-txt-tertiary'
                    : 'text-txt-primary',
            )}
          >
            {lift == null ? '—' : `${lift >= 0 ? '+' : ''}${Math.round(lift * 100)} pts`}
          </dd>
        </div>
      </dl>
    </li>
  );
}
