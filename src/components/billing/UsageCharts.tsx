'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Loader2, Download, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTenantUsage } from '@/lib/api/billing';
import type { Usage } from '@/lib/types/billing';
import { toast } from 'sonner';

type DateRange = '6months' | '12months' | 'custom';

interface UsageChartsProps {
  tenantId: string;
  quota?: number;
}

export function UsageCharts({ tenantId, quota }: UsageChartsProps) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('6months');
  const [usageData, setUsageData] = useState<Usage[]>([]);
  const [comparison, setComparison] = useState<{
    currentMonth: number;
    previousMonth: number;
    changePercent: number;
  } | null>(null);

  useEffect(() => {
    loadUsageData();
  }, [tenantId, dateRange]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      
      const months = getMonthsForRange(dateRange);
      const usagePromises = months.map(month => 
        getTenantUsage(tenantId, month).catch(() => null)
      );
      
      const results = await Promise.all(usagePromises);
      const validUsage = results.filter((u): u is Usage => u !== null);
      
      // Sort by month (oldest first)
      validUsage.sort((a, b) => a.month.localeCompare(b.month));
      
      setUsageData(validUsage);
      
      // Calculate month-over-month comparison
      if (validUsage.length >= 2) {
        const current = validUsage[validUsage.length - 1];
        const previous = validUsage[validUsage.length - 2];
        const change = current.tokens_used - previous.tokens_used;
        const changePercent = previous.tokens_used > 0 
          ? Math.round((change / previous.tokens_used) * 100)
          : 0;
        
        setComparison({
          currentMonth: current.tokens_used,
          previousMonth: previous.tokens_used,
          changePercent,
        });
      } else {
        setComparison(null);
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
      toast.error('Failed to load usage history');
    } finally {
      setLoading(false);
    }
  };

  const getMonthsForRange = (range: DateRange): string[] => {
    const months: string[] = [];
    const today = new Date();
    const count = range === '6months' ? 6 : 12;
    
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      months.push(monthStr);
    }
    
    return months;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toLocaleString();
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const exportToCSV = () => {
    if (usageData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Month', 'Tokens Used', 'Requests', 'Invites Sent'];
    const rows = usageData.map(u => [
      formatMonth(u.month),
      u.tokens_used.toString(),
      u.requests.toString(),
      u.invites_sent.toString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Usage data exported to CSV');
  };

  const exportToJSON = () => {
    if (usageData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const json = JSON.stringify(usageData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Usage data exported to JSON');
  };

  // Prepare chart data
  const chartData = usageData.map(u => ({
    month: formatMonth(u.month),
    monthShort: u.month,
    tokens: u.tokens_used,
    requests: u.requests,
    invites: u.invites_sent,
    quota: quota || 0,
    usagePercent: quota && quota > 0 ? Math.round((u.tokens_used / quota) * 100) : 0,
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Usage Analytics
              </CardTitle>
              <CardDescription>Token usage and request trends over time</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="min-w-[140px]"
              >
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={usageData.length === 0}
                  className="min-h-[44px] sm:min-h-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToJSON}
                  disabled={usageData.length === 0}
                  className="min-h-[44px] sm:min-h-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Month-over-Month Comparison */}
      {comparison && (
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Current Month</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatTokens(comparison.currentMonth)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Previous Month</div>
                <div className="text-2xl font-bold text-gray-700">
                  {formatTokens(comparison.previousMonth)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Change</div>
                <div className={`text-2xl font-bold flex items-center gap-1 ${
                  comparison.changePercent >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  <TrendingUp className={`h-5 w-5 ${
                    comparison.changePercent >= 0 ? 'rotate-180' : ''
                  }`} />
                  {Math.abs(comparison.changePercent)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Usage Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Token Usage Over Time</CardTitle>
          <CardDescription>Monthly token consumption trends</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => formatTokens(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => formatTokens(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Tokens Used"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                {quota && quota > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey="quota" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Quota Limit"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No usage data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Trends Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Request Trends</CardTitle>
          <CardDescription>Monthly request volume</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
                <Legend />
                <Bar 
                  dataKey="requests" 
                  fill="#10b981" 
                  name="Requests"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No request data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Usage History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Monthly Usage History</CardTitle>
          <CardDescription>Detailed breakdown by month</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tokens Used</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Requests</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Invites Sent</th>
                    {quota && quota > 0 && (
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Usage %</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{row.month}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                        {formatTokens(row.tokens)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">
                        {row.requests.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">
                        {row.invites.toLocaleString()}
                      </td>
                      {quota && quota > 0 && (
                        <td className="py-3 px-4 text-sm text-right">
                          <span className={`font-medium ${
                            row.usagePercent >= 90 ? 'text-red-600' :
                            row.usagePercent >= 75 ? 'text-yellow-600' :
                            'text-gray-700'
                          }`}>
                            {row.usagePercent}%
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No usage history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

