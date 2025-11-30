'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ContextSettings } from './types';
import { CSVImportModal } from './CSVImportModal';
import { generateOfferingsTemplate, validateOfferingRow, CSVRow } from './csvUtils';

interface ProfileSectionProps {
  ctx: ContextSettings;
  setCtx: (ctx: ContextSettings) => void;
}

export function ProfileSection({ ctx, setCtx }: ProfileSectionProps) {
  const [newOffering, setNewOffering] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const addOffering = () => {
    if (!newOffering.trim()) return;
    if (ctx.profile.offerings.length >= 10) {
      toast.error('Maximum 10 offerings allowed');
      return;
    }
    if (newOffering.length > 80) {
      toast.error('Each offering must be 80 characters or less');
      return;
    }
    setCtx({
      ...ctx,
      profile: {
        ...ctx.profile,
        offerings: [...ctx.profile.offerings, newOffering.trim()],
      },
    });
    setNewOffering('');
  };

  const removeOffering = (index: number) => {
    setCtx({
      ...ctx,
      profile: {
        ...ctx.profile,
        offerings: ctx.profile.offerings.filter((_, i) => i !== index),
      },
    });
  };

  const handleCSVImport = (data: string[]) => {
    const newOfferings = data.filter(offering => {
      // Check for duplicates
      return !ctx.profile.offerings.some(existing => 
        existing.toLowerCase() === offering.toLowerCase()
      );
    });

    if (newOfferings.length === 0) {
      toast.info('No new offerings to add (all offerings already exist)');
      return;
    }

    const totalAfterImport = ctx.profile.offerings.length + newOfferings.length;
    if (totalAfterImport > 10) {
      const canAdd = 10 - ctx.profile.offerings.length;
      if (canAdd > 0) {
        setCtx({
          ...ctx,
          profile: {
            ...ctx.profile,
            offerings: [...ctx.profile.offerings, ...newOfferings.slice(0, canAdd)],
          },
        });
        toast.warning(`Added ${canAdd} offerings (maximum 10 reached)`);
      } else {
        toast.error('Maximum 10 offerings already reached');
      }
      return;
    }

    setCtx({
      ...ctx,
      profile: {
        ...ctx.profile,
        offerings: [...ctx.profile.offerings, ...newOfferings],
      },
    });
    toast.success(`Imported ${newOfferings.length} offerings`);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Define who you are, what you do, and how you want to be described.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Value Proposition */}
        <div className="space-y-2">
          <Label htmlFor="value_prop" className="text-sm font-medium">
            Value Proposition
            <span className="text-xs text-gray-500 ml-2">
              ({ctx.profile.value_prop.length}/200)
            </span>
          </Label>
          <Textarea
            id="value_prop"
            value={ctx.profile.value_prop}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setCtx({
                  ...ctx,
                  profile: { ...ctx.profile, value_prop: e.target.value },
                });
              }
            }}
            placeholder="One or two sentences describing what your company does."
            className="min-h-[100px] min-w-full"
            maxLength={200}
          />
          <p className="text-xs text-gray-500">
            One or two sentences describing what your company does.
          </p>
        </div>

        {/* Offerings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Offerings
              <span className="text-xs text-gray-500 ml-2">
                ({ctx.profile.offerings.length}/10)
              </span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="min-h-[36px]"
            >
              <Upload className="h-3 w-3 mr-1" />
              Import CSV
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={newOffering}
              onChange={(e) => {
                if (e.target.value.length <= 80) {
                  setNewOffering(e.target.value);
                }
              }}
              placeholder="Add an offering (max 80 characters)"
              className="flex-1"
              maxLength={80}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOffering();
                }
              }}
            />
            <Button
              type="button"
              onClick={addOffering}
              disabled={!newOffering.trim() || ctx.profile.offerings.length >= 10}
              className="min-h-[44px]"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {ctx.profile.offerings.length > 0 && (
            <div className="space-y-2 mt-2">
              {ctx.profile.offerings.map((offering, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded border"
                >
                  <span className="flex-1 text-sm">{offering}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOffering(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Up to 10 offerings, each up to 80 characters.
          </p>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry" className="text-sm font-medium">
            Industry
            <span className="text-xs text-gray-500 ml-2">
              ({ctx.profile.industry.length}/100)
            </span>
          </Label>
          <Input
            id="industry"
            value={ctx.profile.industry}
            onChange={(e) => {
              if (e.target.value.length <= 100) {
                setCtx({
                  ...ctx,
                  profile: { ...ctx.profile, industry: e.target.value },
                });
              }
            }}
            placeholder="e.g., Healthcare, Financial Services, Technology"
            maxLength={100}
            className="min-h-[44px]"
          />
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="text-sm font-medium">
            Tone
            <span className="text-xs text-gray-500 ml-2">
              ({ctx.profile.tone.length}/200)
            </span>
          </Label>
          <Textarea
            id="tone"
            value={ctx.profile.tone}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setCtx({
                  ...ctx,
                  profile: { ...ctx.profile, tone: e.target.value },
                });
              }
            }}
            placeholder="Concise, cited, no hype"
            className="min-h-[80px]"
            maxLength={200}
          />
          <p className="text-xs text-gray-500">
            Default: "Concise, cited, no hype"
          </p>
        </div>
      </CardContent>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleCSVImport}
        type="offerings"
        templateGenerator={generateOfferingsTemplate}
        validator={validateOfferingRow}
        maxItems={10}
        currentCount={ctx.profile.offerings.length}
      />
    </Card>
  );
}

