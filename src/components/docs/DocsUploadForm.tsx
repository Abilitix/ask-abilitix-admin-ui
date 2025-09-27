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
    const candidate = (qp || ls || 'legacy').toLowerCase();

    // Hard fail-closed to legacy if global flag is off
    if (!ENABLE_TUS_UI) {
      console.info('[UPLOAD] TUS UI disabled by flag -> legacy');
      setMode('legacy');
      return;
    }

    // Check required server env for TUS (we can't access server env on client, so we'll check proxy routes instead)
    // This will be validated when TUS actually tries to make API calls
    console.info('[UPLOAD] TUS UI enabled, checking mode...');

    // Only accept exactly 'tus' when explicitly requested
    const nextMode = candidate === 'tus' ? 'tus' : 'legacy';
    console.info('[UPLOAD] decided mode:', nextMode, { qp, ls, enableTusUi: ENABLE_TUS_UI });
    setMode(nextMode);
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