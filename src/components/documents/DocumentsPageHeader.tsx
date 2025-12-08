'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';

type DocumentsPageHeaderProps = {
  canManage: boolean;
};

export function DocumentsPageHeader({ canManage }: DocumentsPageHeaderProps) {
  if (!canManage) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Documents</h1>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* Prominent Upload Button */}
        <DocumentUpload 
          header={true}
          onUploadComplete={() => {
            // Refresh will be handled by DocumentList component
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }} 
        />
        {/* Generate FAQs Button */}
        <Link href="/admin/docs/generate-faqs" className="w-full sm:w-auto">
          <Button 
            variant="default" 
            data-demo="generate-faqs"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all min-h-[44px] px-4"
          >
            <Sparkles className="h-4 w-4" />
            Generate FAQs
          </Button>
        </Link>
      </div>
    </div>
  );
}

