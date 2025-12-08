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
    const router = useRouter();

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
          router.push('/admin/docs');
          // Wait for navigation, then continue
          setTimeout(() => {
            setCurrentStepIndex(2);
          }, 800);
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
          router.push('/admin/docs/generate-faqs');
          setTimeout(() => {
            setCurrentStepIndex(3);
          }, 800);
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
          router.push('/admin/inbox');
          setTimeout(() => {
            setCurrentStepIndex(4);
          }, 800);
        },
      },
    },
    {
      id: 'step4-citations',
      target: '[data-demo="citations"]',
      title: 'Trust Through Citations',
      content: 'Every answer includes source citations. Click any citation to see the exact document and page where the information comes from. This builds trust with your customers and ensures accuracy.',
      position: 'right',
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

  return (
    <DemoWalkthrough
      steps={steps}
      isActive={isActive}
      onComplete={handleComplete}
      onSkip={handleSkip}
      currentStepIndex={currentStepIndex}
      onStepChange={setCurrentStepIndex}
    />
  );
});

InteractiveDemo.displayName = 'InteractiveDemo';

