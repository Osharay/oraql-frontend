'use client';

import { useState, useEffect } from 'react';
import { useScrollMemory } from '@/hooks/useScrollMemory';
import { Star, Filter, Sparkles } from 'lucide-react';
import { PickCard } from '@/components/picks/PickCard';
import { api } from '@/lib/api';
import type { Pick, Sport } from '@/types';

export default function PicksPage() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [sport, setSport] = useState<Sport>('FOOTBALL');
  const [minProb, setMinProb] = useState(0.55);
  const [isLoading, setIsLoading] = useState(true);
  // Back to this page lands where the reader was.
  useScrollMemory(!isLoading);

  useEffect(() => {
    loadPicks();
  }, [sport, minProb]);

  async function loadPicks() {
    setIsLoading(true);
    try {
      const data = await api.get<Pick[]>(
        `/picks/top?sport=${sport}&minProbability=${minProb}&limit=30`,
      );
      setPicks(data);
    } catch {
      //
    }
    setIsLoading(false);
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header — Warm cream surface with decorative texture */}
      <div className="relative overflow-hidden rounded-oracle-lg bg-warm-cream p-8">
        <span className="absolute -right-8 -top-20 text-8xl font-display font-bold text-warm-sand opacity-6">
          P
        </span>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-6 w-6 fill-oracle-gold text-oracle-gold" />
            <h1 className="font-display text-display-md tracking-tight text-dark-ink">
              OraQL_ Picks
            </h1>
          </div>
          <p className="text-body text-txt-secondary max-w-xl">
            Today's highest-confidence predictions ranked by probability.
            Every pick includes a transparent explanation of the reasoning.
          </p>
        </div>
      </div>

      {/* Filters — Sport pills and probability threshold */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-txt-tertiary" />
          <span className="text-body-sm font-medium text-txt-secondary">Filters:</span>
        </div>

        {/* Sport pills — Warm light pill style */}
        {(['FOOTBALL', 'BASKETBALL', 'TENNIS'] as Sport[]).map((s) => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className={`rounded-full px-4 py-1.5 text-body-sm font-medium transition-all ${
              sport === s
                ? 'bg-warm-white text-txt-primary shadow-soft'
                : 'bg-warm-cream text-txt-secondary hover:bg-warm-sand'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}

        <span className="text-warm-stone">|</span>

        {/* Probability threshold — Warm light pill style */}
        {[0.55, 0.65, 0.75].map((p) => (
          <button
            key={p}
            onClick={() => setMinProb(p)}
            className={`rounded-full px-3 py-1.5 text-body-sm font-mono font-medium transition-all ${
              minProb === p
                ? 'bg-warm-white text-txt-primary shadow-soft'
                : 'bg-warm-cream text-txt-secondary hover:bg-warm-sand'
            }`}
          >
            ≥ {(p * 100).toFixed(0)}%
          </button>
        ))}
      </div>

      {/* Picks Grid — Responsive: 1 col mobile, 2 cols md, 3 cols lg on warm-white surface */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-oracle-md bg-warm-cream" />
          ))}
        </div>
      ) : picks.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {picks.map((pick) => (
            <PickCard key={pick.id} pick={pick} variant="light" showEvent />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-oracle-lg border border-dashed border-warm-stone py-20 text-center bg-warm-cream">
          <Sparkles className="mb-3 h-10 w-10 text-warm-taupe" />
          <p className="text-body text-txt-secondary mb-2">
            No picks above {(minProb * 100).toFixed(0)}% for {sport.toLowerCase()} today.
          </p>
          <p className="text-body-sm text-txt-tertiary">
            Try lowering the threshold or switching sports.
          </p>
        </div>
      )}
    </div>
  );
}
