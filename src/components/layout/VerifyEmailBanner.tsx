'use client';

import { useState } from 'react';
import { MailWarning } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

/** A reminder, not a lock: the app works while the email is unconfirmed. */
export function VerifyEmailBanner() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [hidden, setHidden] = useState(false);
  if (!user || user.emailVerified !== false || hidden) return null;

  const send = async () => {
    setState('sending');
    try {
      await api.post('/auth/resend-verification', {});
      setState('sent');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1 rounded-oracle-sm border border-oracle-gold/40 bg-oracle-gold/10 px-4 py-3 text-body-sm text-txt-primary sm:mx-6 lg:mx-auto">
      <MailWarning className="h-4 w-4 shrink-0 text-oracle-gold-dark" />
      <span className="flex-1">
        {state === 'sent'
          ? `A new link is on its way to ${user.email}.`
          : `Please confirm your email — we sent a link to ${user.email}.`}
        {state === 'error' && ' It could not be sent; try again in a few minutes.'}
      </span>
      {state !== 'sent' && (
        <button onClick={send} disabled={state === 'sending'} className="font-semibold text-oracle-gold-dark hover:underline disabled:opacity-50">
          {state === 'sending' ? 'Sending…' : 'Send the link again'}
        </button>
      )}
      <button onClick={() => setHidden(true)} className="text-txt-tertiary hover:text-txt-primary" aria-label="Hide">
        ×
      </button>
    </div>
  );
}
