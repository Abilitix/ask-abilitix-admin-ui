'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { WelcomeSidebar } from './WelcomeSidebar';
import { useDemo } from '@/components/demo/DemoProvider';
import { Upload, MessageSquare, CheckCircle2, Sparkles, FileText, Users, ArrowRight, X, Bell, BookOpen, Video, Rocket, Brain, Shield, Zap, TrendingUp, Settings, Link2, Cloud, Play } from 'lucide-react';
import type { User } from '@/lib/auth';

type WelcomePageClientProps = {
  user: User;
};

export default function WelcomePageClient({ user }: WelcomePageClientProps) {
  const { summary, isLoading } = useDashboardSummary();
  const { startDemo } = useDemo();

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

  const tenantName = summary?.tenant.name || 'your workspace';
  const userName = summary?.user.name || 'there';
  const isNewUser = !summary || (summary.metrics.docs_active === 0 && summary.metrics.faq_count === 0);
  const pendingReviews = summary?.metrics.pending_reviews || 0;
  
  // Note: We don't manually prefetch protected routes to avoid 401 errors
  // Next.js Link components automatically prefetch on hover/visible, which is smarter
  // and respects authentication context. Manual prefetch can trigger SSR that requires
  // authentication, causing 401 errors in logs.
  const docsCount = summary?.metrics.docs_active || 0;
  const faqCount = summary?.metrics.faq_count || 0;

  // Step completion status
  const step1Complete = (summary?.metrics.docs_active || 0) > 0;
  const step2Complete = (summary?.metrics.faq_count || 0) > 0;
  const step3Complete = (summary?.metrics.pending_reviews || 0) === 0 && step2Complete;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Sidebar */}
      <WelcomeSidebar
        pendingReviews={pendingReviews}
        docsCount={docsCount}
        faqCount={faqCount}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Welcome</h2>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <span>Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={88}
              height={88}
              priority
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Welcome{isNewUser ? ' to Ask Abilitix' : ' back'}, {userName}! 👋
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {isNewUser 
              ? 'Your AI-powered knowledge management platform. Every answer is cited, every response is reviewed, and every FAQ is fast.'
              : `Welcome back to ${tenantName}. Here's what's happening and how to get the most out of Ask Abilitix.`
            }
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {isNewUser ? (
              <>
                <button
                  onClick={startDemo}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  Try Interactive Demo
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <button
                onClick={startDemo}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 min-h-[44px] bg-white hover:bg-gray-50 text-gray-700 text-sm sm:text-base font-medium rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Take a Tour
              </button>
            )}
          </div>
        </div>

        {/* Announcements Section - Always visible */}
        <div id="announcements" className="relative bg-white rounded-[20px] shadow-xl p-6 sm:p-8 mb-8 sm:mb-12 overflow-hidden scroll-mt-4">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                Announcements
              </h2>
              <Link href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              <AnnouncementCard
                title="New: Google Drive Integration Available"
                date="Today"
                description="Connect your Google Drive to automatically sync documents. No more manual uploads—your files stay in sync with Ask Abilitix. Select folders to sync and documents will be imported automatically."
                unread={true}
                href="/admin/sources/gdrive"
                actionText="Connect Google Drive"
              />
              <AnnouncementCard
                title={isNewUser ? "Welcome to your Ask Abilitix workspace!" : "Enhanced FAQ Machine"}
                date={isNewUser ? "Today" : "2 days ago"}
                description={isNewUser 
                  ? "Congratulations on setting up your workspace. Ask Abilitix delivers cited answers, inbox-gated trust, and lightning-fast FAQ responses. Start by uploading documents or connecting sources, then generate FAQs, and approve answers in your inbox."
                  : "We've improved the FAQ generation engine for faster, more accurate results. Try generating FAQs from your documents to see the improvements."
                }
                unread={isNewUser}
              />
              {/* Note: Admin announcements will be loaded from backend API in future */}
              <div className="text-xs text-gray-500 italic pt-2 border-t border-gray-100 mt-4">
                Admins can add announcements from Settings → Announcements (coming soon)
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Always visible */}
        <div className="relative bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[20px] shadow-xl p-6 sm:p-8 md:p-10 mb-8 sm:mb-12 overflow-hidden border border-indigo-100">
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 items-stretch">
              <QuickActionCard
                icon={Upload}
                title="Upload Docs"
                href="/admin/docs"
                count={docsCount > 0 ? docsCount : undefined}
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <QuickActionCard
                icon={Link2}
                title="Connect Sources"
                href="/admin/sources"
                color="text-blue-600"
                bgColor="bg-blue-50"
              />
              <QuickActionCard
                icon={MessageSquare}
                title="Generate FAQs"
                href="/admin/docs/generate-faqs"
                count={faqCount > 0 ? faqCount : undefined}
                color="text-indigo-600"
                bgColor="bg-indigo-50"
              />
              <QuickActionCard
                icon={CheckCircle2}
                title="Review Inbox"
                href="/admin/inbox"
                count={pendingReviews > 0 ? pendingReviews : undefined}
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
            <QuickActionCard
              icon={Sparkles}
              title="AI Assistant"
              href="/admin/ai"
              color="text-green-600"
              bgColor="bg-green-50"
            />
              <QuickActionCard
                icon={Settings}
                title="Configure Context"
                href="/admin/settings/context"
                color="text-purple-600"
                bgColor="bg-purple-50"
              />
            </div>
          </div>
        </div>

        {/* Getting Started Hub - Prominent CTA */}
        {isNewUser && (
          <div id="getting-started-hub" className="relative bg-gradient-to-br from-indigo-600 to-blue-600 rounded-[20px] shadow-xl p-8 sm:p-10 md:p-12 mb-8 sm:mb-12 overflow-hidden scroll-mt-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-blue-600/90" />
            <div className="relative z-10 text-center text-white">
              <Rocket className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-white" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Looking to dive deeper?
              </h2>
              <p className="text-base sm:text-lg text-indigo-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Explore our Getting Started Hub for tutorials, best practices, and tips to maximize your Ask Abilitix experience.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white/90 text-indigo-600 rounded-xl font-semibold text-base sm:text-lg shadow-[0_4px_10px_rgba(0,0,0,0.2)] cursor-not-allowed opacity-90 min-h-[48px]">
                <span>Getting Started Hub</span>
                <span className="text-xs font-normal text-indigo-500 ml-1">(Coming Soon)</span>
              </div>
              <p className="text-sm text-indigo-200 mt-4">
                For now, start by uploading documents above to get the most out of Ask Abilitix
              </p>
            </div>
          </div>
        )}

        {/* Quick Start Guide */}
        <div id="getting-started" className="relative bg-white rounded-[20px] shadow-xl p-6 sm:p-8 md:p-10 mb-8 sm:mb-12 overflow-hidden scroll-mt-4">
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
                description="Upload key PDFs, DOCX, or Markdown files manually, or connect Google Drive to automatically sync documents. Your choice—both build your knowledge base."
                icon={Upload}
                href="/admin/docs"
                completed={step1Complete}
                buttonText="Go to Docs"
                secondaryHref="/admin/sources"
                secondaryButtonText="Connect Sources"
              />

              {/* Step 2 */}
              <StepCard
                step={2}
                title="Generate & Review FAQs"
                description="Turn your documents into draft FAQs with one click using our FAQ Machine"
                icon={MessageSquare}
                href="/admin/docs/generate-faqs"
                completed={step2Complete}
                buttonText="Generate FAQs"
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

        {/* Competitive Advantages - Ask Abilitix Differentiators */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">
            What Makes Ask Abilitix Different
          </h2>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8 max-w-2xl mx-auto">
            We deliver receipts, not vibes. Every answer is cited, every response is reviewed, and every FAQ is fast.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <FeatureCard
              icon={Shield}
              title="Cited Answers Only"
              description="Every response includes citations. No hallucinations, no guessing—just receipts from your documents."
              color="text-indigo-600"
              bgColor="bg-indigo-50"
              highlight="100% cited"
            />
            <FeatureCard
              icon={CheckCircle2}
              title="Inbox-Gated Trust"
              description="Everything new passes through review. Approve, edit, or reject—you control what goes live."
              color="text-green-600"
              bgColor="bg-green-50"
              highlight="Governed"
            />
            <FeatureCard
              icon={Zap}
              title="FAQ Machine"
              description="Lightning-fast responses from Redis. Turn documents into FAQs in one click, serve answers instantly."
              color="text-blue-600"
              bgColor="bg-blue-50"
              highlight="Instant"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Context-Aware"
              description="Configure your company profile, glossary terms, and answer policies so Ask Abilitix responds in your brand voice. Every answer feels like your team wrote it."
              color="text-purple-600"
              bgColor="bg-purple-50"
              highlight="Personalized"
              href="/admin/settings/context"
            />
          </div>
        </div>

        {/* Helpful Resources */}
        <div id="resources" className="mb-8 sm:mb-12 scroll-mt-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            Helpful Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div id="help-center" className="scroll-mt-4">
              <ResourceCard
                title="Ask Abilitix Help Center"
                description="Browse our comprehensive documentation, guides, and FAQs to learn how to use Ask Abilitix effectively."
                icon={BookOpen}
                href="#help-center"
                color="text-indigo-600"
                bgColor="bg-indigo-50"
                comingSoon={true}
              />
            </div>
            <div id="tutorials" className="scroll-mt-4">
              <ResourceCard
                title="Video Tutorials & Demos"
                description="Watch step-by-step tutorials and product walkthroughs. See how other teams use Ask Abilitix to deliver cited answers."
                icon={Video}
                href="#tutorials"
                color="text-blue-600"
                bgColor="bg-blue-50"
                comingSoon={true}
              />
            </div>
          </div>
        </div>
        </div>
      </main>
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
  secondaryHref?: string;
  secondaryButtonText?: string;
};

