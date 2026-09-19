'use client';

import { useEffect, useState } from 'react';
import { Layers, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ClustersResponse } from '@/types';
import { ClusterCard } from '@/components/streaks/ClusterCard';
import { EmptyState } from '@/components/streaks/EmptyState';

export default function ClustersPage() {
  const [data, setData] = useState<ClustersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get<ClustersResponse>('/streaks/clusters')
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e?.message ?? 'Could not load clusters'))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const clusters = data?.clusters ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-h2 text-txt-primary">Clusters</h1>
        <p className="mt-1 text-body text-txt-secondary">
          Strong streaks from unrelated events, leagues and markets, gathered into one
          view. What you do with them is your call.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 py-16 text-body text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading
        </div>
      )}

      {error && !loading && <EmptyState title="Could not load clusters" body={error} />}

      {!loading && !error && clusters.length === 0 && (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title="No clusters today"
          body="A cluster needs at least two streaks that each cleared the bar on their own, from different events and different markets."
          detail="On days when few streaks qualify, there is nothing to gather. That is expected rather than a fault."
        />
      )}

      {!loading && clusters.length > 0 && (
        <div className="space-y-6">
          {clusters.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      )}
    </div>
  );
}
