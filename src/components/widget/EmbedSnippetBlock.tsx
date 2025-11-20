'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, CheckCircle2 } from 'lucide-react';

interface EmbedSnippetBlockProps {
  embedSnippet: string;
}

export function EmbedSnippetBlock({ embedSnippet }: EmbedSnippetBlockProps) {
  const [snippetCopied, setSnippetCopied] = useState(false);

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Embed Snippet:</label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopySnippet}
          className={snippetCopied ? 'text-green-600 border-green-600' : ''}
        >
          {snippetCopied ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy Snippet
            </>
          )}
        </Button>
      </div>
      <textarea
        readOnly
        value={embedSnippet}
        className="w-full font-mono text-xs bg-gray-50 border border-gray-200 rounded p-3 h-24 resize-none"
        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
      />
      <p className="text-xs text-gray-600">
        Paste this snippet before <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> on any page where you want the chatbot.
      </p>
    </div>
  );
}

