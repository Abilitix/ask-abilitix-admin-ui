import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Abilitix Admin
          </h1>
          <p className="text-gray-600 mb-8">
            Manage your RAG system and documents
          </p>
          
          <div className="space-y-4">
            <Link
              href="/admin/settings"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Settings
            </Link>
            
            <Link
              href="/admin/docs"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Documents
            </Link>
            
            <Link
              href="/admin/rag"
              className="block w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              RAG Testing
            </Link>
            
            <Link
              href="/admin/inbox"
              className="block w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 transition-colors"
            >
              Inbox
            </Link>
            
            <Link
              href="/signup"
              className="block w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
