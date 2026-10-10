'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AuthCard, buttonClass, inputClass, publicPost } from '@/components/auth/AuthCard';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <Reset />
    </Suspense>
  );
}

function Reset() {
  const token = useSearchParams()?.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setState('saving');
    try {
      await publicPost('/auth/reset-password', { token, password });
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setState('idle');
    }
  };

  if (!token) {
    return (
      <AuthCard title="This link is incomplete" subtitle="Open the link from the email again, or ask for a new one.">
        <Link href="/auth/forgot" className={buttonClass}>Ask for a new link</Link>
      </AuthCard>
    );
  }

  if (state === 'done') {
    return (
      <AuthCard title="Password changed">
        <div className="flex gap-3 rounded-oracle-sm bg-lift-pos/10 p-4 text-body-sm text-txt-primary">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-lift-strong" />
          <p>Your new password is set, and every device was signed out. Sign in with the new password.</p>
        </div>
        <Link href="/auth" className={`${buttonClass} mt-6`}>Sign in</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle="At least 8 characters.">
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            required
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-11`}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-3.5 text-txt-tertiary" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <input
          type={show ? 'text' : 'password'}
          required
          placeholder="Type it again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
        />
        {error && (
          <p className="rounded-oracle-sm bg-danger/10 px-4 py-3 text-body-sm text-danger">
            {error}{' '}
            {/expired|used/.test(error) && (
              <Link href="/auth/forgot" className="font-semibold underline">Ask for a new link</Link>
            )}
          </p>
        )}
        <button type="submit" disabled={state === 'saving'} className={buttonClass}>
          {state === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
          Save new password
        </button>
      </form>
    </AuthCard>
  );
}
