'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { replaceCurrent } from '@/lib/navigation';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { SearchX, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { CandidatesResponse } from '@/types';
import { FixtureLine, StreakCard } from '@/components/streaks/StreakCard';
import type { StreakCandidate } from '@/types';
import { EmptyState } from '@/components/streaks/EmptyState';
import { cn } from '@/lib/utils';

type Tier = 'significant' | 'emerging' | 'suggestive';

const TIER_LABEL: Record<Tier, string> = {
  significant: 'Evidence-backed',
  emerging: 'Emerging · watch list',
  suggestive: 'Exploratory',
};

const TIERS: Tier[] = ['significant', 'emerging', 'suggestive'];

export default function StreaksPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <StreaksView />
    </Suspense>
  );
}

function StreaksView() {
  const router = useRouter();
  const params = useSearchParams();
  // The tab lives in the URL (?tier=emerging), so Back returns to it.
  const fromUrl = params?.get('tier') as Tier | null;
  const tier: Tier = fromUrl && TIERS.includes(fromUrl) ? fromUrl : 'significant';
  const setTier = (t: Tier) => {
    const url = t === 'significant' ? '/streaks' : `/streaks?tier=${t}`;
    router.replace(url, { scroll: false });
    replaceCurrent(url);
  };
  const [data, setData] = useState<CandidatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Back to this page lands where the reader was.
  useScrollMemory(!loading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<CandidatesResponse>(`/streaks/candidates?tier=${tier}&limit=100`)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e?.message ?? 'Could not load streaks'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [tier]);

  const candidates = data?.candidates ?? [];
  const tested = data?.run?.candidatesTested;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6">
        <h1 className="font-display text-h2 text-txt-primary">Streaks</h1>
        <p className="mt-1 text-body text-txt-secondary">
          Market patterns that recur more often than the market itself normally does.
        </p>
      </header>

      <div className="mb-6 flex gap-2">
        {(['significant', 'emerging', 'suggestive'] as Tier[]).map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={cn(
              'rounded-oracle-full border px-4 py-2 text-body-sm font-medium transition-all duration-normal',
              tier === t
                ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary'
                : 'border-warm-stone bg-warm-cream text-txt-tertiary hover:text-txt-secondary',
            )}
          >
            {TIER_LABEL[t]}
          </button>
        ))}
      </div>

      {tier === 'emerging' && (
        <p className="mb-5 rounded-oracle-sm border border-warm-stone bg-warm-cream px-4 py-3 text-body-sm text-txt-secondary">
          Strong over the last fifteen matches, though two seasons do not show it yet. A run
          like this can be the start of something or a hot spell — OraQL records how these
          settle, so treat them as leads to check, not evidence. They stay out of OraQL&apos;s
          clusters until their own record beats what OraQL expected over 100 settled picks.
        </p>
      )}

      {tier === 'suggestive' && (
        <p className="mb-5 rounded-oracle-sm border border-warm-stone bg-warm-cream px-4 py-3 text-body-sm text-txt-secondary">
          These lean the right way but have not been shown to differ from their baseline
          once every slice tested is accounted for. Shown so nothing is hidden — not as
          evidence.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-16 text-body text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading
        </div>
      )}

      {error && !loading && (
        <EmptyState
          title="Could not load streaks"
          body={error}
          detail="If the engine has never run, there is nothing to load yet."
        />
      )}

      {!loading && !error && candidates.length === 0 && (
        <EmptyState
          icon={<SearchX className="h-8 w-8" />}
          title={
            tier === 'significant'
              ? 'No streak cleared the bar today'
              : tier === 'emerging'
                ? 'No recent run stands out today'
                : 'Nothing to explore yet'
          }
          body={
            tier === 'significant'
              ? 'Every pattern found was within what these markets do anyway. That is the engine working, not failing.'
              : tier === 'emerging'
                ? 'No team’s last fifteen matches stand far enough above the usual rate to flag.'
                : 'No pattern is currently leaning far enough above its baseline to be worth a look.'
          }
          detail={
            tested
              ? `${tested.toLocaleString()} slices tested in the latest run.`
              : 'The engine has not completed a run yet.'
          }
        />
      )}

      {!loading && candidates.length > 0 && (
        <>
          <p className="mb-4 text-body-sm text-txt-tertiary">
            {candidates.length} of {tested?.toLocaleString() ?? '—'} slices tested
          </p>
          <div className="space-y-8">
            {groupByMatch(candidates).map((g) => (
              <MatchGroup key={g.key} group={g} suggestive={tier !== 'significant'} />
            ))}
          </div>
        </>
      )}

      <p className="mt-10 text-caption text-txt-tertiary">
        Every figure here is a historical record, not a prediction of the next result.
      </p>
    </div>
  );
}

