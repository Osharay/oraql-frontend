'use client';

import { useEffect, useState } from 'react';
import { SearchX, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { CandidatesResponse } from '@/types';
import { StreakCard } from '@/components/streaks/StreakCard';
import { EmptyState } from '@/components/streaks/EmptyState';
import { cn } from '@/lib/utils';

type Tier = 'significant' | 'emerging' | 'suggestive';

const TIER_LABEL: Record<Tier, string> = {
  significant: 'Evidence-backed',
  emerging: 'Emerging',
  suggestive: 'Exploratory',
};

export default function StreaksPage() {
  const [tier, setTier] = useState<Tier>('significant');
  const [data, setData] = useState<CandidatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<CandidatesResponse>(`/streaks/candidates?tier=${tier}&limit=50`)
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
          settle, so treat them as leads to check, not evidence.
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
          <div className="space-y-4">
            {candidates.map((c) => (
              <StreakCard key={c.id} candidate={c} suggestive={tier !== 'significant'} />
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
