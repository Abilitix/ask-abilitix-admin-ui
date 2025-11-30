'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ContextSettings } from './types';

interface RoutingSectionProps {
  ctx: ContextSettings;
  setCtx: (ctx: ContextSettings) => void;
}

export function RoutingSection({ ctx, setCtx }: RoutingSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Routing</CardTitle>
        <CardDescription>
          Control how context is applied to different types of questions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <Label className="text-sm font-semibold text-gray-900 mb-1 block">
              Boost Profile for "About Us" Questions
            </Label>
            <p className="text-sm text-gray-600">
              When users ask who you are or what you do, Abilitix will prioritize your profile.
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={ctx.routing.boost_profile_in_about_intent}
              onChange={(e) =>
                setCtx({
                  ...ctx,
                  routing: {
                    ...ctx.routing,
                    boost_profile_in_about_intent: e.target.checked,
                  },
                })
              }
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {ctx.routing.boost_profile_in_about_intent ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

