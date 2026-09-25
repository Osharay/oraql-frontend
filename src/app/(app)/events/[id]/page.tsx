'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cn, formatKickoff, formatCategory } from '@/lib/utils';
import { PickCard } from '@/components/picks/PickCard';
import { FixtureForm } from '@/components/streaks/FixtureForm';
import { MarketBoard } from '@/components/streaks/MarketBoard';
import { MarketChip } from '@/components/markets/MarketChip';
import { ProbabilityBadge } from '@/components/ui/ProbabilityBadge';
import { Button } from '@/components/ui/Button';
import { marketHeadline, marketSubject, evidenceNote } from '@/lib/market-copy';
import { api } from '@/lib/api';
import { useBuilderStore } from '@/stores/builder.store';
import type { EventDetail, Market, MarketCategory } from '@/types';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [activeCategory, setActiveCategory] = useState<MarketCategory | 'ALL'>('ALL');
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const addToBuilder = useBuilderStore((s) => s.add);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) loadEvent();
  }, [eventId]);

  async function loadEvent() {
    setIsLoading(true);
    try {
      const data = await api.get<EventDetail>(`/events/${eventId}`);
      setEvent(data);
    } catch {
      // handle error
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-64 animate-pulse rounded-oracle-lg bg-warm-cream" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-txt-tertiary">Event not found.</p>
      </div>
    );
  }

  const isLive = event.status === 'LIVE' || event.status === 'HALF_TIME';

  // Group markets by category
  const categories = Array.from(new Set(event.markets.map((m) => m.category)));
  const filteredMarkets =
    activeCategory === 'ALL'
      ? event.markets
      : event.markets.filter((m) => m.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* ─── Back to Dashboard Link ─── */}
      <div className="px-6 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-body-sm text-txt-secondary hover:text-txt-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* ─── Event Header (Warm Cream Surface with Decorative V) ─── */}
      <section className="relative overflow-hidden bg-warm-cream px-6 py-8 md:px-8">
        {/* Decorative "V". Sized with the viewport — a fixed 200px glyph
            dwarfed a phone screen. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-20 select-none font-display text-[120px] font-bold leading-none text-warm-sand md:text-[200px]"
        >
          V
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* League and Round */}
          <div className="mb-4 flex items-center gap-3 text-body-sm text-txt-secondary">
            <span className="font-semibold">{event.league.name}</span>
            {event.round && (
              <>
                <span className="text-warm-stone">·</span>
                <span>{event.round}</span>
              </>
            )}
          </div>

          {/* Teams and Score/Time */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex-1">
              <h1 className="font-display text-display-md md:text-display-lg tracking-tight text-txt-primary break-words">
                <Link
                  href={`/teams/${event.homeTeam.id}`}
                  className="decoration-oracle-gold/60 underline-offset-4 hover:underline"
                >
                  {event.homeTeam.name}
                </Link>
              </h1>
              <p className="my-3 text-body text-txt-tertiary">vs</p>
              <h1 className="font-display text-display-md md:text-display-lg tracking-tight text-txt-primary break-words">
                <Link
                  href={`/teams/${event.awayTeam.id}`}
                  className="decoration-oracle-gold/60 underline-offset-4 hover:underline"
                >
                  {event.awayTeam.name}
                </Link>
              </h1>
            </div>

            {/* Score / Time / Venue */}
            <div className="flex flex-col items-end justify-center gap-4">
              {isLive ? (
                <div className="text-right">
                  <div className="mb-2 flex items-center justify-end gap-2">
                    <span className="text-caption font-semibold text-live">LIVE</span>
                    <span className="live-dot" />
                  </div>
                  <p className="font-mono text-display-xl font-bold text-txt-primary">
                    {event.homeScore ?? 0} — {event.awayScore ?? 0}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-right">
                  <div className="flex items-center justify-end gap-2 text-txt-secondary">
                    <Clock className="h-4 w-4" />
                    <span className="text-body-sm">{formatKickoff(event.kickoffAt)}</span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center justify-end gap-2 text-txt-tertiary">
                      <MapPin className="h-4 w-4" />
                      <span className="text-body-sm">{event.venue}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Market form: both sides, each at the venue they play it at ─── */}
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4">
            <h2 className="font-display text-heading tracking-tight text-txt-primary">
              Market form
            </h2>
            <p className="mt-1 text-body-sm text-txt-secondary">
              The last 10 matches for each side at this venue, most unusual markets first.
            </p>
          </div>
          <FixtureForm eventId={event.id} />
        </div>
      </section>

      {/* ─── Every market, estimated for this fixture ─── */}
      <section className="px-6 pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4">
            <h2 className="font-display text-heading tracking-tight text-txt-primary">
              Every market for this match
            </h2>
            <p className="mt-1 text-body-sm text-txt-secondary">
              Every market in the registry, worked out from both sides&rsquo; record at the venue
              they play this one at — one row per club where a market is about one team, with
              the evidence behind each on the row.
            </p>
          </div>
          <MarketBoard eventId={event.id} />
        </div>
      </section>

      {/* ─── Two-Column Layout ─── */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
          {/* ─── Left Column: OraQL_ Picks ─── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 fill-oracle-gold text-oracle-gold flex-shrink-0" />
              <h2 className="font-display text-heading tracking-tight text-txt-primary">
                OraQL_ Picks
              </h2>
            </div>

            {event.picks.length > 0 ? (
              <div className="space-y-4">
                {event.picks.map((pick) => (
                  <PickCard key={pick.id} pick={pick} />
                ))}
              </div>
            ) : (
              <div className="rounded-oracle-md border border-dashed border-warm-stone bg-warm-white p-6 text-center">
                <p className="text-body-sm text-txt-tertiary">
                  No strong picks identified for this event.
                </p>
              </div>
            )}
          </div>

          {/* ─── Right Column: All Markets ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header with count */}
            <div>
              <h2 className="font-display text-heading tracking-tight text-txt-primary">
                All Markets
                <span className="ml-3 text-body text-txt-tertiary font-normal">
                  {event.markets.length}
                </span>
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={cn(
                  'rounded-full px-4 py-2 text-body-sm font-medium transition-all duration-200',
                  activeCategory === 'ALL'
                    ? 'bg-warm-white text-txt-primary shadow-soft'
                    : 'bg-warm-cream text-txt-secondary hover:bg-warm-sand',
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'rounded-full px-4 py-2 text-body-sm font-medium transition-all duration-200',
                    activeCategory === cat
                      ? 'bg-warm-white text-txt-primary shadow-soft'
                      : 'bg-warm-cream text-txt-secondary hover:bg-warm-sand',
                  )}
                >
                  {formatCategory(cat)}
                </button>
              ))}
            </div>

            {/* Markets Grid */}
            <div className="rounded-oracle-md bg-warm-white p-4 space-y-2">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((market) => (
                  <div
                    key={market.id}
                    className="relative transition-all duration-200 hover:before:opacity-100 before:absolute before:-left-4 before:top-0 before:bottom-0 before:w-1 before:bg-oracle-gold before:opacity-0 before:rounded-sm"
                  >
                    <MarketChip
                      market={market}
                      event={event}
                      isSelected={selectedMarket?.id === market.id}
                      onClick={() => {
                        setSelectedMarket(market);
                        setAddError(null);
                      }}
                      variant="light"
                    />
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-body-sm text-txt-tertiary">
                    No markets available for this category.
                  </p>
                </div>
              )}
            </div>

            {/* Selected Market Detail Panel */}
            {selectedMarket && (
              <div className="rounded-oracle-md border-2 border-oracle-gold bg-oracle-gold/[0.04] p-6 animate-fade-in space-y-4">
                {/* Header with Title and Probability */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-display text-heading tracking-tight text-txt-primary">
                      {marketHeadline(selectedMarket, event)}
                    </h3>
                    <p className="mt-1 text-body-sm text-txt-secondary">
                      {marketSubject(selectedMarket, event)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <ProbabilityBadge
                      probability={selectedMarket.probability}
                      isValueBet={selectedMarket.isValueBet}
                      size="lg"
                      subject={marketHeadline(selectedMarket, event).toLowerCase()}
                    />
                  </div>
                </div>

                {/* How much history the figure rests on. */}
                {(() => {
                  const evidence = evidenceNote(selectedMarket.confidence);
                  if (!evidence) return null;
                  return (
                    <p className="text-caption text-txt-tertiary">
                      <span className="font-medium">{evidence.label}.</span>{' '}
                      {evidence.detail}
                    </p>
                  );
                })()}

                {/* Explanation */}
                {selectedMarket.explanation && (
                  <p className="text-body-sm text-txt-secondary leading-relaxed">
                    {selectedMarket.explanation}
                  </p>
                )}

                {/* Add to Builder Button */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={async () => setAddError(await addToBuilder(selectedMarket.id))}
                    className="w-full"
                  >
                    Add to Bet Builder
                  </Button>
                  {addError && (
                    <p role="alert" className="mt-2 text-caption text-danger">
                      {addError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
