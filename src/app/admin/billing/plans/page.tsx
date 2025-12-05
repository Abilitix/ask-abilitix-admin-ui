'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Plus, Edit, Archive, MoreVertical, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  listPlans,
  archivePlan,
  updatePlanStatus,
} from '@/lib/api/billing';
import type { Plan } from '@/lib/types/billing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [planToArchive, setPlanToArchive] = useState<Plan | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Load plans function
  const loadPlans = async () => {
    try {
      setRefreshing(true);
      const data = await listPlans(undefined, true); // Include archived
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast.error('Failed to load plans');
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
        await loadPlans();
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/signin';
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Handle archive
  const handleArchive = async (plan: Plan) => {
    setPlanToArchive(plan);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = async () => {
    if (!planToArchive) return;

    try {
      setArchiving(true);
      const result = await archivePlan(planToArchive.id);
      
      if (result.ok) {
        toast.success(`Plan archived successfully${result.warning ? `. ${result.warning}` : ''}`);
        await loadPlans(); // Refresh list
      }
    } catch (error: any) {
      console.error('Archive failed:', error);
      toast.error(error.message || 'Failed to archive plan');
    } finally {
      setArchiving(false);
      setArchiveDialogOpen(false);
      setPlanToArchive(null);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (plan: Plan, newStatus: 'active' | 'archived' | 'draft') => {
    try {
      await updatePlanStatus(plan.id, { status: newStatus });
      toast.success(`Plan status updated to ${newStatus}`);
      await loadPlans(); // Refresh list
    } catch (error: any) {
      console.error('Status update failed:', error);
      toast.error(error.message || 'Failed to update plan status');
    }
  };

  // Format price
  const formatPrice = (cents?: number) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Get status badge variant - Professional styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors">
            Active
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            Archived
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            Draft
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

  if (!userRole) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header - Best-in-class SaaS pattern */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Plan Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Create and manage billing plans for your tenants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Superadmin
            </Badge>
            <Button 
              onClick={() => toast.info('Create plan form coming soon')}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Plans Table - World-class SaaS design */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">All Plans</CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                {plans.length} plan{plans.length !== 1 ? 's' : ''} total
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPlans}
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
          {plans.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No plans yet</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Create your first billing plan to start managing subscriptions for your tenants.
              </p>
              <Button 
                onClick={() => toast.info('Create plan form coming soon')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Name
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Code
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Seats
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Token Quota
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Monthly Price
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Annual Price
                      </TableHead>
                      <TableHead className="h-12 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan, index) => (
                      <TableRow
                        key={plan.id}
                        className={`border-b border-gray-100 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        } hover:bg-blue-50/50`}
                      >
                        <TableCell className="px-4 py-4">
                          <div className="font-medium text-gray-900">{plan.name}</div>
                          {plan.description && (
                            <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {plan.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                            {plan.code}
                          </code>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          {getStatusBadge(plan.status)}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-gray-900">
                          {plan.max_seats}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-gray-900">
                          {(plan.monthly_token_quota / 1000000).toFixed(1)}M
                        </TableCell>
                        <TableCell className="px-4 py-4 text-gray-900 font-medium">
                          {formatPrice(plan.price_monthly_cents)}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-gray-900 font-medium">
                          {formatPrice(plan.price_annual_cents)}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toast.info('Edit plan form coming soon')}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {plan.status === 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => handleArchive(plan)}
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                                {plan.status === 'archived' && (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(plan, 'active')}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 mb-1">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {plan.description}
                          </div>
                        )}
                        <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                          {plan.code}
                        </code>
                      </div>
                      <div className="ml-3">
                        {getStatusBadge(plan.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <div className="text-gray-600">Seats</div>
                        <div className="font-medium text-gray-900">{plan.max_seats}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Token Quota</div>
                        <div className="font-medium text-gray-900">
                          {(plan.monthly_token_quota / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Monthly</div>
                        <div className="font-medium text-gray-900">
                          {formatPrice(plan.price_monthly_cents)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Annual</div>
                        <div className="font-medium text-gray-900">
                          {formatPrice(plan.price_annual_cents)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Edit plan form coming soon')}
                        className="flex-1 min-h-[44px]"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="min-h-[44px]">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {plan.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(plan)}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {plan.status === 'archived' && (
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(plan, 'active')}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        open={archiveDialogOpen}
        onClose={() => {
          if (!archiving) {
            setArchiveDialogOpen(false);
            setPlanToArchive(null);
          }
        }}
        onConfirm={confirmArchive}
        title="Archive Plan"
        message={
          planToArchive
            ? `Are you sure you want to archive "${planToArchive.name}"? This action can be undone by activating the plan again.`
            : ''
        }
        confirmText="Archive"
        cancelText="Cancel"
        variant="destructive"
        loading={archiving}
        loadingText="Archiving..."
      />
    </div>
  );
}

