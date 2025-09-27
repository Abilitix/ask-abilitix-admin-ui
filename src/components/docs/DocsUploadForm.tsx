'use client';

import { TusUploadForm } from './TusUploadForm';

type DocsUploadFormProps = {
  onDone?: () => void;
};

export function DocsUploadForm({ onDone }: DocsUploadFormProps) {
  // Use TUS upload form by default, with legacy fallback
  return <TusUploadForm onDone={onDone} />;
}