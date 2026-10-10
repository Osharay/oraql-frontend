'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';
import { api } from '@/lib/api';

interface Feedback {
  items: Array<{
    id: string;
    sentiment: 'POSITIVE' | 'NEGATIVE';
    message: string | null;
    email: string | null;
    page: string | null;
    createdAt: string;
  }>;
  counts: { positive: number; negative: number };
}

/** What people sent from the feedback button, newest first. */
export function FeedbackPanel() {
  const [data, setData] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');

  useEffect(() => {
    api.get<Feedback>('/feedback?limit=200').then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Could not load'));
  }, []);

  const items = (data?.items ?? []).filter((i) => filter === 'ALL' || i.sentiment === filter);

  return (
    <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft">
      <div className="mb-2 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-oracle-gold" />
        <h2 className="font-display text-h4 text-txt-primary">User feedback</h2>
      </div>
      {error && <p className="text-body-sm text-danger">{error}</p>}
      {!data && !error && (
        <p className="flex items-center gap-2 text-body-sm text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading
        </p>
      )}
      {data && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-body-sm">
            {(
              [
                ['ALL', `All ${data.counts.positive + data.counts.negative}`],
                ['POSITIVE', `Positive ${data.counts.positive}`],
                ['NEGATIVE', `Negative ${data.counts.negative}`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-oracle-full border px-3 py-1 ${
                  filter === k ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary' : 'border-warm-stone text-txt-tertiary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="text-body-sm text-txt-tertiary">No feedback yet.</p>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-warm-sand overflow-y-auto">
              {items.map((f) => (
                <li key={f.id} className="flex gap-3 py-3">
                  {f.sentiment === 'POSITIVE' ? (
                    <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-lift-strong" />
                  ) : (
                    <ThumbsDown className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  )}
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap text-body-sm text-txt-primary">{f.message || <span className="text-txt-tertiary">No message</span>}</p>
                    <p className="mt-0.5 text-caption text-txt-tertiary">
                      {new Date(f.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {f.email && ` · ${f.email}`}
                      {f.page && ` · ${f.page}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