function StepCard({ step, title, description, icon: Icon, href, completed, buttonText, secondaryHref, secondaryButtonText }: StepCardProps) {
  return (
    <div className={`relative rounded-xl border-2 p-6 sm:p-7 transition-all duration-200 flex flex-col ${
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

      {/* Content - flex-grow to push button down */}
      <div className="flex-grow">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">{description}</p>
      </div>

      {/* Buttons - always at bottom */}
      <div className="flex flex-col gap-2 mt-auto">
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
        {secondaryHref && secondaryButtonText && !completed && (
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-medium text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all duration-200 active:scale-[0.98] min-h-[44px]"
          >
            <Link2 className="h-4 w-4" />
            <span>{secondaryButtonText}</span>
          </Link>
        )}
      </div>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  highlight?: string;
  href?: string;
};

function FeatureCard({ icon: Icon, title, description, color, bgColor, highlight, href }: FeatureCardProps) {
  const cardContent = (
    <div className="relative bg-white rounded-xl border border-gray-200 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${bgColor} ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        {highlight && (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bgColor} ${color}`}>
            {highlight}
          </span>
        )}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
      {href && (
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-purple-600 group-hover:text-purple-700">
          <span>Configure now</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      )}
      {/* Subtle hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

type AnnouncementCardProps = {
  title: string;
  date: string;
  description: string;
  unread?: boolean;
  href?: string;
  actionText?: string;
};

function AnnouncementCard({ title, date, description, unread = false, href, actionText }: AnnouncementCardProps) {
  const cardContent = (
    <div className={`relative rounded-xl border-2 p-5 sm:p-6 transition-all duration-200 ${
      unread 
        ? 'border-indigo-200 bg-indigo-50/50 shadow-sm' 
        : 'border-gray-200 bg-white hover:border-gray-300'
    } ${href ? 'cursor-pointer hover:shadow-md' : ''}`}>
      {unread && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            New
          </span>
        </div>
      )}
      <div className={href ? 'pr-20' : ''}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-2">{date}</p>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3">{description}</p>
        {href && actionText && (
          <div className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            <span>{actionText}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

type QuickActionCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  count?: number;
  color: string;
  bgColor: string;
};

function QuickActionCard({ icon: Icon, title, href, count, color, bgColor }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="relative bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5 group flex flex-col h-full"
    >
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${bgColor} ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex-grow">{title}</h3>
      {count !== undefined && count > 0 && (
        <div className="mt-auto pt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </Link>
  );
}

type ResourceCardProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
  comingSoon?: boolean;
};

function ResourceCard({ title, description, icon: Icon, href, color, bgColor, comingSoon = false }: ResourceCardProps) {
  const CardContent = (
    <div className="relative bg-white rounded-xl border border-gray-200 p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5 group">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${bgColor} ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">{description}</p>
      {comingSoon ? (
        <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-400">
          <span>Coming soon</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
          <span>Learn more</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  );

  if (comingSoon) {
    return <div className="opacity-75 cursor-not-allowed">{CardContent}</div>;
  }

  return <Link href={href}>{CardContent}</Link>;
}

