'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, AlertCircle, Info } from 'lucide-react';
import { DimensionCard } from './DimensionCard';
import { DimensionEditor } from './DimensionEditor';
import type { CustomDimension } from '@/lib/types/knowledge';

type DimensionsPanelProps = {
  extractedDimensions?: CustomDimension[]; // Auto-extracted from JD
  customDimensions?: CustomDimension[]; // User-added custom dimensions
  onDimensionsChange: (dimensions: CustomDimension[]) => void;
  extractionLoading?: boolean;
  extractionError?: string | null;
  disabled?: boolean;
};

export function DimensionsPanel({
  extractedDimensions = [],
  customDimensions = [],
  onDimensionsChange,
  extractionLoading = false,
  extractionError = null,
  disabled = false,
}: DimensionsPanelProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Combine extracted and custom dimensions
  const allDimensions = [...extractedDimensions, ...customDimensions];
  const existingLabels = allDimensions.map(d => d.label.toLowerCase());

  const handleAdd = useCallback((dimension: CustomDimension) => {
    const updated = [...customDimensions, dimension];
    onDimensionsChange([...extractedDimensions, ...updated]);
    setIsAddingNew(false);
  }, [customDimensions, extractedDimensions, onDimensionsChange]);

  const handleEdit = useCallback((index: number, dimension: CustomDimension) => {
    // Determine if editing extracted or custom dimension
    if (index < extractedDimensions.length) {
      // Editing extracted dimension - convert to custom
      const updatedExtracted = extractedDimensions.filter((_, i) => i !== index);
      const updatedCustom = [...customDimensions, dimension];
      onDimensionsChange([...updatedExtracted, ...updatedCustom]);
    } else {
      // Editing custom dimension
      const customIndex = index - extractedDimensions.length;
      const updatedCustom = [...customDimensions];
      updatedCustom[customIndex] = dimension;
      onDimensionsChange([...extractedDimensions, ...updatedCustom]);
    }
    setEditingIndex(null);
  }, [extractedDimensions, customDimensions, onDimensionsChange]);

  const handleRemove = useCallback((index: number) => {
    if (index < extractedDimensions.length) {
      // Removing extracted dimension
      const updated = extractedDimensions.filter((_, i) => i !== index);
      onDimensionsChange([...updated, ...customDimensions]);
    } else {
      // Removing custom dimension
      const customIndex = index - extractedDimensions.length;
      const updated = customDimensions.filter((_, i) => i !== customIndex);
      onDimensionsChange([...extractedDimensions, ...updated]);
    }
  }, [extractedDimensions, customDimensions, onDimensionsChange]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const updated = [...allDimensions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onDimensionsChange(updated);
  }, [allDimensions, onDimensionsChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === allDimensions.length - 1) return;
    const updated = [...allDimensions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onDimensionsChange(updated);
  }, [allDimensions, onDimensionsChange]);

  const handleEditorSave = (dimension: CustomDimension) => {
    if (isAddingNew) {
      handleAdd(dimension);
    } else if (editingIndex !== null) {
      handleEdit(editingIndex, dimension);
    }
  };

  const handleEditorCancel = () => {
    setIsAddingNew(false);
    setEditingIndex(null);
  };

  // Show warning if all dimensions removed
  const showWarning = allDimensions.length === 0 && !extractionLoading && !extractionError;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Label className="text-base font-semibold">Customise Evaluation Dimensions</Label>
          <p className="text-xs text-slate-500 mt-1">
            Optional - System will auto-extract if not customized
          </p>
        </div>
        <div className="flex items-center gap-1 text-slate-400" title="Customize dimensions to control what gets evaluated">
          <Info className="h-4 w-4" />
        </div>
      </div>

      {/* Loading state */}
      {extractionLoading && (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-slate-50">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-600">Extracting dimensions from JD...</span>
        </div>
      )}

      {/* Extraction error */}
      {extractionError && (
        <div className="flex items-start gap-2 p-4 border border-amber-200 rounded-lg bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Could not auto-extract dimensions
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {extractionError}. Add custom dimensions below or proceed with default extraction.
            </p>
          </div>
        </div>
      )}

      {/* Warning if all dimensions removed */}
      {showWarning && (
        <div className="flex items-start gap-2 p-4 border border-amber-200 rounded-lg bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              No custom dimensions
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Will use auto-extracted dimensions from JD during generation.
            </p>
          </div>
        </div>
      )}

      {/* Extracted dimensions section */}
      {extractedDimensions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-slate-600">
            Extracted from JD ({extractedDimensions.length}):
          </Label>
          <div className="space-y-2">
            {extractedDimensions.map((dimension, index) => (
              <DimensionCard
                key={`extracted-${index}`}
                dimension={dimension}
                index={index}
                totalDimensions={allDimensions.length}
                onEdit={() => setEditingIndex(index)}
                onRemove={() => handleRemove(index)}
                onMoveUp={index > 0 ? () => handleMoveUp(index) : undefined}
                onMoveDown={index < allDimensions.length - 1 ? () => handleMoveDown(index) : undefined}
                isExtracted={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom dimensions section */}
      {customDimensions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-slate-600">
            Custom Dimensions ({customDimensions.length}):
          </Label>
          <div className="space-y-2">
            {customDimensions.map((dimension, index) => {
              const globalIndex = extractedDimensions.length + index;
              return (
                <DimensionCard
                  key={`custom-${index}`}
                  dimension={dimension}
                  index={globalIndex}
                  totalDimensions={allDimensions.length}
                  onEdit={() => setEditingIndex(globalIndex)}
                  onRemove={() => handleRemove(globalIndex)}
                  onMoveUp={globalIndex > 0 ? () => handleMoveUp(globalIndex) : undefined}
                  onMoveDown={globalIndex < allDimensions.length - 1 ? () => handleMoveDown(globalIndex) : undefined}
                  isExtracted={false}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!extractionLoading && !extractionError && extractedDimensions.length === 0 && customDimensions.length === 0 && (
        <div className="p-4 border border-dashed rounded-lg bg-slate-50 text-center">
          <p className="text-sm text-slate-500">
            No dimensions yet. Add your first dimension to get started.
          </p>
        </div>
      )}

      {/* Add new dimension button */}
      {!isAddingNew && (
        <Button
          variant="outline"
          onClick={() => setIsAddingNew(true)}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Dimension
        </Button>
      )}

      {/* Dimension editor (for add/edit) */}
      <DimensionEditor
        isOpen={isAddingNew || editingIndex !== null}
        dimension={
          isAddingNew
            ? null
            : editingIndex !== null && editingIndex < allDimensions.length
            ? allDimensions[editingIndex]
            : undefined
        }
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
        existingLabels={existingLabels}
      />
    </div>
  );
}

