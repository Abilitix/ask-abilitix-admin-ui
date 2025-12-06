'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Plus, Edit, Archive, MoreVertical, RefreshCw, ShieldCheck, Users, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  listPlans,
  archivePlan,
  updatePlanStatus,
  createPlan,
  updatePlan,
  getPlan,
} from '@/lib/api/billing';
import type { Plan, CreatePlanPayload, UpdatePlanPayload } from '@/lib/types/billing';
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

  // Create plan dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreatePlanPayload>({
    code: '',
    name: '',
    description: '',
    max_seats: 1,
    monthly_token_quota: 1000000,
    features: {},
    price_monthly_cents: 0,
    price_annual_cents: 0,
    display_order: 0,
    is_popular: false,
  });

  // Edit plan dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [editFormData, setEditFormData] = useState<UpdatePlanPayload>({});

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
      // Optimistically update the plan in local state
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.id === plan.id ? { ...p, status: newStatus } : p
        )
      );
      
      // Update via API
      const updatedPlan = await updatePlanStatus(plan.id, { status: newStatus });
      
      // Update with the actual response from API (in case backend has additional changes)
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.id === plan.id ? updatedPlan : p
        )
      );
      
      toast.success(`Plan status updated to ${newStatus}`);
      
      // Also refresh the full list to ensure consistency
      await loadPlans();
    } catch (error: any) {
      console.error('Status update failed:', error);
      toast.error(error.message || 'Failed to update plan status');
      // Revert optimistic update on error
      await loadPlans();
    }
  };

  // Handle create plan
  const handleCreatePlan = async () => {
    try {
      setCreating(true);
      
      // Validate required fields
      if (!formData.code || !formData.name) {
        toast.error('Code and name are required');
        return;
      }
      
      if (formData.max_seats < 1) {
        toast.error('Max seats must be at least 1');
        return;
      }
      
      if (formData.monthly_token_quota < 0) {
        toast.error('Monthly token quota must be 0 or greater');
        return;
      }

      // Create the plan
      await createPlan(formData);
      toast.success('Plan created successfully');
      
      // Reset form and close dialog
      setFormData({
        code: '',
        name: '',
        description: '',
        max_seats: 1,
        monthly_token_quota: 1000000,
        features: {},
        price_monthly_cents: 0,
        price_annual_cents: 0,
        display_order: 0,
        is_popular: false,
      });
      setCreateDialogOpen(false);
      
      // Refresh plans list
      await loadPlans();
    } catch (error: any) {
      console.error('Create plan failed:', error);
      toast.error(error.message || 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  // Handle open edit dialog
  const handleOpenEditDialog = async (plan: Plan) => {
    try {
      // Load full plan data (in case we need latest info)
      const fullPlan = await getPlan(plan.id);
      setPlanToEdit(fullPlan);
      
      // Pre-fill form with plan data
      setEditFormData({
        name: fullPlan.name,
        description: fullPlan.description || '',
        max_seats: fullPlan.max_seats,
        monthly_token_quota: fullPlan.monthly_token_quota,
        features: fullPlan.features || {},
        stripe_product_id: fullPlan.stripe_product_id || '',
        stripe_price_id_monthly: fullPlan.stripe_price_id_monthly || '',
        stripe_price_id_annual: fullPlan.stripe_price_id_annual || '',
        price_monthly_cents: fullPlan.price_monthly_cents || 0,
        price_annual_cents: fullPlan.price_annual_cents || 0,
        display_order: fullPlan.display_order,
        is_popular: fullPlan.is_popular,
      });
      
      setEditDialogOpen(true);
    } catch (error: any) {
      console.error('Failed to load plan for editing:', error);
      toast.error(error.message || 'Failed to load plan details');
    }
  };

  // Handle update plan
  const handleUpdatePlan = async () => {
    if (!planToEdit) return;

    try {
      setEditing(true);
      
      // Validate required fields if they're being updated
      if (editFormData.max_seats !== undefined && editFormData.max_seats < 1) {
        toast.error('Max seats must be at least 1');
        return;
      }
      
      if (editFormData.monthly_token_quota !== undefined && editFormData.monthly_token_quota < 0) {
        toast.error('Monthly token quota must be 0 or greater');
        return;
      }

      // Update the plan
      await updatePlan(planToEdit.id, editFormData);
      toast.success('Plan updated successfully');
      
      // Close dialog
      setEditDialogOpen(false);
      setPlanToEdit(null);
      setEditFormData({});
      
      // Refresh plans list
      await loadPlans();
    } catch (error: any) {
      console.error('Update plan failed:', error);
      toast.error(error.message || 'Failed to update plan');
    } finally {
      setEditing(false);
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

  const pathname = usePathname();

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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Billing</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage billing plans and tenant subscriptions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Superadmin
            </Badge>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
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
              pathname === '/admin/billing/tenants'
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
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Plan Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Create and manage billing plans for your tenants
        </p>
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
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] sm:min-h-0"
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
                              onClick={() => handleOpenEditDialog(plan)}
                              className="h-8 w-8 p-0 min-h-[44px] sm:min-h-0"
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
                        onClick={() => handleOpenEditDialog(plan)}
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

      {/* Create Plan Dialog */}
      {createDialogOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creating) {
              setCreateDialogOpen(false);
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <Card
            className="w-full max-w-2xl mx-4 bg-white shadow-2xl border-0 animate-in zoom-in-95 fade-in-0 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Create New Plan
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    Create a new billing plan for your tenants
                  </CardDescription>
                </div>
                {!creating && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCreateDialogOpen(false)}
                    className="h-8 w-8 rounded-full hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6 space-y-6">
              {/* Required Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-code">Plan Code *</Label>
                  <Input
                    id="plan-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., starter, pro, enterprise"
                    disabled={creating}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Unique identifier (lowercase, no spaces)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan Name *</Label>
                  <Input
                    id="plan-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Starter Plan"
                    disabled={creating}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-description">Description</Label>
                <Input
                  id="plan-description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the plan"
                  disabled={creating}
                  className="min-h-[44px] sm:min-h-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-seats">Max Seats *</Label>
                  <Input
                    id="max-seats"
                    type="number"
                    min="1"
                    value={formData.max_seats}
                    onChange={(e) => setFormData({ ...formData, max_seats: parseInt(e.target.value) || 1 })}
                    disabled={creating}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token-quota">Monthly Token Quota *</Label>
                  <Input
                    id="token-quota"
                    type="number"
                    min="0"
                    value={formData.monthly_token_quota}
                    onChange={(e) => setFormData({ ...formData, monthly_token_quota: parseInt(e.target.value) || 0 })}
                    disabled={creating}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Tokens per month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-monthly">Monthly Price (cents)</Label>
                  <Input
                    id="price-monthly"
                    type="number"
                    min="0"
                    value={formData.price_monthly_cents || 0}
                    onChange={(e) => setFormData({ ...formData, price_monthly_cents: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    disabled={creating}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Price in cents (e.g., 9900 = $99.00)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-annual">Annual Price (cents)</Label>
                  <Input
                    id="price-annual"
                    type="number"
                    min="0"
                    value={formData.price_annual_cents || 0}
                    onChange={(e) => setFormData({ ...formData, price_annual_cents: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    disabled={creating}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Price in cents (e.g., 99000 = $990.00)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display-order">Display Order</Label>
                  <Input
                    id="display-order"
                    type="number"
                    min="0"
                    value={formData.display_order || 0}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    disabled={creating}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is-popular">Popular Plan</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="is-popular"
                      checked={formData.is_popular || false}
                      onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                      disabled={creating}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is-popular" className="text-sm text-gray-700">
                      Mark as popular plan
                    </label>
                  </div>
                </div>
              </div>

              {/* Features JSON Editor (Phase 1 - JSON only, toggles in Phase 3) */}
              <div className="space-y-2">
                <Label htmlFor="plan-features">Features (JSON)</Label>
                <textarea
                  id="plan-features"
                  value={JSON.stringify(formData.features || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, features: parsed });
                    } catch {
                      // Invalid JSON, keep as is
                    }
                  }}
                  placeholder='{"feature1": true, "feature2": false}'
                  rows={6}
                  disabled={creating}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                />
                <p className="text-xs text-gray-500">JSON object for plan features (toggles coming in Phase 3)</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!creating) {
                      setCreateDialogOpen(false);
                    }
                  }}
                  disabled={creating}
                  className="min-h-[44px] sm:min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePlan}
                  disabled={creating || !formData.code || !formData.name}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] sm:min-h-0"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Plan Dialog */}
      {editDialogOpen && planToEdit && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0"
          onClick={(e) => {
            if (e.target === e.currentTarget && !editing) {
              setEditDialogOpen(false);
              setPlanToEdit(null);
              setEditFormData({});
            }
          }}
          role="dialog"
          aria-modal="true"
        >
          <Card
            className="w-full max-w-2xl mx-4 bg-white shadow-2xl border-0 animate-in zoom-in-95 fade-in-0 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Edit Plan: {planToEdit.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    Update billing plan details (Code cannot be changed)
                  </CardDescription>
                </div>
                {!editing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setPlanToEdit(null);
                      setEditFormData({});
                    }}
                    className="h-8 w-8 rounded-full hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6 space-y-6">
              {/* Plan Code (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="edit-plan-code">Plan Code</Label>
                <Input
                  id="edit-plan-code"
                  value={planToEdit.code}
                  disabled
                  className="min-h-[44px] sm:min-h-0 bg-gray-50"
                />
                <p className="text-xs text-gray-500">Plan code cannot be changed after creation</p>
              </div>

              {/* Required Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-plan-name">Plan Name</Label>
                  <Input
                    id="edit-plan-name"
                    value={editFormData.name || planToEdit.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g., Starter Plan"
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-plan-description">Description</Label>
                  <Input
                    id="edit-plan-description"
                    value={editFormData.description !== undefined ? editFormData.description : (planToEdit.description || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Brief description of the plan"
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-max-seats">Max Seats</Label>
                  <Input
                    id="edit-max-seats"
                    type="number"
                    min="1"
                    value={editFormData.max_seats !== undefined ? editFormData.max_seats : planToEdit.max_seats}
                    onChange={(e) => setEditFormData({ ...editFormData, max_seats: parseInt(e.target.value) || 1 })}
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-token-quota">Monthly Token Quota</Label>
                  <Input
                    id="edit-token-quota"
                    type="number"
                    min="0"
                    value={editFormData.monthly_token_quota !== undefined ? editFormData.monthly_token_quota : planToEdit.monthly_token_quota}
                    onChange={(e) => setEditFormData({ ...editFormData, monthly_token_quota: parseInt(e.target.value) || 0 })}
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Tokens per month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price-monthly">Monthly Price (cents)</Label>
                  <Input
                    id="edit-price-monthly"
                    type="number"
                    min="0"
                    value={editFormData.price_monthly_cents !== undefined ? editFormData.price_monthly_cents : (planToEdit.price_monthly_cents || 0)}
                    onChange={(e) => setEditFormData({ ...editFormData, price_monthly_cents: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Price in cents (e.g., 9900 = $99.00)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price-annual">Annual Price (cents)</Label>
                  <Input
                    id="edit-price-annual"
                    type="number"
                    min="0"
                    value={editFormData.price_annual_cents !== undefined ? editFormData.price_annual_cents : (planToEdit.price_annual_cents || 0)}
                    onChange={(e) => setEditFormData({ ...editFormData, price_annual_cents: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Price in cents (e.g., 99000 = $990.00)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-display-order">Display Order</Label>
                  <Input
                    id="edit-display-order"
                    type="number"
                    min="0"
                    value={editFormData.display_order !== undefined ? editFormData.display_order : planToEdit.display_order}
                    onChange={(e) => setEditFormData({ ...editFormData, display_order: parseInt(e.target.value) || 0 })}
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                  <p className="text-xs text-gray-500">Lower numbers appear first</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-is-popular">Popular Plan</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit-is-popular"
                      checked={editFormData.is_popular !== undefined ? editFormData.is_popular : planToEdit.is_popular}
                      onChange={(e) => setEditFormData({ ...editFormData, is_popular: e.target.checked })}
                      disabled={editing}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-is-popular" className="text-sm text-gray-700">
                      Mark as popular plan
                    </label>
                  </div>
                </div>
              </div>

              {/* Stripe Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stripe-product-id">Stripe Product ID</Label>
                  <Input
                    id="edit-stripe-product-id"
                    value={editFormData.stripe_product_id !== undefined ? editFormData.stripe_product_id : (planToEdit.stripe_product_id || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, stripe_product_id: e.target.value || undefined })}
                    placeholder="prod_..."
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stripe-price-monthly">Stripe Monthly Price ID</Label>
                  <Input
                    id="edit-stripe-price-monthly"
                    value={editFormData.stripe_price_id_monthly !== undefined ? editFormData.stripe_price_id_monthly : (planToEdit.stripe_price_id_monthly || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, stripe_price_id_monthly: e.target.value || undefined })}
                    placeholder="price_..."
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stripe-price-annual">Stripe Annual Price ID</Label>
                  <Input
                    id="edit-stripe-price-annual"
                    value={editFormData.stripe_price_id_annual !== undefined ? editFormData.stripe_price_id_annual : (planToEdit.stripe_price_id_annual || '')}
                    onChange={(e) => setEditFormData({ ...editFormData, stripe_price_id_annual: e.target.value || undefined })}
                    placeholder="price_..."
                    disabled={editing}
                    className="min-h-[44px] sm:min-h-0"
                  />
                </div>
              </div>

              {/* Features JSON Editor (Phase 1 - JSON only, toggles in Phase 3) */}
              <div className="space-y-2">
                <Label htmlFor="edit-plan-features">Features (JSON)</Label>
                <textarea
                  id="edit-plan-features"
                  value={JSON.stringify(editFormData.features !== undefined ? editFormData.features : (planToEdit.features || {}), null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditFormData({ ...editFormData, features: parsed });
                    } catch {
                      // Invalid JSON, keep as is
                    }
                  }}
                  placeholder='{"feature1": true, "feature2": false}'
                  rows={6}
                  disabled={editing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                />
                <p className="text-xs text-gray-500">JSON object for plan features (toggles coming in Phase 3)</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!editing) {
                      setEditDialogOpen(false);
                      setPlanToEdit(null);
                      setEditFormData({});
                    }
                  }}
                  disabled={editing}
                  className="min-h-[44px] sm:min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePlan}
                  disabled={editing}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] sm:min-h-0"
                >
                  {editing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Plan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

