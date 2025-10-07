'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TusUploadForm } from './TusUploadForm';
import { LegacyUploadForm } from './LegacyUploadForm';

type DocsUploadFormProps = {
  onDone?: () => void;
};

// Optional: server flag to globally allow TUS in prod (default off)
const ENABLE_TUS_UI = process.env.NEXT_PUBLIC_ENABLE_TUS_UI === '1';

export function DocsUploadForm(props: DocsUploadFormProps) {
  const params = useSearchParams();
  const [mode, setMode] = useState<'deciding' | 'tus' | 'legacy'>('deciding');

  useEffect(() => {
    // Decide once, on client, then render
    const qp = params?.get('uploadMode');            // e.g. ?uploadMode=tus
    const ls = typeof window !== 'undefined' ? localStorage.getItem('uploadMode') : null;
    const pref = (qp || ls || '').toLowerCase();
    const force = params?.get('force') === '1';

    // If force=1, always render TUS for canary testing regardless of global flag
    if (force) {
      console.info('[UPLOAD] Force TUS via query param');
      setMode('tus');
      if (typeof window !== 'undefined') (window as any).__uploader = 'tus';
      return;
    }

    // Hard fail-closed to legacy if global flag is off
    if (!ENABLE_TUS_UI) {
      console.info('[UPLOAD] TUS UI disabled by flag -> legacy');
      setMode('legacy');
      if (typeof window !== 'undefined') (window as any).__uploader = 'legacy';
      return;
    }

    // TUS only when explicitly requested via pref
    const nextMode = pref === 'tus' ? 'tus' : 'legacy';
    console.info('[UPLOAD] decided mode:', nextMode, { qp, ls, enableTusUi: ENABLE_TUS_UI, force });
    setMode(nextMode);
    if (typeof window !== 'undefined') (window as any).__uploader = nextMode;
  }, [params]);

  if (mode === 'deciding') {
    // lightweight guard to avoid flicker/hydration oddities
    return null;
  }

  if (mode === 'tus') {
    // Visible breadcrumb for your quick checks
    console.info('[UPLOAD] Rendering TusUploadForm');
    return <TusUploadForm {...props} />;
  }

  console.info('[UPLOAD] Rendering LegacyUploadForm');
  return <LegacyUploadForm {...props} />;
}