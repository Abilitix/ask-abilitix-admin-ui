'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function ContextNavigationCard() {
  return (
    <Card className="mb-8 hover:shadow-md transition-shadow border-indigo-100">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-indigo-100 rounded-lg flex-shrink-0">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              Context Management
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              Control how Ask Abilitix talks about your business and interprets your terminology. 
              Configure your profile, glossary, and answer policies.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Link href="/admin/settings/context">
          <Button 
            variant="default" 
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white min-h-[44px]"
          >
            Configure Context
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

