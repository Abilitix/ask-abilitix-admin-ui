import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Sign In - Ask AbilitiX Admin" 
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen h-[100dvh] overflow-hidden">
      {children}
    </div>
  );
}
