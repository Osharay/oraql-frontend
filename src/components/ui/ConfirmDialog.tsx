'use client';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** Consequences worth reading before agreeing — cost, scope, irreversibility. */
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'gold' | 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {details && details.length > 0 && (
        <ul className="space-y-2 rounded-oracle-sm border border-warm-stone bg-warm-cream p-4">
          {details.map((d, i) => (
            <li key={i} className="text-body-sm text-txt-secondary">
              {d}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
