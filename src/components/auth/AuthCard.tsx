import Link from 'next/link';
import { Trophy } from 'lucide-react';

/** The small centred card used by the forgot, reset, verify and unsubscribe pages. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-white px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-oracle-sm bg-dark-ink">
            <Trophy className="h-5 w-5 text-oracle-gold" />
          </div>
          <span className="font-display text-display-sm tracking-tight text-txt-primary">OraQL_</span>
        </Link>
        <div className="rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft sm:p-8">
          <h1 className="font-display text-h3 tracking-tight text-txt-primary">{title}</h1>
          {subtitle && <p className="mt-2 text-body-sm text-txt-secondary">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** A sign-in-free call to the API; throws the server's message on failure. */
export async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = (json as { message?: string | string[] }).message;
    throw new Error(Array.isArray(m) ? m[0] : m || (res.status === 429 ? 'Too many tries — wait a few minutes and try again.' : 'Something went wrong. Please try again.'));
  }
  return json as T;
}

export const inputClass =
  'w-full rounded-oracle-sm border border-warm-stone bg-white px-4 py-3 text-body outline-none transition-all placeholder:text-txt-tertiary focus:border-oracle-gold focus:ring-2 focus:ring-oracle-gold/20';
export const buttonClass =
  'flex w-full items-center justify-center gap-2 rounded-oracle-sm bg-dark-ink px-5 py-3 font-display text-body font-semibold text-txt-inverse transition-all hover:bg-dark-charcoal disabled:cursor-not-allowed disabled:opacity-50';
