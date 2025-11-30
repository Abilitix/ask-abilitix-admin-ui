/**
 * CSV utility functions for Context Management
 * Handles template generation, parsing, and validation
 */

export type CSVRow = Record<string, string>;
export type CSVParseResult = {
  success: boolean;
  data: CSVRow[];
  errors: string[];
};

/**
 * Parse CSV text into rows
 */
export function parseCSV(csvText: string): CSVParseResult {
  const errors: string[] = [];
  const rows: CSVRow[] = [];

  if (!csvText.trim()) {
    return { success: false, data: [], errors: ['CSV file is empty'] };
  }

  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return { success: false, data: [], errors: ['CSV file has no data rows'] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  if (headers.length === 0) {
    return { success: false, data: [], errors: ['CSV file has no headers'] };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines

    const values = parseCSVLine(line);
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return {
    success: errors.length === 0,
    data: rows,
    errors,
  };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current);

  return values;
}

/**
 * Generate CSV template for Glossary
 */
export function generateGlossaryTemplate(): string {
  return `term,meaning
RAG,Retrieval-Augmented Generation - a technology that enhances AI responses with document-based knowledge
FAQ,Frequently Asked Questions - common questions and their approved answers
SME,Subject Matter Expert - a person with deep knowledge in a specific domain
API,Application Programming Interface - a set of protocols for building software applications`;
}

/**
 * Generate CSV template for Offerings
 */
export function generateOfferingsTemplate(): string {
  return `offering
Document-Based Chatbot Creation
RAG Technology for Business Knowledge
FAQ Management System
Widget Integration for Websites
Custom AI Assistant Solutions`;
}

/**
 * Generate CSV template for Policy Rules
 */
export function generatePolicyTemplate(): string {
  return `type,rule
must,Always cite sources from documents
must,Use company-specific terminology when available
must,Prefer tenant documents over general web knowledge
never,Don't speculate on pricing or costs
never,Don't provide code examples unless found in documents
never,Don't give legal or financial advice`;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Validate Glossary CSV row
 */
export function validateGlossaryRow(row: CSVRow, rowIndex: number): { valid: boolean; error?: string } {
  const term = row.term?.trim() || '';
  const meaning = row.meaning?.trim() || '';

  if (!term) {
    return { valid: false, error: `Row ${rowIndex + 1}: Term is required` };
  }
  if (!meaning) {
    return { valid: false, error: `Row ${rowIndex + 1}: Meaning is required` };
  }
  if (term.length > 40) {
    return { valid: false, error: `Row ${rowIndex + 1}: Term must be 40 characters or less (got ${term.length})` };
  }
  if (meaning.length > 160) {
    return { valid: false, error: `Row ${rowIndex + 1}: Meaning must be 160 characters or less (got ${meaning.length})` };
  }

  return { valid: true };
}

/**
 * Validate Offerings CSV row
 */
export function validateOfferingRow(row: CSVRow, rowIndex: number): { valid: boolean; error?: string } {
  const offering = row.offering?.trim() || '';

  if (!offering) {
    return { valid: false, error: `Row ${rowIndex + 1}: Offering is required` };
  }
  if (offering.length > 80) {
    return { valid: false, error: `Row ${rowIndex + 1}: Offering must be 80 characters or less (got ${offering.length})` };
  }

  return { valid: true };
}

/**
 * Validate Policy CSV row
 */
export function validatePolicyRow(row: CSVRow, rowIndex: number): { valid: boolean; error?: string } {
  const type = row.type?.trim().toLowerCase() || '';
  const rule = row.rule?.trim() || '';

  if (!type) {
    return { valid: false, error: `Row ${rowIndex + 1}: Type is required (must be "must" or "never")` };
  }
  if (type !== 'must' && type !== 'never') {
    return { valid: false, error: `Row ${rowIndex + 1}: Type must be "must" or "never" (got "${type}")` };
  }
  if (!rule) {
    return { valid: false, error: `Row ${rowIndex + 1}: Rule is required` };
  }
  if (rule.length > 160) {
    return { valid: false, error: `Row ${rowIndex + 1}: Rule must be 160 characters or less (got ${rule.length})` };
  }

  return { valid: true };
}

