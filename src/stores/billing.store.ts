'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

export type AccessState = 'ADMIN' | 'COMP' | 'OFF' | 'TRIAL' | 'ACTIVE' | 'EXPIRED';
export type PlanId = 'MONTHLY' | 'QUARTERLY';
export type ProviderId = 'FLUTTERWAVE' | 'BACHS';

export interface BillingStatus {
  state: AccessState;
  allowed: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  currency: string;
  trialDays: number;
  /** The plan of the running paid period, if any. */
  currentPlan?: PlanId | null;
  plans: Array<{
    id: PlanId;
    label: string;
    price: number;
    days: number;
    saving: number;
    /** False while a paid period runs, except an upgrade or a renewal in its last days. */
    buyable?: boolean;
    note?: string | null;
    renewFrom?: string | null;
  }>;
  providers: Array<{ id: ProviderId; label: string; methods: string; available: boolean }>;
}

interface BillingStore {
  status: BillingStatus | null;
  load: () => Promise<BillingStatus | null>;
}

export const useBillingStore = create<BillingStore>((set) => ({
  status: null,
  load: async () => {
    try {
      const status = await api.get<BillingStatus>('/billing/status');
      set({ status });
      return status;
    } catch {
      return null;
    }
  },
}));

/** "1 day 6 hours", "5 hours", "20 minutes". */
export function timeLeft(until: string | null | undefined, now = Date.now()): string {
  if (!until) return '';
  const ms = new Date(until).getTime() - now;
  if (ms <= 0) return 'no time';
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d} day${d === 1 ? '' : 's'}${h % 24 ? ` ${h % 24} hour${h % 24 === 1 ? '' : 's'}` : ''}`;
  if (h >= 1) return `${h} hour${h === 1 ? '' : 's'}`;
  const m = Math.max(1, Math.floor(ms / 60_000));
  return `${m} minute${m === 1 ? '' : 's'}`;
}

export const naira = (n: number, currency = 'NGN') =>
  currency === 'NGN' ? `₦${n.toLocaleString('en-NG')}` : `${currency} ${n.toLocaleString()}`;
