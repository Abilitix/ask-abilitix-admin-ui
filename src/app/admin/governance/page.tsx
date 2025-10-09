'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, BarChart3, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GovernancePage() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

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
          <div className="mt-4">
            <Button onClick={() => toast.info('Filter functionality coming in next commit')}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'No-store %', icon: ShieldCheck, value: '–' },
          { title: 'p95 Latency', icon: BarChart3, value: '–' },
          { title: 'Violations', icon: AlertTriangle, value: '–' },
          { title: 'Tokens Today', icon: BarChart3, value: '–' },
        ].map((kpi, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <kpi.icon className="h-4 w-4" />
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tables Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Top Tenants by Tokens (Today)</CardTitle>
          <CardDescription>
            Data loading will be implemented in the next commit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Table implementation coming soon</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Violations</CardTitle>
          <CardDescription>
            Policy violations from the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Table implementation coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Rollup Action Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Rollup</CardTitle>
          <CardDescription>
            Manually trigger daily metrics aggregation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => toast.info('Rollup action coming in next commit')}
          >
            Run Daily Rollup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

