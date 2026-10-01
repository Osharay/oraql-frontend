'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { backLabel, previousUrl } from '@/lib/navigation';

/**
 * Back to wherever the reader came from — the same tab, filter and scroll
 * position — or, for a page opened directly, to `fallbackHref`.
 */
export function BackLink({ fallbackHref, fallbackLabel }: { fallbackHref: string; fallbackLabel: string }) {
  const router = useRouter();
  const [prev, setPrev] = useState<string | null>(null);
  useEffect(() => setPrev(previousUrl()), []);

  return (
    <a
      href={prev ?? fallbackHref}
      onClick={(e) => {
        e.preventDefault();
        if (prev) router.back();
        else router.push(fallbackHref);
      }}
      className="inline-flex items-center gap-2 text-body-sm text-txt-secondary transition-colors hover:text-txt-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      {backLabel(prev, fallbackLabel)}
    </a>
  );
}
