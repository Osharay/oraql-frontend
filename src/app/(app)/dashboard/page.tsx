'use client';

import { useState, useEffect } from 'react';
import { Star, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { EventCard } from '@/components/events/EventCard';
import { PickCard } from '@/components/picks/PickCard';
import { api } from '@/lib/api';
import type { Event, Pick, Sport, PaginatedResponse, SportSummary } from '@/types';

export default function DashboardPage() {
  const [activeSport, setActiveSport] = useState<Sport>('FOOTBALL');
  const [events, setEvents] = useState<Event[]>([]);
  const [topPicks, setTopPicks] = useState<Pick[]>([]);
  const [sportCounts, setSportCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeSport]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [eventsRes, picksRes, summaryRes] = await Promise.all([
        api.get<PaginatedResponse<Event>>(`/events?sport=${activeSport}`),
        api.get<Pick[]>(`/picks/top?sport=${activeSport}&limit=6`),
        api.get<SportSummary[]>('/events/sports-summary'),
      ]);

      setEvents(eventsRes.data);
      setTopPicks(picksRes);
      const counts: Record<string, number> = {};
      summaryRes.forEach((s) => (counts[s.sport] = s.eventCount));
      setSportCounts(counts);
    } catch {
      // Will show empty state
    }
    setIsLoading(false);
  }

  // Group events by league
  const groupedEvents = events.reduce(
    (acc, event) => {
      const key = event.league.name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    },
    {} as Record<string, Event[]>,
  );

  return (
    <div className="bg-warm-white min-h-screen">
      {/* TopBar: Warm White Sticky Header with Sport Toggle */}
      <TopBar
        activeSport={activeSport}
        onSportChange={setActiveSport}
        sportCounts={sportCounts}
      />

      <div className="relative">
        {/* ─── Section 1: Hero "Top Picks Today" (Dark Surface) ─── */}
        <section className="relative overflow-hidden bg-dark-ink px-6 py-12 md:px-8 lg:px-12">
          {/* Oversized Decorative Letter - Confidence at a Glance Theme */}
          <div className="absolute -right-12 -top-20 text-white/[0.04] font-display text-9xl tracking-tight leading-none pointer-events-none">
            O
          </div>

          <div className="relative z-10 max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-oracle-md bg-oracle-gold/20 flex-shrink-0 mt-0.5">
                <Star className="h-6 w-6 fill-oracle-gold text-oracle-gold" />
              </div>
              <div>
                <h2 className="font-display text-display-md md:text-display-lg tracking-tight text-txt-inverse mb-2">
                  Top Picks Today
                </h2>
                <p className="text-body-sm text-txt-inverse-2 max-w-lg">
                  OraQL_&apos;s highest-confidence predictions across all matches
                </p>
              </div>
            </div>

            {/* Picks Grid */}
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-56 animate-pulse rounded-oracle-lg bg-dark-graphite/50"
                  />
                ))}
              </div>
            ) : topPicks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topPicks.map((pick) => (
                  <PickCard key={pick.id} pick={pick} variant="dark" showEvent />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Zap className="mb-4 h-12 w-12 text-dark-ash/50" />
                <p className="text-body-sm text-txt-inverse-2">
                  No picks available yet. Check back closer to kickoff.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Section 2: "Today's Fixtures" (Warm White Surface) ─── */}
        <section className="relative px-6 py-12 md:px-8 lg:px-12 bg-warm-white">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="mb-8 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-oracle-gold flex-shrink-0" />
                <h2 className="font-display text-display-md tracking-tight text-txt-primary">
                  Today's Fixtures
                </h2>
              </div>
              <span className="inline-flex items-center px-4 py-2 rounded-oracle-md bg-warm-cream text-txt-secondary font-body text-body-sm font-semibold">
                {events.length} {events.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {/* Events Grid by League */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-32 mb-4 animate-pulse bg-warm-cream rounded" />
                    <div className="space-y-3">
                      {[1, 2].map((j) => (
                        <div
                          key={j}
                          className="h-20 animate-pulse rounded-oracle-md bg-warm-cream"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : Object.keys(groupedEvents).length > 0 ? (
              <div className="space-y-10">
                {Object.entries(groupedEvents).map(([league, leagueEvents]) => (
                  <div key={league}>
                    {/* League Name Header */}
                    <h3 className="text-body-xs font-mono uppercase tracking-widest text-txt-tertiary mb-4 font-semibold">
                      {league}
                    </h3>

                    {/* Events for This League */}
                    <div className="space-y-3">
                      {leagueEvents.map((event) => (
                        <div key={event.id} className="group relative">
                          <EventCard event={event} />
                          {/* Gold left-border on hover - via before pseudo-element */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 bg-oracle-gold rounded-l-oracle-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            aria-hidden="true"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-oracle-lg border-2 border-dashed border-warm-sand py-20 text-center">
                <TrendingUp className="mb-4 h-12 w-12 text-warm-stone/40" />
                <p className="text-body text-txt-tertiary font-body">
                  No events scheduled for today. Try another sport or check tomorrow.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ─── Section 3: Stats/Summary Row (Warm Cream Surface) ─── */}
        {!isLoading && Object.keys(sportCounts).length > 0 && (
          <section className="relative px-6 py-10 md:px-8 lg:px-12 bg-warm-cream">
            <div className="max-w-7xl mx-auto">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-8">
                <BarChart3 className="h-6 w-6 text-oracle-gold flex-shrink-0" />
                <h2 className="font-display text-display-sm tracking-tight text-txt-primary">
                  Today's Summary
                </h2>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(sportCounts).map(([sport, count]) => (
                  <div
                    key={sport}
                    className="rounded-oracle-md bg-warm-white border border-warm-sand p-6 shadow-soft"
                  >
                    <p className="text-body-xs font-mono uppercase tracking-widest text-txt-secondary mb-2 font-semibold">
                      {sport}
                    </p>
                    <p className="font-display text-display-xl text-txt-primary tracking-tight">
                      {count}
                    </p>
                    <p className="text-body-xs text-txt-tertiary mt-1">
                      {count === 1 ? 'Event' : 'Events'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
