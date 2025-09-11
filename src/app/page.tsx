import Link from "next/link";

export default function Home() {
  const cards = [
    {
      href: "/admin/settings",
      title: "Settings",
      description: "Configure RAG parameters, widget keys, and system settings",
      icon: "⚙️",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      href: "/admin/docs",
      title: "Documents",
      description: "Upload, manage, and organize your knowledge base",
      icon: "📄",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      href: "/admin/rag",
      title: "RAG Testing",
      description: "Test queries and validate retrieval performance",
      icon: "🧠",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      href: "/admin/inbox",
      title: "Inbox",
      description: "Review and approve pending Q&A items",
      icon: "📥",
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      href: "/signup",
      title: "Create Workspace",
      description: "Set up a new tenant workspace",
      icon: "➕",
      color: "bg-indigo-500 hover:bg-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Visual test for Tailwind */}
      <div className="h-2 rounded bg-emerald-600" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Abilitix Admin
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage your AI-powered knowledge management platform with ease. 
            Upload documents, configure settings, and monitor performance.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform duration-200`}>
                  {card.icon}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">5</div>
              <div className="text-sm text-gray-600">Admin Tools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}