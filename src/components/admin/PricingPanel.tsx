'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { naira } from '@/stores/billing.store';

interface Settings {
  monthlyPrice: number;
  quarterlyPrice: number;
  trialDays: number;
  paywallEnabled: boolean;
  currency: string;
}
interface Payments {
  payments: Array<{
    reference: string;
    provider: string;
    plan: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    paidAt: string | null;
    user: { email: string };
  }>;
  last30Days: { paid: number; revenue: number };
  activeSubscribers: number;
}

/**
 * Prices, the trial length and the paywall switch, changed here without a
 * deploy. A new price applies to the next checkout; a new trial length to
 * the next sign-up. Admins and comp (PREMIUM) accounts are never charged.
 */
export function PricingPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [payments, setPayments] = useState<Payments | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    api.get<Settings>('/billing/settings').then((v) => {
      setS(v);
      setDraft(v);
    }).catch((e) => setNote(e instanceof Error ? e.message : 'Could not load'));
    api.get<Payments>('/billing/payments?limit=20').then(setPayments).catch(() => undefined);
  }, []);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setNote(null);
    try {
      const v = await api.put<Settings>('/billing/settings', {
        monthlyPrice: Number(draft.monthlyPrice),
        quarterlyPrice: Number(draft.quarterlyPrice),
        trialDays: Number(draft.trialDays),
        paywallEnabled: draft.paywallEnabled,
      });
      setS(v);
      setDraft(v);
      setNote('Saved. New prices apply to the next checkout.');
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const changed = !!(s && draft) && JSON.stringify(s) !== JSON.stringify(draft);
  const field = 'w-full rounded-oracle-sm border border-warm-stone bg-white px-3 py-2 text-body-sm text-txt-primary focus:border-oracle-gold focus:outline-none';

  return (
    <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft">
      <div className="mb-2 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-oracle-gold" />
        <h2 className="font-display text-h4 text-txt-primary">Pricing and subscriptions</h2>
      </div>
      {!draft && !note && (
        <p className="flex items-center gap-2 text-body-sm text-txt-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading
        </p>
      )}
      {draft && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <label className="text-body-sm text-txt-secondary">
              1 month (₦)
              <input type="number" min={100} className={field} value={draft.monthlyPrice} onChange={(e) => setDraft({ ...draft, monthlyPrice: Number(e.target.value) })} />
            </label>
            <label className="text-body-sm text-txt-secondary">
              3 months (₦)
              <input type="number" min={100} className={field} value={draft.quarterlyPrice} onChange={(e) => setDraft({ ...draft, quarterlyPrice: Number(e.target.value) })} />
            </label>
            <label className="text-body-sm text-txt-secondary">
              Free trial (days)
              <input type="number" min={0} max={60} className={field} value={draft.trialDays} onChange={(e) => setDraft({ ...draft, trialDays: Number(e.target.value) })} />
            </label>
          </div>
          <label className="mb-4 flex items-center gap-2 text-body-sm text-txt-primary">
            <input type="checkbox" checked={draft.paywallEnabled} onChange={(e) => setDraft({ ...draft, paywallEnabled: e.target.checked })} />
            Paywall on — when off, everyone has full access and no one is asked to pay
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={save}
              disabled={!changed || saving}
              className="rounded-oracle-md bg-txt-primary px-4 py-2 text-body-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {note && <p className="text-body-sm text-txt-secondary">{note}</p>}
          </div>
        </>
      )}
      {payments && (
        <div className="mt-6 border-t border-warm-sand pt-4">
          <p className="mb-3 text-body-sm text-txt-secondary">
            <span className="font-semibold text-txt-primary">{payments.activeSubscribers}</span> active subscriber
            {payments.activeSubscribers === 1 ? '' : 's'} · last 30 days: {payments.last30Days.paid} paid,{' '}
            {naira(payments.last30Days.revenue)}
          </p>
          {payments.payments.length === 0 ? (
            <p className="text-body-sm text-txt-tertiary">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-warm-sand rounded-oracle-sm border border-warm-sand">
              {payments.payments.map((p) => (
                <li key={p.reference} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2 text-body-sm">
                  <span className="text-txt-primary">
                    {p.user.email}
                    <span className="text-txt-tertiary"> · {p.plan === 'MONTHLY' ? '1 month' : '3 months'} · {p.provider === 'BACHS' ? 'Bachs' : 'Flutterwave'}</span>
                  </span>
                  <span className={p.status === 'PAID' ? 'text-lift-strong' : 'text-txt-tertiary'}>
                    {naira(p.amount, p.currency)} · {p.status.toLowerCase()} · {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
