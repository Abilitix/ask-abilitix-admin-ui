/**
 * Documents Client Component
 * 
 * Orchestrates the DocumentList and DocumentDetail components,
 * managing the state between list and detail views.
 * 
 * @module components/documents/DocumentsClient
 */

'use client';

import { useState, useCallback } from 'react';
import { DocumentList } from './DocumentList';
import { DocumentDetail } from './DocumentDetail';

export interface DocumentsClientProps {
  /**
   * Whether to show document actions (open, delete).
   */
  showActions?: boolean;
}

/**
 * Documents Client Component
 * 
 * Main orchestrator for the documents management UI.
 * Handles navigation between list and detail views.
 */
export function DocumentsClient({ showActions = true }: DocumentsClientProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const handleSelectDocument = useCallback((docId: string) => {
    setSelectedDocId(docId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDocId(null);
  }, []);

  // Show detail view if document is selected
  if (selectedDocId) {
    return (
      <DocumentDetail
        docId={selectedDocId}
        onClose={handleCloseDetail}
        showActions={showActions}
      />
    );
  }

  // Show list view by default
  return (
    <DocumentList
      onSelectDocument={handleSelectDocument}
      showActions={showActions}
    />
  );
}

