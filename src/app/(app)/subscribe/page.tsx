'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { naira, timeLeft, useBillingStore, type PlanId, type ProviderId } from '@/stores/billing.store';

export default function SubscribePage() {
  return (
    <Suspense fallback={null}>
      <Subscribe />
    </Suspense>
  );
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Two plans and two ways to pay. Each payment is one-off and adds its days to
 * whatever is left, so paying early loses nothing and nothing renews without
 * the user choosing to.
 */
function Subscribe() {
  const params = useSearchParams();
  const { status, load } = useBillingStore();
  const [plan, setPlan] = useState<PlanId>('QUARTERLY');
  const [provider, setProvider] = useState<ProviderId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status && !provider) setProvider(status.providers.find((p) => p.available)?.id ?? null);
  }, [status, provider]);

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-6 py-16 text-body text-txt-tertiary">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading
      </div>
    );
  }

  const chosen = status.plans.find((p) => p.id === plan) ?? status.plans[0];
  const chosenProvider = status.providers.find((p) => p.id === provider);

  const pay = async () => {
    if (!provider) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.post<{ url: string }>('/billing/checkout', { plan, provider });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The payment page could not be opened');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="font-display text-h2 text-txt-primary">Subscribe to OraQL</h1>
        <p className="mt-1 text-body text-txt-secondary">
          Every streak, cluster, pick and the full results record, for as long as you choose.
        </p>
      </header>

      <StatusLine />

      {params?.get('cancelled') && (
        <p className="mb-5 rounded-oracle-sm border border-warm-stone bg-warm-cream px-4 py-3 text-body-sm text-txt-secondary">
          Payment cancelled — nothing was charged. Pick a plan whenever you are ready.
        </p>
      )}

      <h2 className="mb-3 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">1 · Choose a plan</h2>
      <div className="mb-7 grid gap-3 sm:grid-cols-2">
        {status.plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlan(p.id)}
            aria-pressed={plan === p.id}
            className={cn(
              'relative rounded-oracle-md border bg-white p-5 text-left shadow-soft transition-colors',
              plan === p.id ? 'border-oracle-gold ring-2 ring-oracle-gold/30' : 'border-warm-stone hover:border-oracle-gold/60',
            )}
          >
            {p.saving > 0 && (
              <span className="absolute right-4 top-4 rounded-oracle-full bg-lift-pos/15 px-2 py-0.5 text-caption font-semibold text-lift-strong">
                Save {naira(p.saving, status.currency)}
              </span>
            )}
            <p className="text-body-sm font-medium text-txt-secondary">{p.label}</p>
            <p className="mt-1 font-display text-h3 text-txt-primary">{naira(p.price, status.currency)}</p>
            <p className="text-caption text-txt-tertiary">
              {p.days} days of full access
              {p.days > 30 && ` · ${naira(Math.round(p.price / (p.days / 30)), status.currency)} a month`}
            </p>
            {plan === p.id && <Check className="absolute bottom-4 right-4 h-5 w-5 text-oracle-gold-dark" />}
          </button>
        ))}
      </div>

      <h2 className="mb-3 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">2 · Choose how to pay</h2>
      <div className="mb-7 grid gap-3 sm:grid-cols-2">
        {status.providers.map((p) => (
          <button
            key={p.id}
            disabled={!p.available}
            onClick={() => setProvider(p.id)}
            aria-pressed={provider === p.id}
            className={cn(
              'rounded-oracle-md border bg-white p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              provider === p.id ? 'border-oracle-gold ring-2 ring-oracle-gold/30' : 'border-warm-stone hover:border-oracle-gold/60',
            )}
          >
            <p className="font-display text-body font-semibold text-txt-primary">{p.label}</p>
            <p className="text-caption text-txt-tertiary">{p.available ? p.methods : 'Not available yet'}</p>
          </button>
        ))}
      </div>

      <button
        onClick={pay}
        disabled={busy || !chosenProvider?.available}
        className="inline-flex w-full items-center justify-center gap-2 rounded-oracle-md bg-txt-primary px-5 py-3.5 text-body font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy
          ? 'Opening the payment page…'
          : chosenProvider?.available
            ? `Pay ${naira(chosen.price, status.currency)} with ${chosenProvider.label}`
            : 'No payment option is available yet'}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-body-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-6 flex items-start gap-2 text-caption text-txt-tertiary">
        <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-oracle-gold-dark" />
        You pay on {chosenProvider?.label ?? 'the provider'}&apos;s secure page; OraQL never sees your card. It is a
        one-off payment: nothing renews by itself, and paying before your time runs out adds the days on top.
        OraQL is a research tool, not a promise of winnings. 18+ only.
      </p>
    </div>
  );
}

function StatusLine() {
  const status = useBillingStore((s) => s.status);
  if (!status) return null;
  const box = 'mb-6 rounded-oracle-md border px-4 py-3 text-body-sm';
  switch (status.state) {
    case 'TRIAL':
      return (
        <p className={cn(box, 'border-oracle-gold/40 bg-oracle-gold/10 text-txt-primary')}>
          Your free trial has <span className="font-semibold">{timeLeft(status.trialEndsAt)}</span> left. Subscribe now
          and the paid days start when you pay.
        </p>
      );
    case 'EXPIRED':
      return (
        <p className={cn(box, 'border-danger/30 bg-danger/5 text-txt-primary')}>
          {status.subscriptionEndsAt ? 'Your subscription has ended.' : 'Your free trial has ended.'} Subscribe to keep
          using OraQL.
        </p>
      );
    case 'ACTIVE':
      return (
        <p className={cn(box, 'border-lift-pos/30 bg-lift-pos/10 text-txt-primary')}>
          You are subscribed until <span className="font-semibold">{fmtDate(status.subscriptionEndsAt!)}</span>. Paying
          again adds the days on top.
        </p>
      );
    default:
      return (
        <p className={cn(box, 'border-warm-stone bg-warm-cream text-txt-secondary')}>
          {status.state === 'OFF'
            ? 'The paywall is switched off, so everyone has full access for now.'
            : 'Your account has full access without a subscription.'}
        </p>
      );
  }
}
