'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EmbedSnippetBlockProps {
  embedSnippet: string;
}

export function EmbedSnippetBlock({ embedSnippet }: EmbedSnippetBlockProps) {
  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(embedSnippet);
      toast.success('Embed snippet copied to clipboard');
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
        >
          Copy Snippet
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

