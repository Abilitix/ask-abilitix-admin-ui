'use client';

import { useState, useEffect } from 'react';
import { DocsStatsCard } from '@/components/docs/DocsStatsCard';
import { DocsUploadForm } from '@/components/docs/DocsUploadForm';
import { ReembedButton } from '@/components/docs/ReembedButton';
import UploadCard from './UploadCard';
import RecentUploads from './RecentUploads';
import DocumentSearch from './DocumentSearch';
import DocumentTable from './DocumentTable';
import { Toaster } from 'sonner';

type Document = {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'superseded';
  created_at: string;
  topic_key?: string;
  version?: string;
};

export default function AdminDocsPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleRefresh = () => {
    setRefreshSignal(prev => prev + 1);
  };

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        status: statusFilter,
        limit: '25'
      });
      
      const response = await fetch(`/api/admin/docs?${params}`, { cache: 'no-store' });
      const data = await response.json();
      
      console.log('Documents API response:', { status: response.status, data });
      
      if (data.error) {
        console.warn('Admin API error:', data.details);
        setDocuments([]);
      } else {
        // Handle both 'docs' and 'documents' response formats
        setDocuments(data.docs || data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleArchive = async (docId: string) => {
    setActionLoading(docId);
    try {
      const response = await fetch('/api/admin/docs/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId }),
      });
      
      if (response.ok) {
        // Optimistically update UI
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, status: 'archived' as const } : doc
        ));
      }
    } catch (error) {
      console.error('Failed to archive document:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnarchive = async (docId: string) => {
    setActionLoading(docId);
    try {
      const response = await fetch('/api/admin/docs/unarchive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId }),
      });
      
      if (response.ok) {
        // Optimistically update UI
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, status: 'active' as const } : doc
        ));
      }
    } catch (error) {
      console.error('Failed to unarchive document:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Load documents on component mount and when search/filter changes
  useEffect(() => {
    loadDocuments();
  }, [searchTerm, statusFilter, refreshSignal]); // Added refreshSignal to trigger reload

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
      </div>

      {/* Stats Card - Always visible at top */}
      <DocsStatsCard 
        refreshSignal={refreshSignal}
        onLoaded={(stats) => {
          console.log('Stats loaded:', stats);
        }}
      />

      {/* Document Search and Management */}
      <DocumentSearch
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onSearch={loadDocuments}
        loading={documentsLoading}
      />

      <DocumentTable
        documents={documents}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        loading={documentsLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Card */}
        <UploadCard />
        
        {/* Recent Uploads */}
        <RecentUploads />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <DocsUploadForm onDone={handleRefresh} />
        
        {/* Re-embed Button */}
        <ReembedButton onDone={handleRefresh} />
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

