'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Upload, 
  MessageSquare, 
  CheckCircle2, 
  Settings, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Target,
  Star,
  Calendar,
  BookOpen,
  Zap,
  Users,
  TrendingUp,
  Shield,
  Brain,
  Rocket
} from 'lucide-react';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}

function QuickActionCard({ 
  href, 
  icon, 
  title, 
  description, 
  badge,
  className = '' 
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={`
        group relative flex flex-col p-6 rounded-2xl bg-white border border-gray-200
        hover:border-blue-300 hover:shadow-lg transition-all duration-200
        hover:-translate-y-0.5 active:translate-y-0
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
        {badge && (
          <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed flex-grow">
        {description}
      </p>
      <div className="mt-4 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Get started
        <ArrowRight className="ml-1 w-4 h-4" />
      </div>
    </Link>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  gradient: string;
  borderColor: string;
  iconBg: string;
}

function InfoCard({ icon, title, children, gradient, borderColor, iconBg }: InfoCardProps) {
  return (
    <div className={`rounded-2xl ${gradient} p-6 sm:p-8 shadow-lg border ${borderColor}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function PilotPage() {
  const { summary, isLoading } = useDashboardSummary();
  
  const docsCount = summary?.metrics.docs_active || 0;
  const faqCount = summary?.metrics.faq_count || 0;
  const pendingReviews = summary?.metrics.pending_reviews || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <Target className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Pilot Objectives
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Your comprehensive guide to getting the most out of Abilitix. Follow this checklist to ensure a successful pilot.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              href="/admin/docs"
              icon={<Upload className="w-6 h-6" />}
              title="Upload Documents"
              description="Upload 10–20 key documents to validate ingestion and processing. PDF, DOCX, and Markdown supported."
              badge={docsCount > 0 ? `${docsCount} uploaded` : undefined}
            />
            <QuickActionCard
              href="/admin/docs/generate-faqs"
              icon={<Sparkles className="w-6 h-6" />}
              title="Generate FAQs"
              description="Automatically generate FAQs from your documents. Select a document and let AI create question-answer pairs."
              badge="New"
            />
            <QuickActionCard
              href="/admin/ai"
              icon={<MessageSquare className="w-6 h-6" />}
              title="AI Assistant"
              description="Ask 25+ real questions to test the system. Review answers and citations to ensure quality."
            />
            <QuickActionCard
              href="/admin/inbox"
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Review Inbox"
              description="Approve, edit, or reject answers. Your feedback improves quality for your entire team."
              badge={pendingReviews > 0 ? `${pendingReviews} pending` : undefined}
            />
            <QuickActionCard
              href="/admin/faqs"
              icon={<BookOpen className="w-6 h-6" />}
              title="Manage FAQs"
              description="View, archive, and manage your FAQ library. Organize knowledge for your team."
              badge={faqCount > 0 ? `${faqCount} FAQs` : undefined}
            />
            <QuickActionCard
              href="/admin/settings"
              icon={<Settings className="w-6 h-6" />}
              title="Settings"
              description="Tune DOC_MIN_SCORE and RAG_TOPK after testing. Configure team members and workspace settings."
            />
          </div>
        </section>

        {/* Goals & Success Criteria Grid */}
        <section className="grid gap-6 md:grid-cols-2 mb-12">
          <InfoCard
            icon={<Target className="w-5 h-5" />}
            title="Goals"
            gradient="bg-gradient-to-br from-green-50 to-emerald-50"
            borderColor="border-green-100"
            iconBg="bg-green-500"
          >
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Upload 10–20 key documents to validate ingestion and processing</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Generate FAQs from your documents to build a knowledge base</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Ask 25+ real questions; review answers and citations for quality</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Invite 2–3 teammates to try the workflow and gather feedback</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Capture issues and ideas; send weekly feedback to improve the product</span>
              </li>
            </ul>
          </InfoCard>

          <InfoCard
            icon={<Star className="w-5 h-5" />}
            title="Success Criteria"
            gradient="bg-gradient-to-br from-purple-50 to-violet-50"
            borderColor="border-purple-100"
            iconBg="bg-purple-500"
          >
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>≥80% of answers marked as useful or mostly useful</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>First token appears in &lt; ~2s; full answer completes in &lt; ~10s</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>No sign-in loops or authentication errors after Day 1</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>All files process successfully without stuck jobs</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span>FAQ generation completes successfully and FAQs are reviewable</span>
              </li>
            </ul>
          </InfoCard>
        </section>

        {/* Scope & Timeline Grid */}
        <section className="grid gap-6 md:grid-cols-2 mb-12">
          <InfoCard
            icon={<FileText className="w-5 h-5" />}
            title="Scope"
            gradient="bg-gradient-to-br from-orange-50 to-amber-50"
            borderColor="border-orange-100"
            iconBg="bg-orange-500"
          >
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-600" />
                  In Scope
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="list-disc">PDF/TXT/DOCX document uploads</li>
                  <li className="list-disc">FAQ generation from documents</li>
                  <li className="list-disc">Inbox review and approval workflow</li>
                  <li className="list-disc">FAQ lifecycle management</li>
                  <li className="list-disc">AI Assistant chat interface</li>
                  <li className="list-disc">Settings and configuration</li>
                  <li className="list-disc">Team member invitations</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-600" />
                  Out of Scope
                </h3>
                <ul className="space-y-2 ml-6">
                  <li className="list-disc">Billing and subscription management</li>
                  <li className="list-disc">Advanced analytics dashboard</li>
                  <li className="list-disc">SSO integration</li>
                  <li className="list-disc">Custom theming</li>
                  <li className="list-disc">Model fine-tuning</li>
                </ul>
              </div>
            </div>
          </InfoCard>

          <InfoCard
            icon={<Calendar className="w-5 h-5" />}
            title="Timeline (2 weeks)"
            gradient="bg-gradient-to-br from-cyan-50 to-blue-50"
            borderColor="border-cyan-100"
            iconBg="bg-cyan-500"
          >
            <ol className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Week 1: Setup & Quickstart</h3>
                  <p className="text-sm">Upload documents, generate initial FAQs, invite team members, and run first test questions.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Week 2: Daily Usage & Review</h3>
                  <p className="text-sm">Daily usage, log questions and edge cases, review FAQs, and prepare feedback for review meeting.</p>
                </div>
              </li>
            </ol>
          </InfoCard>
        </section>

        {/* Key Features Highlight */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Key Features to Explore</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Management</h3>
              <p className="text-sm text-gray-600">
                Upload, organize, and manage your documents. Track processing status and view document statistics.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ Generation</h3>
              <p className="text-sm text-gray-600">
                Automatically generate FAQs from your documents. AI creates question-answer pairs ready for review.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Workflow</h3>
              <p className="text-sm text-gray-600">
                Review, approve, or reject answers. Attach citations and convert approved answers to FAQs.
              </p>
            </div>
          </div>
        </section>

        {/* Tips & Best Practices */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tips & Best Practices</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Document Upload</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Upload at least 3–5 representative documents before testing chat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Wait for documents to finish processing before generating FAQs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Use clear, well-structured documents for best results</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">FAQ Generation</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Start with default settings, then adjust based on results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Review generated FAQs in the inbox before approving</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Edit questions and answers to match your team's style</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">AI Assistant</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Ask 10–25 real questions to test the system thoroughly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Watch for citations; adjust TopK if answers feel incomplete</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Review answers in the inbox to improve quality over time</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Tune DOC_MIN_SCORE and RAG_TOPK after a few chat runs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Lower score = more lenient matching (more results)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Invite team members early to gather diverse feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
