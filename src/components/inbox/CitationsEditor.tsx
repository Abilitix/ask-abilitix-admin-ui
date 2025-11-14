'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export type EditableCitation = {
  docId: string;
  page: string;
  spanStart: string;
  spanEnd: string;
  spanText: string;
};

export type CitationRowError = {
  docId?: string;
  page?: string;
  spanStart?: string;
  spanEnd?: string;
  spanText?: string;
  root?: string;
};

type CitationsEditorProps = {
  value: EditableCitation[];
  onChange: (citations: EditableCitation[]) => void;
  errors?: CitationRowError[];
  readOnly?: boolean;
  disabled?: boolean;
  maxCount?: number;
};

const EMPTY_CITATION: EditableCitation = {
  docId: '',
  page: '',
  spanStart: '',
  spanEnd: '',
  spanText: '',
};

export function CitationsEditor({
  value,
  onChange,
  errors = [],
  readOnly = false,
  disabled = false,
  maxCount = 3,
}: CitationsEditorProps) {
  const canEdit = !readOnly && !disabled;
  const safeValue = Array.isArray(value) ? value : [];
  const safeErrors = Array.isArray(errors) ? errors : [];

  const updateCitation = (index: number, partial: Partial<EditableCitation>) => {
    const next = safeValue.map((entry, idx) =>
      idx === index ? { ...entry, ...partial } : entry
    );
    onChange(next);
  };

  const removeCitation = (index: number) => {
    if (!canEdit) return;
    const next = safeValue.filter((_, idx) => idx !== index);
    onChange(next.length ? next : [EMPTY_CITATION]);
  };

  const addCitation = () => {
    if (!canEdit) return;
    if (safeValue.length >= maxCount) return;
    onChange([...safeValue, { ...EMPTY_CITATION }]);
  };

  const effectiveValue = safeValue.length > 0 ? safeValue : [EMPTY_CITATION];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {effectiveValue.map((citation, index) => {
          const rowErrors = safeErrors[index] ?? {};
          const showRemove = canEdit && effectiveValue.length > 1;

          return (
            <Card key={index} className="border border-border/60">
              <CardContent className="space-y-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`citation-doc-${index}`}>Document ID</Label>
                    <Input
                      id={`citation-doc-${index}`}
                      value={citation.docId}
                      disabled={!canEdit}
                      placeholder="UUID..."
                      onChange={(event) =>
                        updateCitation(index, { docId: event.target.value })
                      }
                      className={cn(
                        rowErrors.docId ? 'border-destructive focus-visible:ring-destructive' : ''
                      )}
                    />
                    {rowErrors.docId && (
                      <p className="text-xs text-destructive">{rowErrors.docId}</p>
                    )}
                  </div>
                  {showRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCitation(index)}
                      disabled={!canEdit}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove citation</span>
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`citation-page-${index}`}>Page</Label>
                    <Input
                      id={`citation-page-${index}`}
                      value={citation.page}
                      disabled={!canEdit}
                      placeholder="Optional"
                      inputMode="numeric"
                      onChange={(event) =>
                        updateCitation(index, { page: event.target.value })
                      }
                      className={cn(
                        rowErrors.page ? 'border-destructive focus-visible:ring-destructive' : ''
                      )}
                    />
                    {rowErrors.page && (
                      <p className="text-xs text-destructive">{rowErrors.page}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`citation-span-start-${index}`}>Span start</Label>
                    <Input
                      id={`citation-span-start-${index}`}
                      value={citation.spanStart}
                      disabled={!canEdit}
                      placeholder="Optional"
                      inputMode="numeric"
                      onChange={(event) =>
                        updateCitation(index, { spanStart: event.target.value })
                      }
                      className={cn(
                        rowErrors.spanStart
                          ? 'border-destructive focus-visible:ring-destructive'
                          : ''
                      )}
                    />
                    {rowErrors.spanStart && (
                      <p className="text-xs text-destructive">{rowErrors.spanStart}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`citation-span-end-${index}`}>Span end</Label>
                    <Input
                      id={`citation-span-end-${index}`}
                      value={citation.spanEnd}
                      disabled={!canEdit}
                      placeholder="Optional"
                      inputMode="numeric"
                      onChange={(event) =>
                        updateCitation(index, { spanEnd: event.target.value })
                      }
                      className={cn(
                        rowErrors.spanEnd
                          ? 'border-destructive focus-visible:ring-destructive'
                          : ''
                      )}
                    />
                    {rowErrors.spanEnd && (
                      <p className="text-xs text-destructive">{rowErrors.spanEnd}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`citation-span-text-${index}`}>Span text</Label>
                  <Textarea
                    id={`citation-span-text-${index}`}
                    value={citation.spanText}
                    disabled={!canEdit}
                    placeholder="Optional supporting text…"
                    onChange={(event) =>
                      updateCitation(index, { spanText: event.target.value })
                    }
                    className={cn(
                      'min-h-[80px]',
                      rowErrors.spanText ? 'border-destructive focus-visible:ring-destructive' : ''
                    )}
                  />
                  {rowErrors.spanText && (
                    <p className="text-xs text-destructive">{rowErrors.spanText}</p>
                  )}
                  {rowErrors.root && (
                    <p className="text-xs text-destructive">{rowErrors.root}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {canEdit && effectiveValue.length < maxCount && (
        <Button type="button" variant="outline" size="sm" onClick={addCitation}>
          <Plus className="mr-2 h-4 w-4" />
          Add citation
        </Button>
      )}
    </div>
  );
}

