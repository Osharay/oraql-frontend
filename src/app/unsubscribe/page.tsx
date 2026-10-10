'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { AuthCard, buttonClass, publicPost } from '@/components/auth/AuthCard';

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <Unsubscribe />
    </Suspense>
  );
}

/** One click to stop newsletters. Account emails (receipts, password resets) still go. */
function Unsubscribe() {
  const params = useSearchParams();
  const u = params?.get('u') ?? '';
  const s = params?.get('s') ?? '';
  const [state, setState] = useState<'idle' | 'working' | 'done'>('idle');
  const [error, setError] = useState('');

  const go = async () => {
    setState('working');
    setError('');
    try {
      await publicPost('/mail/unsubscribe', { u, s });
      setState('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setState('idle');
    }
  };

  if (!u || !s) {
    return (
      <AuthCard title="Unsubscribe" subtitle="Open the unsubscribe link at the bottom of an OraQL newsletter to stop receiving them." >
        <Link href="/" className={buttonClass}>Go to OraQL</Link>
      </AuthCard>
    );
  }
  if (state === 'done') {
    return (
      <AuthCard title="You are unsubscribed">
        <div className="flex gap-3 rounded-oracle-sm bg-lift-pos/10 p-4 text-body-sm text-txt-primary">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-lift-strong" />
          <p>You will not get OraQL newsletters any more. Emails about your account and payments still come.</p>
        </div>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Stop OraQL newsletters?" subtitle="You will still get emails about your account, like receipts and password resets.">
      {error && <p className="mb-4 rounded-oracle-sm bg-danger/10 px-4 py-3 text-body-sm text-danger">{error}</p>}
      <button onClick={go} disabled={state === 'working'} className={buttonClass}>
        {state === 'working' && <Loader2 className="h-4 w-4 animate-spin" />}
        Unsubscribe
      </button>
    </AuthCard>
  );
}
