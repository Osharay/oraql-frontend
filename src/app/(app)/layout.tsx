'use client';

import { useCallback, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { BuilderBar } from '@/components/builder/BuilderBar';
import { AuthGuard } from '@/components/layout/AuthGuard';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = useCallback(() => setMenuOpen(false), []);

  return (
    <AuthGuard>
      {/* min-w-0 lets the main column shrink below its content's intrinsic
          width instead of pushing the page sideways — a flex child defaults
          to min-width:auto, which is where most of the horizontal scrolling
          on phones came from. */}
      <div className="flex min-h-screen bg-warm-white">
        <Sidebar open={menuOpen} onClose={close} />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader onOpen={() => setMenuOpen(true)} />
          {/* The rail only reserves space from lg up, where it is permanent. */}
          <main className="min-w-0 flex-1 pb-28 lg:ml-64">{children}</main>
        </div>

        <BuilderBar />
      </div>
    </AuthGuard>
  );
}
