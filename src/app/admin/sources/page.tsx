'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cloud, Link2, Info } from 'lucide-react';

export default function SourcesPage() {
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header - Best-in-class SaaS pattern */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Data Sources</h1>
            <p className="text-sm text-gray-500 mt-1">
              Connect and manage your document sources
            </p>
          </div>
        </div>
      </div>

      {/* Testing Mode Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Data Sources (Testing Mode)
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Some integrations are currently in testing mode. When connecting, you may see warnings about unverified apps. This is expected and safe—you can proceed by clicking "Advanced" and then "Go to Ask Abilitix (unsafe)".
            </p>
          </div>
        </div>
      </div>

      {/* Available Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Available Sources
          </CardTitle>
          <CardDescription>
            Connect external services to automatically sync documents to Ask Abilitix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Google Drive */}
            <Link href="/admin/sources/gdrive">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <Cloud className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Google Drive</div>
                    <div className="text-sm text-gray-600">
                      Sync documents from your Google Drive account
                    </div>
                  </div>
                </div>
                <div className="text-gray-400">
                  →
                </div>
              </div>
            </Link>

            {/* Coming Soon - Placeholder for future sources */}
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-500">More Sources Coming Soon</div>
                  <div className="text-sm text-gray-400">
                    SharePoint, OneDrive, Box, and more integrations will be available soon
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

