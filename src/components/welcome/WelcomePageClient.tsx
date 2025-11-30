'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { Upload, MessageSquare, CheckCircle2, Sparkles, FileText, Users, ArrowRight, X } from 'lucide-react';
import type { User } from '@/lib/auth';

type WelcomePageClientProps = {
  user: User;
};

export default function WelcomePageClient({ user }: WelcomePageClientProps) {
  const { summary, isLoading } = useDashboardSummary();
  const router = useRouter();

  // Redirect to dashboard if user has already started (has docs or FAQs)
  useEffect(() => {
    if (!isLoading && summary) {
      const hasStarted = summary.metrics.docs_active > 0 || summary.metrics.faq_count > 0;
      if (hasStarted) {
        router.replace('/');
      }
    }
  }, [summary, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user has started, don't render (will redirect)
  if (summary && (summary.metrics.docs_active > 0 || summary.metrics.faq_count > 0)) {
    return null;
  }

  const tenantName = summary?.tenant.name || 'your workspace';
  const userName = summary?.user.name || 'there';

  // Step completion status
  const step1Complete = (summary?.metrics.docs_active || 0) > 0;
  const step2Complete = (summary?.metrics.faq_count || 0) > 0;
  const step3Complete = (summary?.metrics.pending_reviews || 0) === 0 && step2Complete;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Skip to Dashboard */}
      <div className="absolute top-4 right-4 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          <X className="h-4 w-4" />
          <span>Skip to Dashboard</span>
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={88}
              height={88}
              priority
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Welcome to Abilitix, {userName}! 👋
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8">
            Your AI-powered knowledge management platform. Get started in 3 simple steps.
          </p>
        </div>

        {/* Quick Start Guide */}
        <div className="relative bg-white rounded-[20px] shadow-xl p-6 sm:p-8 md:p-10 mb-8 sm:mb-12 overflow-hidden">
          {/* Glass reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-8 sm:mb-10">
              Follow these steps to set up {tenantName} and start getting intelligent answers
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Step 1 */}
              <StepCard
                step={1}
                title="Upload & Connect Sources"
                description="Upload key PDFs, DOCX, or Markdown files to build your knowledge base"
                icon={Upload}
                href="/admin/docs"
                completed={step1Complete}
                buttonText="Go to Docs"
              />

              {/* Step 2 */}
              <StepCard
                step={2}
                title="Generate & Review FAQs"
                description="Turn your documents into draft FAQs with one click using our FAQ Machine"
                icon={MessageSquare}
                href="/admin/faqs"
                completed={step2Complete}
                buttonText="Go to FAQs"
              />

              {/* Step 3 */}
              <StepCard
                step={3}
                title="Approve & Go Live"
                description="Review and approve answers in Inbox so users see cited, forwardable replies"
                icon={CheckCircle2}
                href="/admin/inbox"
                completed={step3Complete}
                buttonText="Go to Inbox"
              />
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            Why Choose Abilitix?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered Responses"
              description="Get instant, intelligent answers with citations. Every response is backed by your documents."
              color="text-indigo-600"
              bgColor="bg-indigo-50"
            />
            <FeatureCard
              icon={FileText}
              title="Knowledge Base Management"
              description="Upload, organize, and manage your documents. Generate FAQs automatically from your content."
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <FeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Review and approve answers together. Everything passes through your inbox for quality control."
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
          </div>
        </div>

        {/* Resources Section */}
        <div className="relative bg-white rounded-[20px] shadow-xl p-6 sm:p-8 md:p-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Need Help?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Check out our resources to get the most out of Abilitix
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link
                href="/admin/docs"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Documentation</span>
              </Link>
              <Link
                href="/admin/ai"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>Try AI Assistant</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type StepCardProps = {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  completed: boolean;
  buttonText: string;
};

function StepCard({ step, title, description, icon: Icon, href, completed, buttonText }: StepCardProps) {
  return (
    <div className={`relative rounded-xl border-2 p-6 sm:p-7 transition-all duration-200 ${
      completed
        ? 'border-green-500 bg-green-50/50 shadow-md'
        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg'
    }`}>
      {/* Step number badge */}
      <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
        completed
          ? 'bg-green-500 text-white'
          : 'bg-indigo-600 text-white'
      }`}>
        {completed ? <CheckCircle2 className="h-5 w-5" /> : step}
      </div>

      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
        completed ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
      }`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">{description}</p>

      {/* Button */}
      <Link
        href={href}
        className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
          completed
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-[0_4px_10px_rgba(34,197,94,0.25)]'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_4px_10px_rgba(62,44,195,0.25)]'
        } hover:shadow-[0_4px_12px_rgba(62,44,195,0.3)] active:scale-[0.98] min-h-[48px]`}
      >
        {completed ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed</span>
          </>
        ) : (
          <>
            <span>{buttonText}</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Link>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
};

function FeatureCard({ icon: Icon, title, description, color, bgColor }: FeatureCardProps) {
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${bgColor} ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
      {/* Subtle hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 hover:opacity-100 transition-opacity duration-200" />
    </div>
  );
}

