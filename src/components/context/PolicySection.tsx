'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ContextSettings } from './types';
import { CSVImportModal } from './CSVImportModal';
import { generatePolicyTemplate, validatePolicyRow, CSVRow } from './csvUtils';

interface PolicySectionProps {
  ctx: ContextSettings;
  setCtx: (ctx: ContextSettings) => void;
}

export function PolicySection({ ctx, setCtx }: PolicySectionProps) {
  const [newMust, setNewMust] = useState('');
  const [newNever, setNewNever] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const addMust = () => {
    if (!newMust.trim()) return;
    if (ctx.policy.must.length >= 10) {
      toast.error('Maximum 10 "must" rules allowed');
      return;
    }
    if (newMust.length > 160) {
      toast.error('Each "must" rule must be 160 characters or less');
      return;
    }
    setCtx({
      ...ctx,
      policy: {
        ...ctx.policy,
        must: [...ctx.policy.must, newMust.trim()],
      },
    });
    setNewMust('');
  };

  const removeMust = (index: number) => {
    setCtx({
      ...ctx,
      policy: {
        ...ctx.policy,
        must: ctx.policy.must.filter((_, i) => i !== index),
      },
    });
  };

  const addNever = () => {
    if (!newNever.trim()) return;
    if (ctx.policy.never.length >= 10) {
      toast.error('Maximum 10 "never" rules allowed');
      return;
    }
    if (newNever.length > 160) {
      toast.error('Each "never" rule must be 160 characters or less');
      return;
    }
    setCtx({
      ...ctx,
      policy: {
        ...ctx.policy,
        never: [...ctx.policy.never, newNever.trim()],
      },
    });
    setNewNever('');
  };

  const removeNever = (index: number) => {
    setCtx({
      ...ctx,
      policy: {
        ...ctx.policy,
        never: ctx.policy.never.filter((_, i) => i !== index),
      },
    });
  };

  const handleCSVImport = (data: { must: string[]; never: string[] }) => {
    // Filter out duplicates
    const newMust = data.must.filter(rule => 
      !ctx.policy.must.some(existing => existing.toLowerCase() === rule.toLowerCase())
    );
    const newNever = data.never.filter(rule => 
      !ctx.policy.never.some(existing => existing.toLowerCase() === rule.toLowerCase())
    );

    if (newMust.length === 0 && newNever.length === 0) {
      toast.info('No new rules to add (all rules already exist)');
      return;
    }

    // Check limits
    const totalMustAfterImport = ctx.policy.must.length + newMust.length;
    const totalNeverAfterImport = ctx.policy.never.length + newNever.length;

    let finalMust = newMust;
    let finalNever = newNever;

    if (totalMustAfterImport > 10) {
      const canAdd = 10 - ctx.policy.must.length;
      finalMust = newMust.slice(0, canAdd);
      if (canAdd < newMust.length) {
        toast.warning(`Added ${canAdd} "must" rules (maximum 10 reached)`);
      }
    }

    if (totalNeverAfterImport > 10) {
      const canAdd = 10 - ctx.policy.never.length;
      finalNever = newNever.slice(0, canAdd);
      if (canAdd < newNever.length) {
        toast.warning(`Added ${canAdd} "never" rules (maximum 10 reached)`);
      }
    }

    setCtx({
      ...ctx,
      policy: {
        must: [...ctx.policy.must, ...finalMust],
        never: [...ctx.policy.never, ...finalNever],
      },
    });

    const totalAdded = finalMust.length + finalNever.length;
    toast.success(`Imported ${totalAdded} policy rules (${finalMust.length} must, ${finalNever.length} never)`);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Answer Rules</CardTitle>
            <CardDescription>
              Define what Ask Abilitix must include or respect, and what it should never do.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="min-h-[44px]"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Must Include */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Must Include / Respect
            <span className="text-xs text-gray-500 ml-2">
              ({ctx.policy.must.length}/10)
            </span>
          </Label>
          <div className="space-y-2">
            <Textarea
              value={newMust}
              onChange={(e) => {
                if (e.target.value.length <= 160) {
                  setNewMust(e.target.value);
                }
              }}
              placeholder="e.g., Always cite sources, Prefer tenant docs over general web knowledge"
              className="min-h-[80px]"
              maxLength={160}
            />
            <Button
              type="button"
              onClick={addMust}
              disabled={!newMust.trim() || ctx.policy.must.length >= 10}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          {ctx.policy.must.length > 0 && (
            <div className="space-y-2 mt-3">
              {ctx.policy.must.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-green-50 rounded border border-green-200"
                >
                  <span className="flex-1 text-sm">{rule}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMust(index)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Never Do */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Never Do
            <span className="text-xs text-gray-500 ml-2">
              ({ctx.policy.never.length}/10)
            </span>
          </Label>
          <div className="space-y-2">
            <Textarea
              value={newNever}
              onChange={(e) => {
                if (e.target.value.length <= 160) {
                  setNewNever(e.target.value);
                }
              }}
              placeholder="e.g., Don't invent pricing, Don't give legal advice"
              className="min-h-[80px]"
              maxLength={160}
            />
            <Button
              type="button"
              onClick={addNever}
              disabled={!newNever.trim() || ctx.policy.never.length >= 10}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          {ctx.policy.never.length > 0 && (
            <div className="space-y-2 mt-3">
              {ctx.policy.never.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-red-50 rounded border border-red-200"
                >
                  <span className="flex-1 text-sm">{rule}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNever(index)}
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

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleCSVImport}
        type="policy"
        templateGenerator={generatePolicyTemplate}
        validator={validatePolicyRow}
        maxItems={20} // 10 must + 10 never
        currentCount={ctx.policy.must.length + ctx.policy.never.length}
      />
    </Card>
  );
}

