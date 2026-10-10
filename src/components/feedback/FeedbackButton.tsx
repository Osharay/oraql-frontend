'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, MessageSquare, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useBuilderStore } from '@/stores/builder.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
type Sentiment = 'POSITIVE' | 'NEGATIVE';

/**
 * A feedback button on every page: thumbs up or down and a few words, from
 * anyone, signed in or not. It sits above the Bet Builder bar when that shows.
 */
export default function FeedbackButton() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const builderOpen = useBuilderStore((s) => s.selections.length > 0);
  const [open, setOpen] = useState(false);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const reset = () => {
    setSentiment(null);
    setMessage('');
    setState('idle');
  };

  const send = async () => {
    if (!sentiment) return;
    setState('sending');
    const from = user?.email ?? email.trim();
    try {
      const res = await fetch(`${API_BASE}/api/v1/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment,
          ...(message.trim() ? { message: message.trim() } : {}),
          ...(from ? { email: from } : {}),
          page: pathname ?? undefined,
        }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  const choice = (s: Sentiment, label: string, Icon: typeof ThumbsUp) => (
    <button
      type="button"
      onClick={() => setSentiment(s)}
      aria-pressed={sentiment === s}
      className={`flex flex-1 items-center justify-center gap-2 rounded-oracle-sm border px-3 py-2.5 text-body-sm font-medium transition-colors ${
        sentiment === s
          ? s === 'POSITIVE'
            ? 'border-lift-strong bg-lift-pos/15 text-txt-primary'
            : 'border-danger bg-danger/10 text-txt-primary'
          : 'border-warm-stone bg-white text-txt-secondary hover:border-oracle-gold/60'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className={`fixed right-4 z-40 transition-all ${builderOpen ? 'bottom-24' : 'bottom-4'} sm:right-6`}>
      {open && (
        <div
          role="dialog"
          aria-label="Send feedback"
          className="mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-oracle-md border border-warm-stone bg-warm-white p-4 shadow-card"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-body font-semibold text-txt-primary">What do you think of OraQL?</p>
              <p className="text-caption text-txt-tertiary">Good or bad, we read every message.</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-txt-tertiary hover:text-txt-primary">
              <X className="h-4 w-4" />
            </button>
          </div>

          {state === 'sent' ? (
            <div className="py-4 text-center">
              <p className="text-body font-semibold text-txt-primary">Thank you</p>
              <p className="mt-1 text-body-sm text-txt-secondary">Your feedback has been sent.</p>
              <button onClick={reset} className="mt-3 text-body-sm font-semibold text-oracle-gold-dark hover:underline">
                Send more
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {choice('POSITIVE', 'I like it', ThumbsUp)}
                {choice('NEGATIVE', 'Needs work', ThumbsDown)}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder={
                  sentiment === 'NEGATIVE'
                    ? 'What went wrong, or what should we change?'
                    : 'What do you like, or what would you add?'
                }
                className="mt-3 w-full resize-none rounded-oracle-sm border border-warm-stone bg-white px-3 py-2 text-body-sm outline-none focus:border-oracle-gold focus:ring-2 focus:ring-oracle-gold/20"
              />
              {!user && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional, if you'd like a reply)"
                  className="mt-2 w-full rounded-oracle-sm border border-warm-stone bg-white px-3 py-2 text-body-sm outline-none focus:border-oracle-gold focus:ring-2 focus:ring-oracle-gold/20"
                />
              )}
              {state === 'error' && (
                <p role="alert" className="mt-2 text-caption text-danger">
                  It could not be sent. Check the email address, or try again in a minute.
                </p>
              )}
              <button
                onClick={send}
                disabled={!sentiment || state === 'sending'}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-oracle-sm bg-dark-ink px-4 py-2.5 text-body-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                {sentiment ? 'Send feedback' : 'Choose one above first'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-oracle-full bg-dark-ink px-4 py-2.5 text-body-sm font-semibold text-white shadow-card hover:bg-dark-charcoal"
        >
          <MessageSquare className="h-4 w-4 text-oracle-gold" />
          Feedback
        </button>
      </div>
    </div>
  );
}
