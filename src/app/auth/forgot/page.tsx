'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthCard, buttonClass, inputClass, publicPost } from '@/components/auth/AuthCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setState('sending');
    try {
      await publicPost('/auth/forgot-password', { email: email.trim() });
      setState('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setState('idle');
    }
  };

  if (state === 'sent') {
    return (
      <AuthCard title="Check your email">
        <div className="flex gap-3 rounded-oracle-sm bg-lift-pos/10 p-4 text-body-sm text-txt-primary">
          <MailCheck className="h-5 w-5 shrink-0 text-lift-strong" />
          <p>
            If <span className="font-semibold">{email.trim()}</span> has an OraQL account, a link to reset the password is
            on its way. It works for 1 hour. Check your spam folder if it does not arrive in a few minutes.
          </p>
        </div>
        <Link href="/auth" className="mt-6 inline-block text-body-sm font-semibold text-oracle-gold-dark hover:underline">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter the email you signed up with and we will send you a link to set a new one.">
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        {error && <p className="rounded-oracle-sm bg-danger/10 px-4 py-3 text-body-sm text-danger">{error}</p>}
        <button type="submit" disabled={state === 'sending'} className={buttonClass}>
          {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </button>
      </form>
      <Link href="/auth" className="mt-6 inline-block text-body-sm font-semibold text-oracle-gold-dark hover:underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
