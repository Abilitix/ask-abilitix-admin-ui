'use client';

interface DashboardGreetingProps {
  name?: string | null;
  tenantName?: string | null;
  industry?: string | null;
}

export function DashboardGreeting({
  name,
  tenantName,
  industry,
}: DashboardGreetingProps) {
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay =
    hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900">
        Good {timeOfDay}
        {name ? `, ${name}` : ''}! 👋
      </h1>
      <p className="text-sm sm:text-base text-slate-600 mt-1 sm:mt-2">
        {tenantName
          ? `Helping ${tenantName} deliver cited answers${
              industry ? ` for ${industry}` : ''
            }.`
          : 'Helping you deliver cited answers with Abilitix.'}
      </p>
    </div>
  );
}

