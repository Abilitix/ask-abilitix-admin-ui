'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, BarChart3, AlertTriangle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchGovernanceKPIs, 
  runDailyRollup, 
  getTodaySydney, 
  formatDateForAPI,
  getLast24Hours,
  type MetricsSummary,
  type TenantMetrics,
  type Violation,
  type Budget
} from '@/lib/api/superadmin';

export default function GovernancePage() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Data state
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [tenants, setTenants] = useState<TenantMetrics[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  
  // Filter state
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  
  // Loading states
  const [refreshing, setRefreshing] = useState(false);
  const [rollupLoading, setRollupLoading] = useState(false);

  // Load data function
  const loadData = async (from?: string, to?: string) => {
    try {
      setRefreshing(true);
      const data = await fetchGovernanceKPIs(from, to);
      
      setSummary(data.summary);
      setTenants(data.tenants);
      setViolations(data.violations);
      setBudgets(data.budgets);
      setErrors(data.errors);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load governance data');
    } finally {
      setRefreshing(false);
    }
  };

  // Check if user is platform superadmin (email-based)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          window.location.href = '/signin';
          return;
        }
        const user = await res.json();
        
        // Check if user email is in superadmin list
        const SUPERADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS?.split(',') ?? [];
        const isSuperAdmin = SUPERADMIN_EMAILS.includes(user?.email ?? '');
        
        if (!isSuperAdmin) {
          window.location.href = '/admin/docs?error=insufficient_permissions';
          return;
        }
        
        setUserRole(user.role);
        
        // Load initial data (last 24h)
        const { from, to } = getLast24Hours();
        setDateFrom(from);
        setDateTo(to);
        await loadData(from, to);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/signin';
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Handler functions
  const handleApplyFilters = () => {
    loadData(dateFrom || undefined, dateTo || undefined);
  };

  const handleRunRollup = async () => {
    try {
      setRollupLoading(true);
      const today = formatDateForAPI(getTodaySydney());
      const result = await runDailyRollup(today);
      
      if (result.ok) {
        toast.success(`Rollup completed for ${result.date} (${result.rows_upserted} rows)`);
        if (result.warning) {
          toast.warning(result.warning);
        }
        // Refresh data after rollup
        await loadData(dateFrom || undefined, dateTo || undefined);
      } else {
        toast.error('Rollup failed');
      }
    } catch (error) {
      console.error('Rollup failed:', error);
      toast.error('Failed to run rollup');
    } finally {
      setRollupLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!userRole) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Governance & Telemetry</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Privacy posture, usage metrics, and policy violations
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Superadmin
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-from">From</Label>
              <Input
                id="date-from"
                type="date"
                placeholder="Start date"
              />
            </div>
            <div>
              <Label htmlFor="date-to">To</Label>
              <Input
                id="date-to"
                type="date"
                placeholder="End date"
              />
            </div>
            <div>
              <Label htmlFor="tenant-filter">Tenant (optional)</Label>
              <Input
                id="tenant-filter"
                type="text"
                placeholder="Tenant UUID"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={handleApplyFilters}
              disabled={refreshing}
              aria-label="Apply date and tenant filters"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  Loading...
                </>
              ) : (
                'Apply Filters'
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const { from, to } = getLast24Hours();
                setDateFrom(from);
                setDateTo(to);
                loadData(from, to);
              }}
              aria-label="Set filters to last 24 hours"
            >
              Last 24h
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              No-store %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? `${summary.no_store_pct.toFixed(1)}%` : '–'}
            </div>
            {errors.summary && (
              <div className="text-xs text-red-500 mt-1">{errors.summary}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              p95 Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? `${summary.p95_latency_ms.toFixed(0)}ms` : '–'}
            </div>
            {errors.summary && (
              <div className="text-xs text-red-500 mt-1">{errors.summary}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? summary.violations_count.toLocaleString() : '–'}
            </div>
            {errors.summary && (
              <div className="text-xs text-red-500 mt-1">{errors.summary}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tokens Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? (summary.in_tokens + summary.out_tokens).toLocaleString() : '–'}
            </div>
            {errors.summary && (
              <div className="text-xs text-red-500 mt-1">{errors.summary}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Tenants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Tenants by Tokens</CardTitle>
              <CardDescription>
                {tenants.length} tenants shown
              </CardDescription>
            </div>
            {tenants.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(tenants, 'top-tenants.csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {errors.tenants ? (
            <div className="text-center py-8 text-red-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <p>Error loading tenant data</p>
              <p className="text-sm">{errors.tenants}</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tenant data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Top tenants by token usage">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2" scope="col">Tenant ID</th>
                    <th className="text-right py-2" scope="col">Calls</th>
                    <th className="text-right py-2" scope="col">Tokens</th>
                    <th className="text-right py-2" scope="col">p95 Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant, idx) => (
                    <tr key={tenant.tenant_id} className="border-b hover:bg-muted/50">
                      <td className="py-2 font-mono text-xs" title={tenant.tenant_id}>
                        <span className="cursor-pointer" onClick={() => navigator.clipboard.writeText(tenant.tenant_id)}>
                          {tenant.tenant_id}
                        </span>
                      </td>
                      <td className="text-right py-2">
                        {tenant.calls.toLocaleString()}
                      </td>
                      <td className="text-right py-2">
                        {tenant.tokens.toLocaleString()}
                      </td>
                      <td className="text-right py-2">
                        {tenant.p95_ms.toFixed(0)}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Violations</CardTitle>
              <CardDescription>
                {violations.length} violations shown
              </CardDescription>
            </div>
            {violations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(violations, 'violations.csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {errors.violations ? (
            <div className="text-center py-8 text-red-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <p>Error loading violations data</p>
              <p className="text-sm">{errors.violations}</p>
            </div>
          ) : violations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No violations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Recent policy violations">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2" scope="col">Time</th>
                    <th className="text-left py-2" scope="col">Tenant</th>
                    <th className="text-left py-2" scope="col">Route</th>
                    <th className="text-left py-2" scope="col">Kind</th>
                    <th className="text-left py-2" scope="col">Model</th>
                    <th className="text-left py-2" scope="col">Violations</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((violation, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-2 text-xs" title={new Date(violation.ts).toLocaleString()}>
                        {new Date(violation.ts).toLocaleString()}
                      </td>
                      <td className="py-2 font-mono text-xs" title={violation.tenant_id}>
                        {violation.tenant_id.substring(0, 8)}...
                      </td>
                      <td className="py-2">{violation.route}</td>
                      <td className="py-2">{violation.kind}</td>
                      <td className="py-2">{violation.model}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1" role="list" aria-label="Policy violations">
                          {violation.violations.map((v, i) => (
                            <Badge key={i} variant="destructive" className="text-xs" role="listitem">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rollup Action */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Rollup</CardTitle>
          <CardDescription>
            Manually trigger daily metrics aggregation for {formatDateForAPI(getTodaySydney())}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleRunRollup}
            disabled={rollupLoading}
            aria-label="Run daily metrics rollup for today"
          >
            {rollupLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Running Rollup...
              </>
            ) : (
              'Run Daily Rollup'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

