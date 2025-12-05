'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, RefreshCw, ShieldCheck, ArrowRight, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listTenantsWithBilling, getTenantBilling, getTenantUsage, getTenantQuota } from '@/lib/api/billing';
import type { TenantBilling, Usage, Quota } from '@/lib/types/billing';

// Extended type for list display
interface TenantBillingListItem extends TenantBilling {
  tenant_name?: string;
  tenant_slug?: string;
  current_usage?: Usage;
  quota?: Quota;
}

export default function TenantBillingListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantBillingListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load tenants with billing information
  const loadTenants = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Get list of tenants with billing from billing API
      const fetchedTenants = await listTenantsWithBilling();
      
      // If no tenants with billing, show empty state
      if (fetchedTenants.length === 0) {
        setTenants([]);
        return;
      }
      
      // Enrich with usage and quota data
      const tenantsWithBilling: TenantBillingListItem[] = await Promise.all(
        fetchedTenants.map(async (tb) => {
          // For now, use tenant_id as name/slug placeholder
          // In a real scenario, the backend would return tenant name/slug
          const tenant_name = `Tenant ${tb.tenant_id.slice(0, 8)}`;
          const tenant_slug = `tenant-${tb.tenant_id.slice(0, 8)}`;

          let current_usage: Usage | undefined;
          let quota: Quota | undefined;

          try {
            current_usage = await getTenantUsage(tb.tenant_id);
            quota = await getTenantQuota(tb.tenant_id);
          } catch (usageError) {
            console.warn(`Failed to fetch usage/quota for tenant ${tb.tenant_id}:`, usageError);
          }

          return {
            ...tb,
            tenant_name,
            tenant_slug,
            current_usage,
            quota,
          };
        })
      );

      setTenants(tenantsWithBilling);
    } catch (error: any) {
      console.error('Failed to load tenants:', error);
      const errorMessage = error.message || 'Failed to load tenant billing data';
      toast.error(errorMessage);
      // Set empty array on error so UI shows empty state instead of crashing
      setTenants([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Check SuperAdmin auth
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          router.push('/signin');
          return;
        }
        const user = await res.json();
        
        const SUPERADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS?.split(',') ?? [];
        const isSuperAdmin = SUPERADMIN_EMAILS.includes(user?.email ?? '');
        
        if (!isSuperAdmin) {
          router.push('/admin/docs?error=insufficient_permissions');
          return;
        }
        
        await loadTenants();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, loadTenants]);

  // Format tokens
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">No Status</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Past Due</Badge>;
      case 'canceled':
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading tenant billing data...</p>
        </div>
      </div>
    );
  }

  const pathname = usePathname();

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Billing</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage billing plans and tenant subscriptions
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Superadmin
          </Badge>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-gray-200 mt-6">
          <Link
            href="/admin/billing/plans"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname === '/admin/billing/plans'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Plans
          </Link>
          <Link
            href="/admin/billing/tenants"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname?.startsWith('/admin/billing/tenants') && !pathname.includes('/tenants/')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Tenants
          </Link>
          <Link
            href="/admin/billing/settings"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname === '/admin/billing/settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Settings
          </Link>
        </div>
      </div>

      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Tenant Billing</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage billing plans and usage for all tenants
        </p>
      </div>

      {/* Tenants Table */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">All Tenants</CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} with billing
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTenants}
              disabled={refreshing}
              className="min-h-[44px] sm:min-h-0"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tenants.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tenants with billing</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Tenants will appear here once they have been assigned a billing plan.
              </p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The tenant billing list endpoint may not be implemented yet. 
                  If you see this message, the backend endpoint <code className="text-xs bg-blue-100 px-1 rounded">GET /admin/billing/tenants</code> needs to be created.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Tenant
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Plan
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Usage
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Quota
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant, index) => (
                      <TableRow
                        key={tenant.tenant_id}
                        className={`border-b border-gray-100 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        } hover:bg-blue-50/50`}
                      >
                        <TableCell className="px-4 py-4">
                          <div className="font-medium text-gray-900">{tenant.tenant_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-600 mt-1">{tenant.tenant_slug || tenant.tenant_id}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="font-medium text-gray-900">{tenant.plan_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{tenant.plan_code}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {getStatusBadge(tenant.stripe_subscription_status)}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {tenant.current_usage ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatTokens(tenant.current_usage.tokens_used)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {tenant.current_usage.requests.toLocaleString()} requests
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {tenant.quota ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatTokens(tenant.quota.current_usage)} / {formatTokens(tenant.quota.effective_quota)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {tenant.quota.current_seats} / {tenant.quota.effective_seat_cap} seats
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/billing/tenants/${tenant.tenant_id}`)}
                            className="h-8"
                          >
                            View
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.tenant_id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 mb-1">
                          {tenant.tenant_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {tenant.tenant_slug || tenant.tenant_id}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {tenant.plan_name}
                          </Badge>
                          {getStatusBadge(tenant.stripe_subscription_status)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      {tenant.current_usage && (
                        <>
                          <div>
                            <div className="text-gray-600">Tokens Used</div>
                            <div className="font-medium text-gray-900">
                              {formatTokens(tenant.current_usage.tokens_used)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Requests</div>
                            <div className="font-medium text-gray-900">
                              {tenant.current_usage.requests.toLocaleString()}
                            </div>
                          </div>
                        </>
                      )}
                      {tenant.quota && (
                        <>
                          <div>
                            <div className="text-gray-600">Quota</div>
                            <div className="font-medium text-gray-900">
                              {formatTokens(tenant.quota.current_usage)} / {formatTokens(tenant.quota.effective_quota)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Seats</div>
                            <div className="font-medium text-gray-900">
                              {tenant.quota.current_seats} / {tenant.quota.effective_seat_cap}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/billing/tenants/${tenant.tenant_id}`)}
                      className="w-full min-h-[44px]"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

