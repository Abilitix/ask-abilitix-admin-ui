"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTenant } from "@/components/TenantContext";

type DocsStats = { 
  total: number; 
  with_vec: number; 
  missing_vec: number; 
  archived: number 
};

type InboxStats = { 
  pending: number; 
  approved_today: number 
};

// Correlation ID helper
function rid() { 
  return Math.random().toString(36).slice(2, 10); 
}

// Safe fetch with timeout and correlation ID
async function safeJson<T>(url: string, init?: RequestInit, ms = 8000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { 
      cache: "no-store", 
      signal: ctrl.signal, 
      ...init 
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json() as T;
  } finally { 
    clearTimeout(t); 
  }
}

interface AdminV2ClientProps {
  user: {
    email: string;
    role: string;
  };
}

export default function AdminV2Client({ user }: AdminV2ClientProps) {
  const [docs, setDocs] = useState<DocsStats | null>(null);
  const [inbox, setInbox] = useState<InboxStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { tenant, loading: tenantLoading } = useTenant();

  useEffect(() => {
    let mounted = true;
    const correlationId = rid();
    
    (async () => {
      try {
        console.log(`[/admin/v2] Starting data fetch with correlation ID: ${correlationId}`);
        
        const [d, i] = await Promise.all([
          safeJson<DocsStats>(`/api/admin/docs/stats?rid=${correlationId}`),
          safeJson<InboxStats>(`/api/admin/inbox?summary=1&rid=${correlationId}`),
        ]);
        
        if (!mounted) return;
        
        setDocs(d); 
        setInbox(i);
        console.log(`[/admin/v2] Data fetch completed successfully for correlation ID: ${correlationId}`);
        
      } catch (e: any) {
        if (!mounted) return;
        
        const errorMsg = e?.message ?? "Failed to load";
        console.error("[/admin/v2] load_failed", { 
          id: correlationId, 
          err: errorMsg 
        });
        
        setErr(errorMsg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => { 
      mounted = false; 
    };
  }, []);

  const docsMetric = useMemo(() => 
    docs ? `${docs.total ?? 0} active • ${docs.archived ?? 0} archived` : "", 
    [docs]
  );
  
  const inboxMetric = useMemo(() => 
    inbox ? `${inbox.pending ?? 0} pending • ${inbox.approved_today ?? 0} approved today` : "", 
    [inbox]
  );

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold">
                  <span className="text-[#1e3a8a]">Abiliti</span>
                  <span className="text-[#84cc16]">X</span>
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email} ({user.role})
              </span>
              {tenant && (
                <span className="text-sm text-gray-600">
                  {tenant.slug || tenant.name || 'Loading...'}
                </span>
              )}
              <Link 
                href="/api/auth/logout" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1e3a8a] mb-2">
            Admin Dashboard (Beta)
          </h1>
          <p className="text-gray-600">
            Enhanced dashboard with real-time metrics and improved UX
          </p>
        </div>

        {err && (
          <div 
            role="alert" 
            className="mb-6 rounded-lg border border-[#ef4444]/30 bg-red-50 p-4 text-sm text-red-800"
          >
            <strong>Error:</strong> {err} — Please try again later.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {/* RAG Testing Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#84cc16]/10 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#84cc16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">RAG Testing</h3>
                    <p className="text-sm text-gray-600">Test your AI knowledge base</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{docsMetric || "Loading metrics..."}</p>
                <Link 
                  href="/admin/rag"
                  className="inline-flex items-center px-4 py-2 bg-[#84cc16] text-[#1e3a8a] text-sm font-medium rounded-md hover:bg-[#84cc16]/90 transition-colors"
                >
                  Test Chat
                </Link>
              </div>

              {/* Inbox Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#84cc16]/10 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#84cc16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Inbox</h3>
                    <p className="text-sm text-gray-600">Review and approve Q&As</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{inboxMetric || "Loading metrics..."}</p>
                <Link 
                  href="/admin/inbox"
                  className="inline-flex items-center px-4 py-2 bg-[#84cc16] text-[#1e3a8a] text-sm font-medium rounded-md hover:bg-[#84cc16]/90 transition-colors"
                >
                  Review Items
                </Link>
              </div>

              {/* Documents Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#84cc16]/10 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#84cc16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    <p className="text-sm text-gray-600">Manage your knowledge base</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">{docsMetric || "Loading metrics..."}</p>
                <Link 
                  href="/admin/docs"
                  className="inline-flex items-center px-4 py-2 bg-[#84cc16] text-[#1e3a8a] text-sm font-medium rounded-md hover:bg-[#84cc16]/90 transition-colors"
                >
                  Manage Docs
                </Link>
              </div>

              {/* Settings Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-[#84cc16]/10 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-[#84cc16]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                    <p className="text-sm text-gray-600">Configure your system</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">Last updated just now</p>
                <Link 
                  href="/admin/settings"
                  className="inline-flex items-center px-4 py-2 bg-[#84cc16] text-[#1e3a8a] text-sm font-medium rounded-md hover:bg-[#84cc16]/90 transition-colors"
                >
                  Open Settings
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
