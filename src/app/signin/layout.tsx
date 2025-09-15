import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Sign In - AbilitiX Admin" 
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
