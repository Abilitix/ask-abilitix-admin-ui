'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  fetchTenantMetrics, 
  runDailyRollup, 
  getTodaySydney, 
  formatDateForAPI,
  getLast24Hours,
  type TenantMetrics
} from '@/lib/api/superadmin';

export default function SuperadminPage() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Data state
  const [tenants, setTenants] = useState<TenantMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Loading states
  const [refreshing, setRefreshing] = useState(false);
  const [rollupLoading, setRollupLoading] = useState(false);

  // Load tenant data
  const loadTenants = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const { from, to } = getLast24Hours();
      const data = await fetchTenantMetrics(from, to, 100);
      setTenants(data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
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
        await loadTenants();
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
        await loadTenants();
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

  if (!userRole) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Superadmin Console</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            System health, tenant posture, and audit logs
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Superadmin
        </Badge>
      </div>

      {/* Audit Feed Placeholder (Deferred) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Feed
          </CardTitle>
          <CardDescription>
            Recent system actions and administrative events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">Audit Feed Coming Soon</p>
            <p className="text-sm">
              This feature will display recent administrative actions and system events
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Posture & Freshness Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tenant Posture & Freshness</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadTenants}
            disabled={refreshing}
            aria-label="Refresh tenant data"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
        
        {error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-red-500">
                <Activity className="h-12 w-12 mx-auto mb-2" />
                <p>Error loading tenant data</p>
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={loadTenants}
                  className="mt-4"
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Retry'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : tenants.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tenant data available</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
              <Card key={tenant.tenant_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span 
                      className="cursor-pointer" 
                      onClick={() => navigator.clipboard.writeText(tenant.tenant_id)}
                      title={tenant.tenant_id}
                    >
                      {tenant.tenant_id}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Privacy Posture</span>
                      <Badge variant={tenant.calls > 0 ? "default" : "outline"}>
                        {tenant.calls > 0 ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data Freshness</span>
                      <Badge variant={tenant.p95_ms < 5000 ? "default" : "destructive"}>
                        {tenant.p95_ms < 5000 ? "Fast" : "Slow"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Calls</span>
                      <span className="text-muted-foreground">{tenant.calls.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tokens</span>
                      <span className="text-muted-foreground">{tenant.tokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>p95 Latency</span>
                      <span className="text-muted-foreground">{tenant.p95_ms.toFixed(0)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
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
              <>
                <Activity className="h-4 w-4 mr-2" aria-hidden="true" />
                Run Daily Rollup
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => toast.info('Feature coming soon')}
          >
            <Shield className="h-4 w-4 mr-2" />
            View System Health
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

