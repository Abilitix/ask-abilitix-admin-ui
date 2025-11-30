'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Upload, Download, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { parseCSV, downloadCSV, CSVRow, CSVParseResult } from './csvUtils';
import { toast } from 'sonner';

type ImportType = 'glossary' | 'offerings' | 'policy';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void; // Can be array or object depending on type
  type: ImportType;
  templateGenerator: () => string;
  validator: (row: CSVRow, index: number) => { valid: boolean; error?: string };
  maxItems: number;
  currentCount: number;
}

export function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  type,
  templateGenerator,
  validator,
  maxItems,
  currentCount,
}: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [validRows, setValidRows] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setPreview([]);
    setValidRows([]);

    try {
      const text = await selectedFile.text();
      const result: CSVParseResult = parseCSV(text);

      if (!result.success && result.errors.length > 0) {
        setErrors(result.errors);
        toast.error('CSV parsing failed. Please check the file format.');
        setIsProcessing(false);
        return;
      }

      // Validate each row
      const validationErrors: string[] = [];
      const valid: CSVRow[] = [];

      result.data.forEach((row, index) => {
        const validation = validator(row, index);
        if (validation.valid) {
          valid.push(row);
        } else {
          validationErrors.push(validation.error || `Row ${index + 1}: Invalid`);
        }
      });

      setPreview(result.data);
      setValidRows(valid);
      setErrors(validationErrors);

      if (valid.length === 0) {
        toast.error('No valid rows found in CSV file');
      } else if (validationErrors.length > 0) {
        toast.warning(`${valid.length} valid rows found, ${validationErrors.length} errors`);
      } else {
        toast.success(`${valid.length} valid rows found`);
      }
    } catch (err) {
      console.error('CSV parsing error:', err);
      toast.error('Failed to parse CSV file');
      setErrors(['Failed to parse CSV file. Please check the file format.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = templateGenerator();
    const filename = `context-${type}-template.csv`;
    downloadCSV(template, filename);
    toast.success('Template downloaded');
  };

  const handleImport = () => {
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    // For policy type, validation is handled in the parent component
    // For other types, check if importing would exceed max items
    if (type !== 'policy') {
      const totalAfterImport = currentCount + validRows.length;
      if (totalAfterImport > maxItems) {
        toast.error(`Importing ${validRows.length} items would exceed the maximum of ${maxItems} (currently ${currentCount})`);
        return;
      }
    }

    // Transform data based on type
    let transformedData: any;

    if (type === 'glossary') {
      transformedData = validRows.map(row => ({
        term: row.term?.trim() || '',
        meaning: row.meaning?.trim() || '',
      }));
    } else if (type === 'offerings') {
      transformedData = validRows.map(row => row.offering?.trim() || '').filter(Boolean);
    } else if (type === 'policy') {
      const mustRules = validRows.filter(r => r.type?.trim().toLowerCase() === 'must').map(r => r.rule?.trim() || '').filter(Boolean);
      const neverRules = validRows.filter(r => r.type?.trim().toLowerCase() === 'never').map(r => r.rule?.trim() || '').filter(Boolean);
      transformedData = { must: mustRules, never: neverRules };
    }

    onImport(transformedData);
    handleClose();
    toast.success(`Imported ${validRows.length} ${type === 'glossary' ? 'entries' : type === 'offerings' ? 'offerings' : 'rules'}`);
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setValidRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'glossary':
        return 'Glossary Entries';
      case 'offerings':
        return 'Offerings';
      case 'policy':
        return 'Policy Rules';
      default:
        return 'Items';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Upload className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Import {getTypeLabel()} from CSV</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a CSV file to bulk import {getTypeLabel().toLowerCase()}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              How to Import
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the CSV template below</li>
              <li>Fill in your data following the template format</li>
              <li>Upload your completed CSV file</li>
              <li>Review the preview and fix any errors</li>
              <li>Click "Import" to add the valid items</li>
            </ol>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <p className="font-medium text-gray-900">Download Template</p>
              <p className="text-sm text-gray-600">Get a pre-formatted CSV file with example data</p>
            </div>
            <Button onClick={handleDownloadTemplate} variant="outline" className="min-h-[44px]">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
            />
            {isProcessing && (
              <p className="text-sm text-gray-600">Processing CSV file...</p>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {validRows.length} valid
                  </span>
                  {errors.length > 0 && (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.length} errors
                    </span>
                  )}
                </div>
              </div>

              {/* Valid Rows Preview */}
              {validRows.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Valid Rows ({validRows.length})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {validRows.slice(0, 10).map((row, index) => (
                      <div key={index} className="text-sm text-green-800 bg-white p-2 rounded border border-green-200">
                        {type === 'glossary' && (
                          <div>
                            <strong>{row.term}:</strong> {row.meaning}
                          </div>
                        )}
                        {type === 'offerings' && (
                          <div>{row.offering}</div>
                        )}
                        {type === 'policy' && (
                          <div>
                            <strong>{row.type}:</strong> {row.rule}
                          </div>
                        )}
                      </div>
                    ))}
                    {validRows.length > 10 && (
                      <p className="text-xs text-green-700">... and {validRows.length - 10} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Errors ({errors.length})</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-800">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          {validRows.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div>
                <p className="font-medium text-gray-900">
                  Ready to import {validRows.length} {getTypeLabel().toLowerCase()}
                </p>
                <p className="text-sm text-gray-600">
                  Current: {currentCount} / {maxItems} max
                </p>
              </div>
              <Button
                onClick={handleImport}
                disabled={currentCount + validRows.length > maxItems}
                className="min-h-[44px] bg-indigo-600 hover:bg-indigo-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import {validRows.length} Items
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

