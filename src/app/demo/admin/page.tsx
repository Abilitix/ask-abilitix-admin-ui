import Link from 'next/link';

export default function DemoAdminPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-blue-900 mb-4">Welcome to Demo Workspace</h1>
          <p className="text-blue-700 mb-6">
            You're now in the Ask Abilitix demo environment. This is a safe space to explore our features.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Demo Features Available:</h3>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li>• Explore the AI assistant and RAG functionality</li>
                <li>• Test document upload and management</li>
                <li>• Try different user roles and permissions</li>
                <li>• Experience the full admin interface</li>
              </ul>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Link 
                href="/admin/rag" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try AI Assistant
              </Link>
              <Link 
                href="/admin" 
                className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Go to Admin Dashboard
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> This is a demo environment. To create a real workspace for your organization, 
                <Link href="/signup" className="text-yellow-900 underline hover:no-underline ml-1">
                  sign up here
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
