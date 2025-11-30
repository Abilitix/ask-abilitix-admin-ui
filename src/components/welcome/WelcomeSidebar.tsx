'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Bell, 
  Rocket, 
  BookOpen, 
  Video, 
  Settings, 
  Upload, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';

type WelcomeSidebarProps = {
  pendingReviews?: number;
  docsCount?: number;
  faqCount?: number;
};

export function WelcomeSidebar({ pendingReviews = 0, docsCount = 0, faqCount = 0 }: WelcomeSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMobileOpen(false);
      }
    }
  };

  const mainNav = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/welcome', label: 'Welcome', icon: Rocket },
    { href: '#announcements', label: 'Announcements', icon: Bell },
    { href: '#getting-started', label: 'Getting Started', icon: Rocket },
    { href: '#resources', label: 'Resources', icon: BookOpen },
  ];

  const quickActions = [
    { href: '/admin/docs', label: 'Upload Docs', icon: Upload, count: docsCount > 0 ? docsCount : undefined },
    { href: '/admin/docs/generate-faqs', label: 'Generate FAQs', icon: MessageSquare, count: faqCount > 0 ? faqCount : undefined },
    { href: '/admin/inbox', label: 'Review Inbox', icon: CheckCircle2, count: pendingReviews > 0 ? pendingReviews : undefined },
    { href: '/admin/ai', label: 'AI Assistant', icon: Sparkles },
  ];

  const support = [
    { href: '#help-center', label: 'Help Center', icon: HelpCircle, comingSoon: true },
    { href: '#tutorials', label: 'Video Tutorials', icon: Video, comingSoon: true },
  ];

  const NavItem = ({ href, label, icon: Icon, count, comingSoon, onClick }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    comingSoon?: boolean;
    onClick?: () => void;
  }) => {
    const active = isActive(href);
    const isAnchor = href.startsWith('#');
    
    const handleClick = (e: React.MouseEvent) => {
      if (comingSoon) {
        e.preventDefault();
        return;
      }
      if (isAnchor) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setMobileOpen(false);
        }
        return;
      }
      onClick?.();
    };
    
    const content = (
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        } ${comingSoon ? 'opacity-60 cursor-not-allowed' : isAnchor ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-gray-500'}`} />
        <span className="flex-1">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 min-w-[20px] h-5 text-xs font-semibold text-white bg-indigo-600 rounded-full">
            {count}
          </span>
        )}
        {comingSoon && (
          <span className="text-xs text-gray-400">Soon</span>
        )}
      </div>
    );

    if (comingSoon || isAnchor) {
      return <div>{content}</div>;
    }

    return (
      <Link href={href} className="block" onClick={onClick}>
        {content}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
        <Image
          src="/abilitix-logo.png"
          alt="Abilitix"
          width={32}
          height={32}
          className="rounded-lg"
          priority
        />
        <span className="font-semibold text-gray-900">Abilitix</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Navigation
          </p>
          {mainNav.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Quick Actions
          </p>
          {quickActions.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              count={item.count}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>

        {/* Support */}
        <div>
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Support
          </p>
          {support.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              comingSoon={item.comingSoon}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
      </nav>

      {/* Settings Link */}
      <div className="border-t border-gray-200 px-3 py-3">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          <Settings className="h-5 w-5 text-gray-500" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop (always visible) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-200 z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile (drawer) */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-semibold text-gray-900">Abilitix</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}

