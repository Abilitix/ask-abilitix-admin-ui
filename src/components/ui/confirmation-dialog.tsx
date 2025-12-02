'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

type ConfirmationDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  loading?: boolean;
  loadingText?: string; // Custom loading text (e.g., "Deleting...", "Archiving...")
};

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
  loadingText,
}: ConfirmationDialogProps) {
  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, loading, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const variantStyles = {
    default: {
      icon: CheckCircle2,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    destructive: {
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <Card
        className="w-full max-w-md mx-4 bg-white shadow-2xl border-0 animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-2"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle
                id="confirmation-title"
                className="text-lg font-semibold text-slate-900 leading-tight"
              >
                {title}
              </CardTitle>
            </div>
            {!loading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-slate-100 -mt-1 -mr-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          <p
            id="confirmation-message"
            className="text-sm text-slate-600 leading-relaxed mb-6"
          >
            {message}
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="min-w-[80px]"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className={`min-w-[80px] ${style.confirmButton} transition-all ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {loadingText || 'Processing...'}
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

