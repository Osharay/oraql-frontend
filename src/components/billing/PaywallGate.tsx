'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { timeLeft, useBillingStore } from '@/stores/billing.store';

/** Pages a lapsed account can still open. */
const OPEN = ['/subscribe', '/billing'];

/**
 * Sends an account whose trial or paid period has ended to Subscribe, and
 * shows how long is left while it runs. The API refuses lapsed accounts as
 * well (402), so this is the friendly half, not the lock itself.
 */
export function PaywallGate() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { status, load } = useBillingStore();

  useEffect(() => {
    load();
    // Re-check now and then, so a trial that runs out mid-visit is noticed.
    const t = setInterval(load, 5 * 60_000);
    return () => clearInterval(t);
  }, [load]);

  const open = OPEN.some((p) => pathname.startsWith(p));
  useEffect(() => {
    if (status && !status.allowed && !open) router.replace('/subscribe');
  }, [status, open, router]);

  if (!status || open) return null;

  if (status.state === 'TRIAL') {
    return (
      <Banner>
        Free trial: <span className="font-semibold">{timeLeft(status.trialEndsAt)}</span> left.
      </Banner>
    );
  }
  if (status.state === 'ACTIVE' && status.subscriptionEndsAt) {
    const left = new Date(status.subscriptionEndsAt).getTime() - Date.now();
    if (left < 3 * 86_400_000) {
      return (
        <Banner>
          Your subscription ends in <span className="font-semibold">{timeLeft(status.subscriptionEndsAt)}</span>.
        </Banner>
      );
    }
  }
  return null;
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-oracle-gold/40 bg-oracle-gold/10 px-4 py-2 text-body-sm text-txt-primary">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-oracle-gold-dark" />
        <span>{children}</span>
      </span>
      <Link href="/subscribe" className="font-semibold text-oracle-gold-dark underline-offset-2 hover:underline">
        Subscribe
      </Link>
    </div>
  );
}
