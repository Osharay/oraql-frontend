'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { AuthCard, buttonClass, publicPost } from '@/components/auth/AuthCard';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const token = useSearchParams()?.get('token') ?? '';
  const [state, setState] = useState<'checking' | 'ok' | 'bad'>(token ? 'checking' : 'bad');
  const [error, setError] = useState('This link is incomplete. Open it from the email again.');
  const once = useRef(false);

  useEffect(() => {
    if (!token || once.current) return;
    once.current = true; // a link works once, so never call it twice
    publicPost('/auth/verify-email', { token })
      .then(() => setState('ok'))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'This link did not work.');
        setState('bad');
      });
  }, [token]);

  if (state === 'checking') {
    return (
      <AuthCard title="Confirming your email">
        <p className="flex items-center gap-2 text-body-sm text-txt-secondary">
          <Loader2 className="h-4 w-4 animate-spin" /> One moment
        </p>
      </AuthCard>
    );
  }
  if (state === 'ok') {
    return (
      <AuthCard title="Email confirmed">
        <div className="flex gap-3 rounded-oracle-sm bg-lift-pos/10 p-4 text-body-sm text-txt-primary">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-lift-strong" />
          <p>Thanks — your email address is confirmed.</p>
        </div>
        <Link href="/dashboard" className={`${buttonClass} mt-6`}>Go to OraQL</Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="That link did not work">
      <div className="flex gap-3 rounded-oracle-sm bg-danger/10 p-4 text-body-sm text-txt-primary">
        <XCircle className="h-5 w-5 shrink-0 text-danger" />
        <p>{error}</p>
      </div>
      <p className="mt-4 text-body-sm text-txt-secondary">
        Sign in and use <span className="font-semibold">Send the link again</span> at the top of the page to get a fresh one.
      </p>
      <Link href="/dashboard" className={`${buttonClass} mt-6`}>Go to OraQL</Link>
    </AuthCard>
  );
}
