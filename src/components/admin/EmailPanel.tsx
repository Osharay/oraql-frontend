'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, Loader2, Mail, Send } from 'lucide-react';
import { api } from '@/lib/api';

interface Campaign {
  id: string;
  subject: string;
  audience: 'ALL' | 'ONE';
  toEmail: string | null;
  recipients: number;
  sent: number;
  failed: number;
  status: 'SENDING' | 'SENT' | 'FAILED';
  createdAt: string;
}
interface Recipients {
  all: number;
  optedOut: number;
  willReceive: number;
}

const field =
  'w-full rounded-oracle-sm border border-warm-stone bg-white px-3 py-2 text-body-sm text-txt-primary focus:border-oracle-gold focus:outline-none';

/**
 * Write and send email from Engine controls: a newsletter to every user, or a
 * message to one person. Preview it, send yourself a test, then send.
 */
export function EmailPanel() {
  const [audience, setAudience] = useState<'ALL' | 'ONE'>('ALL');
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'preview' | 'test' | 'send'>(null);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<Campaign[]>([]);
  const [recipients, setRecipients] = useState<Recipients | null>(null);

  const payload = () => ({
    subject: subject.trim(),
    body,
    audience,
    ...(audience === 'ONE' ? { toEmail: toEmail.trim() } : {}),
    ...(buttonText.trim() && buttonUrl.trim() ? { buttonText: buttonText.trim(), buttonUrl: buttonUrl.trim() } : {}),
  });

  const loadHistory = useCallback(() => {
    api.get<Campaign[]>('/mail/campaigns?limit=20').then(setHistory).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadHistory();
    api.get<Recipients>('/mail/recipients').then(setRecipients).catch(() => undefined);
  }, [loadHistory]);

  // While a newsletter is going out, keep its counts fresh.
  useEffect(() => {
    if (!history.some((c) => c.status === 'SENDING')) return;
    const t = setTimeout(loadHistory, 3000);
    return () => clearTimeout(t);
  }, [history, loadHistory]);

  const run = async (kind: 'preview' | 'test' | 'send') => {
    setBusy(kind);
    setNote(null);
    try {
      if (kind === 'preview') {
        const r = await api.post<{ html: string }>('/mail/campaigns/preview', payload());
        setPreview(r.html);
      } else if (kind === 'test') {
        const r = await api.post<{ sentTo: string }>('/mail/campaigns/test', payload());
        setNote({ ok: true, text: `Test sent to ${r.sentTo}.` });
      } else {
        const c = await api.post<Campaign>('/mail/campaigns', payload());
        setNote({ ok: true, text: audience === 'ALL' ? `Sending to ${c.recipients} people…` : `Sent to ${c.toEmail}.` });
        setConfirming(false);
        setSubject('');
        setBody('');
        setButtonText('');
        setButtonUrl('');
        setPreview(null);
        loadHistory();
      }
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong' });
    } finally {
      setBusy(null);
    }
  };

  const ready = subject.trim() && body.trim() && (audience === 'ALL' || toEmail.includes('@'));
  const count = recipients?.willReceive;

  return (
    <section className="mb-6 rounded-oracle-md border border-warm-stone bg-white p-6 shadow-soft">
      <div className="mb-1 flex items-center gap-2">
        <Mail className="h-5 w-5 text-oracle-gold" />
        <h2 className="font-display text-h4 text-txt-primary">Email users</h2>
      </div>
      <p className="mb-4 text-body-sm text-txt-tertiary">
        A newsletter to every user, or a message to one person. Sent from OraQL &lt;hello@oraql.live&gt; in the OraQL design.
      </p>

      <div className="mb-4 flex flex-wrap gap-2 text-body-sm">
        {(
          [
            ['ALL', `Newsletter · everyone${count != null ? ` (${count})` : ''}`],
            ['ONE', 'One person'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setAudience(k);
              setConfirming(false);
            }}
            className={`rounded-oracle-full border px-4 py-1.5 font-medium ${
              audience === k ? 'border-oracle-gold bg-oracle-gold/10 text-txt-primary' : 'border-warm-stone text-txt-tertiary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {audience === 'ONE' && (
          <input type="email" placeholder="Their email address" value={toEmail} onChange={(e) => setToEmail(e.target.value)} className={field} />
        )}
        <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className={field} />
        <textarea
          placeholder={'Your message.\n\nLeave a blank line between paragraphs. **bold** makes text bold, and [words](https://www.oraql.live) makes a link.'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={9}
          className={`${field} resize-y`}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Button text (optional)" value={buttonText} onChange={(e) => setButtonText(e.target.value)} maxLength={60} className={field} />
          <input placeholder="Button link, https://… (optional)" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} className={field} />
        </div>
        <p className="text-caption text-txt-tertiary">
          {audience === 'ALL'
            ? `Each person is greeted by first name and gets an unsubscribe link.${recipients?.optedOut ? ` ${recipients.optedOut} who unsubscribed are skipped.` : ''}`
            : 'Greeted by first name if they have an account. No unsubscribe link, since it is a direct message.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => run('preview')} disabled={!ready || !!busy} className="inline-flex items-center gap-2 rounded-oracle-sm border border-warm-stone px-4 py-2 text-body-sm font-semibold text-txt-primary hover:bg-warm-cream disabled:opacity-40">
          {busy === 'preview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Preview
        </button>
        <button onClick={() => run('test')} disabled={!ready || !!busy} className="inline-flex items-center gap-2 rounded-oracle-sm border border-warm-stone px-4 py-2 text-body-sm font-semibold text-txt-primary hover:bg-warm-cream disabled:opacity-40">
          {busy === 'test' && <Loader2 className="h-4 w-4 animate-spin" />} Send me a test
        </button>
        {!confirming ? (
          <button onClick={() => setConfirming(true)} disabled={!ready || !!busy} className="inline-flex items-center gap-2 rounded-oracle-sm bg-dark-ink px-4 py-2 text-body-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
            <Send className="h-4 w-4" /> Send
          </button>
        ) : (
          <>
            <button onClick={() => run('send')} disabled={!!busy} className="inline-flex items-center gap-2 rounded-oracle-sm bg-oracle-gold-dark px-4 py-2 text-body-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
              {busy === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {audience === 'ALL' ? `Yes, send to ${count ?? 'everyone'}` : `Yes, send to ${toEmail.trim()}`}
            </button>
            <button onClick={() => setConfirming(false)} className="text-body-sm text-txt-tertiary hover:text-txt-primary">
              Cancel
            </button>
          </>
        )}
      </div>
      {note && <p className={`mt-3 text-body-sm ${note.ok ? 'text-lift-strong' : 'text-danger'}`}>{note.text}</p>}

      {preview && (
        <div className="mt-5 overflow-hidden rounded-oracle-sm border border-warm-stone">
          <p className="border-b border-warm-sand bg-warm-cream px-3 py-1.5 text-caption text-txt-tertiary">Preview — greeted as &quot;Ada&quot;</p>
          <iframe title="Email preview" srcDoc={preview} sandbox="" className="h-[560px] w-full bg-white" />
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-caption font-semibold uppercase tracking-wide text-txt-tertiary">Sent</h3>
          <ul className="divide-y divide-warm-sand text-body-sm">
            {history.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline gap-x-3 py-2">
                <span className="font-medium text-txt-primary">{c.subject}</span>
                <span className="text-caption text-txt-tertiary">
                  {c.audience === 'ALL' ? 'Newsletter' : `To ${c.toEmail}`} ·{' '}
                  {new Date(c.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={`ml-auto text-caption font-semibold ${c.status === 'FAILED' ? 'text-danger' : c.status === 'SENDING' ? 'text-oracle-gold-dark' : 'text-lift-strong'}`}>
                  {c.status === 'SENDING' ? `Sending ${c.sent}/${c.recipients}` : `${c.sent} of ${c.recipients} sent`}
                  {c.failed > 0 && ` · ${c.failed} failed`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
