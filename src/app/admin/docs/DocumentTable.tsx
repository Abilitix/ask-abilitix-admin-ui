'use client';
import React from 'react';

type Document = {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'superseded';
  created_at: string;
  topic_key?: string;
  version?: string;
};

type DocumentTableProps = {
  documents: Document[];
  onArchive: (id: string) => Promise<void>;
  onUnarchive: (id: string) => Promise<void>;
  loading: boolean;
};

export default function DocumentTable({ documents, onArchive, onUnarchive, loading }: DocumentTableProps) {
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'archived':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'superseded':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getActionButton = (doc: Document) => {
    if (doc.status === 'active') {
      return (
        <button
          onClick={() => onArchive(doc.id)}
          className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
          Unpublish
        </button>
      );
    } else if (doc.status === 'archived') {
      return (
        <button
          onClick={() => onUnarchive(doc.id)}
          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
        >
          Republish
        </button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Document Management</h3>
        <div className="text-center py-8 text-gray-500">Loading documents...</div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Document Management</h3>
        <div className="text-center py-8 text-gray-500">No documents found</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Document Management</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Topic</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-xs text-gray-500 font-mono">{doc.id}</div>
                </td>
                <td className="py-3 pr-4">
                  <span className={getStatusBadge(doc.status)}>
                    {doc.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {doc.topic_key || '—'}
                </td>
                <td className="py-3">
                  {getActionButton(doc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
