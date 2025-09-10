'use client';
import React from 'react';

type DocumentSearchProps = {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (term: string) => void;
  onStatusChange: (status: string) => void;
  onSearch: () => void;
  loading: boolean;
};

export default function DocumentSearch({ 
  searchTerm, 
  statusFilter, 
  onSearchChange, 
  onStatusChange, 
  onSearch, 
  loading 
}: DocumentSearchProps) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Search Documents</h3>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Search by title or ID</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Enter document title or ID..."
              className="w-full border rounded px-3 py-2"
              onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium mb-2">Status filter</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="all">All documents</option>
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
              <option value="superseded">Superseded only</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={onSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
