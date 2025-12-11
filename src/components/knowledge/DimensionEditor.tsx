'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { CustomDimension } from '@/lib/types/knowledge';

type DimensionEditorProps = {
  isOpen: boolean; // Controls visibility
  dimension?: CustomDimension | null; // null = new dimension, undefined = closed
  onSave: (dimension: CustomDimension) => void;
  onCancel: () => void;
  existingLabels?: string[]; // For duplicate validation
};

type ValidationErrors = {
  label?: string;
  keywords?: string;
  importance?: string;
};

export function DimensionEditor({
  isOpen,
  dimension,
  onSave,
  onCancel,
  existingLabels = [],
}: DimensionEditorProps) {
  const isEditing = dimension !== null && dimension !== undefined;
  const [label, setLabel] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [importance, setImportance] = useState<'must' | 'nice'>('must');
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Initialize form when dimension changes
  useEffect(() => {
    if (isEditing && dimension) {
      setLabel(dimension.label);
      setKeywords(dimension.keywords.length > 0 ? dimension.keywords : ['']);
      setImportance(dimension.importance);
    } else {
      setLabel('');
      setKeywords(['']);
      setImportance('must');
    }
    setErrors({});
  }, [dimension, isEditing]);

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Label validation
    if (!label.trim()) {
      newErrors.label = 'Label is required';
    } else if (label.length > 50) {
      newErrors.label = 'Label must be 50 characters or less';
    } else if (isEditing && dimension) {
      // When editing, exclude current dimension's label from duplicate check
      const otherLabels = existingLabels.filter(l => l !== dimension.label);
      if (otherLabels.includes(label.trim())) {
        newErrors.label = `Dimension "${label.trim()}" already exists`;
      }
    } else {
      // When adding new, check all existing labels
      if (existingLabels.includes(label.trim())) {
        newErrors.label = `Dimension "${label.trim()}" already exists`;
      }
    }

    // Keywords validation
    const validKeywords = keywords.filter(k => k.trim().length > 0);
    if (validKeywords.length === 0) {
      newErrors.keywords = 'At least one keyword is required';
    } else if (validKeywords.length > 10) {
      newErrors.keywords = 'Maximum 10 keywords allowed';
    } else {
      // Check individual keyword length
      const tooLong = validKeywords.find(k => k.trim().length > 50);
      if (tooLong) {
        newErrors.keywords = 'Each keyword must be 50 characters or less';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const slugifyLabel = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);

    const validKeywords = keywords
      .map(k => k.trim())
      .filter(k => k.length > 0);

    // Preserve existing key when editing; generate one when adding
    const generatedKey =
      isEditing && dimension?.key
        ? dimension.key
        : slugifyLabel(label) || `dim-${Date.now()}`;

    onSave({
      key: generatedKey,
      label: label.trim(),
      keywords: validKeywords,
      importance,
    });
  };

  const addKeyword = () => {
    if (keywords.length < 10) {
      setKeywords([...keywords, '']);
    }
  };

  const updateKeyword = (index: number, value: string) => {
    const updated = [...keywords];
    updated[index] = value;
    setKeywords(updated);
  };

  const removeKeyword = (index: number) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((_, i) => i !== index));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <div className="space-y-2">
        <Label htmlFor="dimension-label">
          Label <span className="text-red-500">*</span>
        </Label>
        <Input
          id="dimension-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Python Experience"
          maxLength={50}
          className={errors.label ? 'border-red-300' : ''}
        />
        {errors.label && (
          <p className="text-xs text-red-600">{errors.label}</p>
        )}
        <p className="text-xs text-slate-500">
          {label.length}/50 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          Keywords <span className="text-red-500">*</span>
          <span className="text-xs text-slate-500 ml-2">
            ({keywords.filter(k => k.trim()).length}/10)
          </span>
        </Label>
        <div className="space-y-2">
          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={keyword}
                onChange={(e) => updateKeyword(index, e.target.value)}
                placeholder={`Keyword ${index + 1}`}
                maxLength={50}
                className={errors.keywords ? 'border-red-300' : ''}
              />
              {keywords.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKeyword(index)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {keywords.length < 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addKeyword}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
          )}
        </div>
        {errors.keywords && (
          <p className="text-xs text-red-600">{errors.keywords}</p>
        )}
        <p className="text-xs text-slate-500">
          Add 1-10 keywords. Each keyword max 50 characters.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Importance <span className="text-red-500">*</span></Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={importance === 'must' ? 'default' : 'outline'}
            onClick={() => setImportance('must')}
            className="flex-1 data-[state=on]:ring-2 data-[state=on]:ring-offset-2"
            data-state={importance === 'must' ? 'on' : 'off'}
          >
            Must Have
          </Button>
          <Button
            type="button"
            variant={importance === 'nice' ? 'default' : 'outline'}
            onClick={() => setImportance('nice')}
            className="flex-1 data-[state=on]:ring-2 data-[state=on]:ring-offset-2"
            data-state={importance === 'nice' ? 'on' : 'off'}
          >
            Nice to Have
          </Button>
        </div>
      </div>

      {/* Actions stay visible */}
      <div className="sticky bottom-0 pt-3 bg-slate-50">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

