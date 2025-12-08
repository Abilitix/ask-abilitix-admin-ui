'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { DemoWalkthrough, type DemoStep } from './DemoWalkthrough';
import { useRouter } from 'next/navigation';

type InteractiveDemoProps = {
  onComplete?: () => void;
  onSkip?: () => void;
};

export type InteractiveDemoRef = {
  start: () => void;
};

export const InteractiveDemo = forwardRef<InteractiveDemoRef, InteractiveDemoProps>(
  ({ onComplete, onSkip }, ref) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);
    const router = useRouter();

  // Track routes for each step to enable proper navigation
  const stepRoutes: Record<number, string> = {
    0: '/', // welcome
    1: '/admin/docs', // upload
    2: '/admin/docs/generate-faqs', // generate
    3: '/admin/inbox', // inbox
    4: '/admin/inbox', // citations (same page)
    5: '/admin/settings', // widget
    6: '/', // complete (back to welcome)
  };

  // Define demo steps - Best-in-class SaaS demo flow
  const steps: DemoStep[] = [
    {
      id: 'welcome',
      target: 'center',
      title: 'Welcome to Ask Abilitix! 🎉',
      content: 'Let\'s take a quick 2-minute tour to see how Ask Abilitix transforms your knowledge base into trusted, instant answers. We\'ll show you the core workflow in just 3 steps.',
      position: 'center',
      showSkip: true,
    },
    {
      id: 'step1-upload',
      target: '[data-demo="upload-docs"]',
      title: 'Step 1: Upload Your Documents',
      content: 'Start by uploading your knowledge base documents. Ask Abilitix supports PDFs, Word docs, and text files. Your documents are processed and indexed automatically with resumable uploads for reliability.',
      position: 'bottom',
      action: {
        label: 'Go to Documents',
        onClick: () => {
          setIsNavigating(true);
          router.push('/admin/docs');
          setTimeout(() => setIsNavigating(false), 2000);
        },
      },
    },
    {
      id: 'step2-generate',
      target: '[data-demo="generate-faqs"]',
      title: 'Step 2: Generate FAQs Instantly',
      content: 'Click "Generate FAQs" to automatically extract the most important questions and answers from your documents. This takes just seconds and creates ready-to-review FAQs with suggested citations.',
      position: 'bottom',
      action: {
        label: 'Try Generate FAQs',
        onClick: () => {
          setIsNavigating(true);
          router.push('/admin/docs/generate-faqs');
          setTimeout(() => setIsNavigating(false), 2000);
        },
      },
    },
    {
      id: 'step3-inbox',
      target: '[data-demo="inbox"]',
      title: 'Step 3: Review & Approve',
      content: 'Review AI-generated FAQs in your Inbox. Each answer includes citations to source documents. Approve the good ones, reject the rest. You stay in control with human governance.',
      position: 'bottom',
      action: {
        label: 'Go to Inbox',
        onClick: () => {
          setIsNavigating(true);
          router.push('/admin/inbox');
          setTimeout(() => setIsNavigating(false), 2000);
        },
      },
    },
    {
      id: 'step4-citations',
      target: '[data-demo="citations"]',
      title: 'Trust Through Citations',
      content: 'Every answer includes source citations. When you review items in the inbox, you can attach citations to show the exact document and page where information comes from. This builds trust with your customers and ensures accuracy. (Note: Your inbox is currently empty, but once you generate FAQs, you\'ll see them here with citation options.)',
      position: 'right',
      action: {
        label: 'Go to Widget Settings',
        onClick: () => {
          setIsNavigating(true);
          router.push('/admin/settings');
          setTimeout(() => setIsNavigating(false), 2000);
        },
      },
    },
    {
      id: 'step5-widget',
      target: '[data-demo="widget"]',
      title: 'Live Widget - Instant Answers',
      content: 'Approved FAQs are instantly available in your website widget. No deployment needed. Your customers get instant, verified answers with visible citations—pure speed and trust.',
      position: 'bottom',
    },
    {
      id: 'complete',
      target: 'center',
      title: 'You\'re All Set! 🚀',
      content: 'You\'ve seen the core workflow: Upload → Generate → Review → Live. Ask Abilitix is ready to transform your knowledge base into trusted, instant answers. Start by uploading your first document!',
      position: 'center',
    },
  ];

  const handleComplete = () => {
    setIsActive(false);
    // Navigate back to welcome page
    router.push('/');
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    if (onSkip) {
      onSkip();
    }
  };

  const startDemo = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  // Expose start function via ref
  useImperativeHandle(ref, () => ({
    start: startDemo,
  }));

  // Handle step change with navigation
  const handleStepChange = (newIndex: number) => {
    const targetRoute = stepRoutes[newIndex];
    const currentRoute = stepRoutes[currentStepIndex];
    
    // If we're currently navigating from an action, just update the step index
    // The action already handled navigation
    if (isNavigating) {
      setCurrentStepIndex(newIndex);
      return;
    }
    
    // Navigate if route changed
    if (targetRoute && targetRoute !== currentRoute) {
      setIsNavigating(true);
      router.push(targetRoute);
      // Wait for navigation before updating step
      setTimeout(() => {
        setCurrentStepIndex(newIndex);
        setIsNavigating(false);
      }, 1500);
    } else {
      // Same page, just update step
      setCurrentStepIndex(newIndex);
    }
  };

  return (
    <DemoWalkthrough
      steps={steps}
      isActive={isActive}
      onComplete={handleComplete}
      onSkip={handleSkip}
      currentStepIndex={currentStepIndex}
      onStepChange={handleStepChange}
    />
  );
});

InteractiveDemo.displayName = 'InteractiveDemo';

