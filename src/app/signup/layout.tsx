import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Sign Up - AbilitiX Admin" 
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
