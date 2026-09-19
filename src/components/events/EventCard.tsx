'use client';

import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import { cn, formatKickoff } from '@/lib/utils';
import { ProbabilityBadge } from '@/components/ui/ProbabilityBadge';
import { marketShortLabel, marketSubject } from '@/lib/market-copy';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const isLive = event.status === 'LIVE' || event.status === 'HALF_TIME';
  const isFinished = event.status === 'FINISHED';
  const topPick = event.picks?.[0];

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        'group relative block rounded-oracle-md border bg-white p-4 pl-6 transition-all duration-normal',
        'hover:shadow-card hover:-translate-y-0.5',
        'before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-transparent before:transition-all before:duration-normal',
        'hover:before:bg-oracle-gold',
        isLive
          ? 'border-live/30 bg-live/[0.02]'
          : 'border-warm-sand hover:border-warm-stone',
        className,
      )}
    >
      {/* League header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-caption font-medium text-txt-tertiary">
          {event.league.name}
        </span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-caption font-semibold text-live">
              <span className="live-dot" />
              LIVE
            </span>
          )}
          <span className={cn(
            'flex items-center gap-1 text-caption',
            isFinished ? 'text-txt-tertiary' : 'text-txt-secondary',
          )}>
            <Clock className="h-3 w-3" />
            {formatKickoff(event.kickoffAt)}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-display text-heading tracking-tight',
              isFinished && 'text-txt-tertiary',
            )}>
              {event.homeTeam.shortName || event.homeTeam.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-display text-heading tracking-tight',
              isFinished && 'text-txt-tertiary',
            )}>
              {event.awayTeam.shortName || event.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Score (if live/finished) */}
        {(isLive || isFinished) && (
          <div className="flex flex-col items-center gap-1 px-4">
            <span className="font-mono text-display-sm font-bold">
              {event.homeScore ?? '-'}
            </span>
            <span className="font-mono text-display-sm font-bold">
              {event.awayScore ?? '-'}
            </span>
          </div>
        )}

        {/* OraQL_ Pick badge. The pick names its own subject — a bare
            "Over 0.5" here read as though it belonged to one of the clubs
            listed beside it. */}
        {topPick && !isFinished && (
          <div className="flex max-w-[55%] flex-col items-end gap-1 text-right">
            <div className="flex items-center gap-1 text-oracle-gold">
              <Star className="h-3.5 w-3.5 fill-oracle-gold" />
              <span className="text-caption font-semibold">Top Pick</span>
            </div>
            <span className="text-body-sm text-txt-secondary">
              {marketShortLabel(topPick.market, event)}
            </span>
            <span className="text-caption text-txt-tertiary">
              {marketSubject(topPick.market, event)}
            </span>
            <span className="mt-0.5 flex items-center gap-1">
              <ProbabilityBadge
                probability={topPick.probability}
                size="sm"
                subject={marketShortLabel(topPick.market, event).toLowerCase()}
              />
              <span className="text-caption text-txt-tertiary">chance</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
