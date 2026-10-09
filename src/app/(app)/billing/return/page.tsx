'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useBillingStore } from '@/stores/billing.store';

export default function BillingReturnPage() {
  return (
    <Suspense fallback={null}>
      <Return />
    </Suspense>
  );
}

/**
 * Where Flutterwave and Bachs send the user back. The payment is checked with
 * the provider from our server; the provider's own webhook does the same, so
 * access is given even if this page is closed early. Retries for a while,
 * because a bank transfer can take a minute to show as paid.
 */
function Return() {
  const params = useSearchParams();
  const reference = params?.get('reference') ?? params?.get('tx_ref');
  const failed = params?.get('status') === 'cancelled' || params?.get('status') === 'failed';
  const load = useBillingStore((s) => s.load);
  const [state, setState] = useState<'checking' | 'paid' | 'pending' | 'failed'>(failed ? 'failed' : 'checking');
  const [until, setUntil] = useState<string | null>(null);
  const [bought, setBought] = useState<string | null>(null);
  const tries = useRef(0);

  useEffect(() => {
    if (!reference || failed) {
      setState('failed');
      return;
    }
    let stop = false;
    const check = async () => {
      tries.current += 1;
      try {
        const res = await api.post<{ paid: boolean; subscriptionEndsAt?: string | null; plan?: string | null; amount?: number | null; currency?: string | null }>('/billing/confirm', { reference });
        if (stop) return;
        if (res.paid) {
          setUntil(res.subscriptionEndsAt ?? null);
          if (res.plan && res.amount != null) {
            const label = res.plan === 'QUARTERLY' ? '3 months' : '1 month';
            const price = res.currency === 'NGN' || !res.currency ? `₦${res.amount.toLocaleString('en-NG')}` : `${res.currency} ${res.amount.toLocaleString()}`;
            setBought(`${label} · ${price}`);
          }
          setState('paid');
          load();
          return;
        }
      } catch {
        // checked again below
      }
      if (stop) return;
      if (tries.current < 12) {
        setState('checking');
        setTimeout(check, 5000);
      } else setState('pending');
    };
    check();
    return () => {
      stop = true;
    };
  }, [reference, failed, load]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      {state === 'checking' && (
        <>
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-oracle-gold" />
          <h1 className="font-display text-h3 text-txt-primary">Confirming your payment</h1>
          <p className="mt-2 text-body text-txt-secondary">This usually takes a few seconds. Please keep this page open.</p>
        </>
      )}
      {state === 'paid' && (
        <>
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-lift-strong" />
          <h1 className="font-display text-h3 text-txt-primary">You are subscribed</h1>
          <p className="mt-2 text-body text-txt-secondary">
            {until
              ? `Full access until ${new Date(until).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}.`
              : 'Full access is on.'}
          </p>
          {bought && <p className="mt-1 text-body-sm font-semibold text-txt-primary">Paid: {bought}</p>}
          <Link href="/dashboard" className="mt-6 inline-block rounded-oracle-md bg-txt-primary px-5 py-3 text-body font-semibold text-white hover:opacity-90">
            Go to the dashboard
          </Link>
        </>
      )}
      {state === 'pending' && (
        <>
          <Loader2 className="mx-auto mb-4 h-10 w-10 text-oracle-gold" />
          <h1 className="font-display text-h3 text-txt-primary">Still waiting for the payment to clear</h1>
          <p className="mt-2 text-body text-txt-secondary">
            If you paid, access switches on by itself as soon as the payment provider confirms it — you do not need to
            pay again. Check back in a few minutes.
          </p>
          <Link href="/subscribe" className="mt-6 inline-block text-body-sm font-semibold text-oracle-gold-dark hover:underline">
            Back to Subscribe
          </Link>
        </>
      )}
      {state === 'failed' && (
        <>
          <XCircle className="mx-auto mb-4 h-12 w-12 text-danger" />
          <h1 className="font-display text-h3 text-txt-primary">The payment did not go through</h1>
          <p className="mt-2 text-body text-txt-secondary">Nothing was charged. You can try again with either option.</p>
          <Link href="/subscribe" className="mt-6 inline-block rounded-oracle-md bg-txt-primary px-5 py-3 text-body font-semibold text-white hover:opacity-90">
            Try again
          </Link>
        </>
      )}
    </div>
  );
}
