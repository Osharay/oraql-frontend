'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Where Google sends the browser back to.
 *
 * The API redirects here with the token pair in the query string. Nothing was
 * listening, so "Continue with Google" ended at a 404 and no session was ever
 * stored. This consumes the tokens and strips them from the URL straight away,
 * so they do not sit in history or leak through a referrer.
 */
function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const loadUser = useAuthStore((s) => s.loadUser);
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = params?.get('accessToken');
    const refreshToken = params?.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setError('That sign-in link did not carry a session. Please try again.');
      return;
    }

    api.setTokens({ accessToken, refreshToken });

    // Drop the tokens from the address bar before anything else can read them.
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/auth/callback');
    }

    loadUser()
      .then(() => router.replace('/dashboard'))
      .catch(() => setError('Signed in, but your account could not be loaded.'));
  }, [params, router, loadUser]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-white px-6">
        <div className="max-w-md rounded-oracle-md border border-warm-stone bg-white p-8 text-center shadow-soft">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-txt-tertiary" />
          <h1 className="font-display text-h4 text-txt-primary">Sign-in did not complete</h1>
          <p className="mt-2 text-body-sm text-txt-secondary">{error}</p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-oracle-sm bg-dark-ink px-5 py-2.5 text-body-sm font-medium text-txt-inverse transition-colors hover:bg-dark-charcoal"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return <Waiting />;
}

function Waiting() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-white">
      <div className="flex animate-fade-in flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-oracle-md bg-dark-ink">
          <Trophy className="h-7 w-7 text-oracle-gold" />
        </div>
        <p className="text-body-sm text-txt-tertiary">Signing you in</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Waiting />}>
      <Callback />
    </Suspense>
  );
}
