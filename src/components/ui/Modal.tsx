'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Application modal.
 *
 * Replaces window.confirm, which cannot be styled, ignores the design system
 * and blocks the whole tab while it is open.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes, and focus moves into the dialog so keyboard users are not
  // left behind the backdrop.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-dark-ink/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={cn(
          'relative w-full max-w-md rounded-oracle-md border border-warm-stone bg-warm-white shadow-card',
          'animate-slide-up',
          className,
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-oracle-sm p-1 text-txt-tertiary transition-colors duration-normal hover:bg-warm-cream hover:text-txt-primary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <h2
            id="modal-title"
            className="pr-8 font-display text-h4 text-txt-primary"
          >
            {title}
          </h2>

          {description && (
            <p className="mt-2 text-body text-txt-secondary">{description}</p>
          )}

          {children && <div className="mt-4">{children}</div>}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-warm-stone px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