/**
 * Streaks gathered under the match they are for, so every pick on one event
 * sits together under its teams, matches in kickoff order (soonest first).
 */
function groupByMatch(candidates: StreakCandidate[]) {
  type Group = {
    key: string;
    title: string;
    fixture: StreakCandidate['nextFixture'];
    items: StreakCandidate[];
  };
  const groups = new Map<string, Group>();
  for (const c of candidates) {
    const f = c.nextFixture;
    const key = f ? f.eventId : 'none';
    const title = f ? `${f.home.name} vs ${f.away.name}` : 'No upcoming match';
    // The heading shows the match once, absences for both sides included;
    // whether they work for or against a pick is each card's own badge.
    const fixture = f
      ? { ...f, availability: f.availability ? { ...f.availability, verdict: null } : f.availability }
      : null;
    const g = groups.get(key) ?? { key, title, fixture, items: [] };
    g.items.push(c);
    groups.set(key, g);
  }
  // Soonest kickoff first; streaks with no upcoming match go last. Within a
  // match the engine's order stands, strongest first.
  const kickoff = (g: Group) => (g.fixture ? new Date(g.fixture.kickoffAt).getTime() : Infinity);
  return [...groups.values()].sort((a, b) => kickoff(a) - kickoff(b));
}

/** How many of a match's streaks show before "Show more". */
const SHOWN_PER_MATCH = 2;

/**
 * One match: its heading and fixture once, then its streaks. Long groups show
 * the strongest two and fold the rest behind a button, so ten picks on one
 * match do not push every other match off the screen.
 */
function MatchGroup({
  group: g,
  suggestive,
}: {
  group: ReturnType<typeof groupByMatch>[number];
  suggestive: boolean;
}) {
  // Remembered for the tab, so coming back with Back finds it as it was left.
  const memoryKey = `oraql:expanded:${g.key}`;
  const [expanded, setExpandedState] = useState(() => {
    try {
      return sessionStorage.getItem(memoryKey) === '1';
    } catch {
      return false;
    }
  });
  const setExpanded = (next: (v: boolean) => boolean) =>
    setExpandedState((v) => {
      const value = next(v);
      try {
        sessionStorage.setItem(memoryKey, value ? '1' : '0');
      } catch {
        // No storage: it simply is not remembered.
      }
      return value;
    });
  const shown = expanded ? g.items : g.items.slice(0, SHOWN_PER_MATCH);
  const hidden = g.items.length - shown.length;

  return (
    <section aria-label={g.title}>
      <header className="mb-3">
        <h2 className="font-display text-h5 text-txt-primary">
          {g.title}
          <span className="ml-2 text-body-sm font-normal text-txt-tertiary">
            {g.items.length} {g.items.length === 1 ? 'streak' : 'streaks'}
          </span>
        </h2>
        {g.fixture && <FixtureLine fixture={g.fixture} />}
      </header>
      <div className="space-y-4 border-l-2 border-warm-sand pl-3 sm:pl-4">
        {shown.map((c) => (
          <StreakCard key={c.id} candidate={c} suggestive={suggestive} inGroup={!!c.nextFixture} />
        ))}
        {(hidden > 0 || (expanded && g.items.length > SHOWN_PER_MATCH)) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full rounded-oracle-md border border-dashed border-warm-stone bg-warm-cream px-4 py-3 text-body-sm font-medium text-txt-secondary transition-colors duration-normal hover:text-txt-primary"
          >
            {expanded
              ? `Show fewer for ${g.title}`
              : `Show ${hidden} more ${hidden === 1 ? 'streak' : 'streaks'} for ${g.title}`}
          </button>
        )}
      </div>
    </section>
  );
}
