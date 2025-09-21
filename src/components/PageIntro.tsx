"use client";

import * as React from "react";

type Props = {
  step?: string;             // e.g. "Step ①"
  title: string;             // e.g. "Upload your first documents"
  subtitle?: string;         // short supporting copy
  actions?: React.ReactNode; // right-aligned buttons/links
};

export default function PageIntro({ step, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {step && <div className="text-xs font-medium text-blue-700">{step}</div>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
