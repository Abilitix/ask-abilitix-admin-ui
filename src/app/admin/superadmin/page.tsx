'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminPage() {
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
        <h2 className="text-xl font-semibold mb-4">Tenant Posture & Freshness</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Example Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Telemetry:</span>
                  <span className="font-medium">5 mins ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <Clock className="h-3 w-3 mr-1" />
                    Fresh
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Posture cards will populate from live data in the next commit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
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
            onClick={() => toast.info('Rollup action coming in next commit')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Run Daily Rollup
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

