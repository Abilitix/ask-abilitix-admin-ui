'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ContextSettings } from './types';

interface GlossarySectionProps {
  ctx: ContextSettings;
  setCtx: (ctx: ContextSettings) => void;
}

export function GlossarySection({ ctx, setCtx }: GlossarySectionProps) {
  const [newTerm, setNewTerm] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

  const addGlossaryEntry = () => {
    if (!newTerm.trim() || !newMeaning.trim()) {
      toast.error('Both term and meaning are required');
      return;
    }
    if (ctx.glossary.length >= 50) {
      toast.error('Maximum 50 glossary entries allowed');
      return;
    }
    if (newTerm.length > 40) {
      toast.error('Term must be 40 characters or less');
      return;
    }
    if (newMeaning.length > 160) {
      toast.error('Meaning must be 160 characters or less');
      return;
    }
    setCtx({
      ...ctx,
      glossary: [...ctx.glossary, { term: newTerm.trim(), meaning: newMeaning.trim() }],
    });
    setNewTerm('');
    setNewMeaning('');
  };

  const removeGlossaryEntry = (index: number) => {
    setCtx({
      ...ctx,
      glossary: ctx.glossary.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Glossary</CardTitle>
        <CardDescription>
          How Abilitix should interpret your acronyms and domain terms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Entry */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-term" className="text-sm font-medium">
                Term
                <span className="text-xs text-gray-500 ml-2">
                  ({newTerm.length}/40)
                </span>
              </Label>
              <Input
                id="new-term"
                value={newTerm}
                onChange={(e) => {
                  if (e.target.value.length <= 40) {
                    setNewTerm(e.target.value);
                  }
                }}
                placeholder="e.g., RAG, API, CRM"
                maxLength={40}
                className="min-h-[44px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTerm.trim() && newMeaning.trim()) {
                    e.preventDefault();
                    addGlossaryEntry();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-meaning" className="text-sm font-medium">
                Meaning
                <span className="text-xs text-gray-500 ml-2">
                  ({newMeaning.length}/160)
                </span>
              </Label>
              <Input
                id="new-meaning"
                value={newMeaning}
                onChange={(e) => {
                  if (e.target.value.length <= 160) {
                    setNewMeaning(e.target.value);
                  }
                }}
                placeholder="Definition or explanation"
                maxLength={160}
                className="min-h-[44px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTerm.trim() && newMeaning.trim()) {
                    e.preventDefault();
                    addGlossaryEntry();
                  }
                }}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={addGlossaryEntry}
            disabled={!newTerm.trim() || !newMeaning.trim() || ctx.glossary.length >= 50}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Glossary Entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Entries ({ctx.glossary.length}/50)
            </Label>
          </div>
          {ctx.glossary.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No glossary entries yet. Add terms to help Abilitix understand your terminology.
            </div>
          ) : (
            <div className="space-y-2">
              {ctx.glossary.map((entry, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded border"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-gray-500">Term:</span>
                      <div className="font-medium text-sm">{entry.term}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Meaning:</span>
                      <div className="text-sm">{entry.meaning}</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGlossaryEntry(index)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

