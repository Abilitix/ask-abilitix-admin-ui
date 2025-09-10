'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Search, 
  Settings, 
  Bell, 
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Share,
  MessageSquare,
  Zap,
  Shield,
  Globe,
  Database,
  Activity,
  Star,
  Briefcase,
  Laptop,
  GraduationCap,
  Building,
  Cloud,
  Lightbulb,
  Moon,
  User,
  Package,
  Target,
  Calendar,
  ShoppingCart,
  PieChart,
  LineChart
} from 'lucide-react';

export function AbilitixDemoDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timePeriod, setTimePeriod] = useState('monthly');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, active: true },
    { id: 'inbox', label: 'Inbox', icon: Bell },
    { id: 'knowledge', label: 'Knowledge Base', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const kpiData = [
    {
      title: 'Customers',
      value: '3,782',
      change: '+11.01%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Orders',
      value: '5,359',
      change: '-9.05%',
      trend: 'down',
      icon: Package,
      color: 'text-green-600'
    },
    {
      title: 'Monthly Target',
      value: '75.55%',
      change: '+10%',
      trend: 'up',
      icon: Target,
      color: 'text-purple-600'
    }
  ];

  const monthlySalesData = [
    { month: 'Jan', sales: 120 },
    { month: 'Feb', sales: 150 },
    { month: 'Mar', sales: 180 },
    { month: 'Apr', sales: 200 },
    { month: 'May', sales: 250 },
    { month: 'Jun', sales: 300 },
    { month: 'Jul', sales: 280 },
    { month: 'Aug', sales: 320 },
    { month: 'Sep', sales: 350 },
    { month: 'Oct', sales: 400 },
    { month: 'Nov', sales: 380 },
    { month: 'Dec', sales: 200 }
  ];

  const statisticsData = [
    { name: 'Revenue', value: 250, color: 'bg-blue-500' },
    { name: 'Orders', value: 180, color: 'bg-green-500' },
    { name: 'Customers', value: 120, color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Abilitix
                </h1>
                <p className="text-sm text-gray-600 font-medium">Abilitix Consulting</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search or type command..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs">⌘K</Badge>
                </div>
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Moon className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 shadow-sm min-h-screen">
          <div className="p-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">MENU</h2>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.id === 'dashboard' && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">SUPPORT</h2>
              <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-600 hover:bg-gray-50">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Chat</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {kpiData.map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                  <Card key={index} className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                          <div className="flex items-center mt-2">
                            {kpi.trend === 'up' ? (
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm font-medium ${
                              kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {kpi.change}
                            </span>
                          </div>
                        </div>
                        <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center ${kpi.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Monthly Target Card */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Target</h3>
                    <p className="text-sm text-gray-600">Target you've set for each month</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">75.55%</div>
                    <div className="text-sm text-green-600 font-medium">+10%</div>
                  </div>
                </div>
                
                {/* Progress Ring */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.7555)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">75.55%</div>
                        <div className="text-sm text-green-600 font-medium">+10%</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    You earn $3,287 today, it's higher than last month. Keep up your good work!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Target</div>
                    <div className="text-lg font-semibold text-red-600">$20K ↓</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Revenue</div>
                    <div className="text-lg font-semibold text-green-600">$20K ↑</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Today</div>
                    <div className="text-lg font-semibold text-green-600">$20K ↑</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Sales Chart */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Monthly Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end space-x-2">
                    {monthlySalesData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${(data.sales / 400) * 200}px` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2">{data.month}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Chart */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">Statistics</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant={timePeriod === 'monthly' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimePeriod('monthly')}
                      >
                        Monthly
                      </Button>
                      <Button
                        variant={timePeriod === 'quarterly' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimePeriod('quarterly')}
                      >
                        Quarterly
                      </Button>
                      <Button
                        variant={timePeriod === 'annually' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimePeriod('annually')}
                      >
                        Annually
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end space-x-4">
                    {statisticsData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-full ${data.color} rounded-t`}
                          style={{ height: `${(data.value / 250) * 200}px` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2">{data.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technical Support */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Cloud className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Technical Support</h3>
                      <p className="text-sm text-gray-600">Get help from our support team</p>
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <Clock className="w-4 h-4 mr-2" />
                    View Complete Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}