'use client';

interface DashboardGreetingProps {
  name?: string | null;
  tenantName?: string | null;
  industry?: string | null; // Kept for backward compatibility but not used
}

export function DashboardGreeting({
  name,
  tenantName,
}: DashboardGreetingProps) {
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay =
    hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
        Good {timeOfDay}
        {name ? `, ${name}` : ''}! 👋
      </h1>
      {tenantName && (
        <p className="text-base sm:text-lg text-slate-600 mt-2 sm:mt-3">
          Welcome to {tenantName}
        </p>
      )}
    </div>
  );
}

