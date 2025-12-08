'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DemoStep = {
  id: string;
  target: string; // CSS selector or 'center' for centered modal
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  showSkip?: boolean;
};

type DemoWalkthroughProps = {
  steps: DemoStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
};

export function DemoWalkthrough({
  steps,
  isActive,
  onComplete,
  onSkip,
  currentStepIndex,
  onStepChange,
}: DemoWalkthroughProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Find and position tooltip relative to target element
  // Retry logic for elements that may not be loaded yet (after navigation)
  useEffect(() => {
    if (!isActive || !currentStep) return;

    if (currentStep.target === 'center') {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    // Retry finding element (for navigation scenarios)
    let retryCount = 0;
    const maxRetries = 10; // Try for up to 2 seconds (10 * 200ms)
    const retryDelay = 200;

    const findElement = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Demo] Found element: ${currentStep.target}`, element);
        }
      } else {
        // Element not found yet, retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          if (process.env.NODE_ENV === 'development' && retryCount % 3 === 0) {
            console.log(`[Demo] Retrying to find element (attempt ${retryCount}/${maxRetries}): ${currentStep.target}`);
          }
          setTimeout(findElement, retryDelay);
        } else {
          // Element not found after retries, show centered
          console.warn(`[Demo] Element not found after ${maxRetries} retries: ${currentStep.target}`);
          console.log(`[Demo] Available data-demo elements:`, Array.from(document.querySelectorAll('[data-demo]')).map(el => el.getAttribute('data-demo')));
          setTargetElement(null);
          setTargetRect(null);
        }
      }
    };

    findElement();
  }, [isActive, currentStep, currentStepIndex]);

  // Update overlay position on scroll/resize
  useEffect(() => {
    if (!isActive || !targetElement) return;

    const updatePosition = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, targetElement]);

  if (!isActive || !currentStep) return null;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleAction = () => {
    if (currentStep.action) {
      currentStep.action.onClick();
    }
    handleNext();
  };

  // Calculate tooltip position with smart edge detection
  const getTooltipPosition = () => {
    if (currentStep.target === 'center' || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
      };
    }

    const position = currentStep.position || 'bottom';
    const spacing = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 200;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const padding = 16;

    // Smart positioning: adjust if tooltip would go off-screen
    let finalPosition = position;
    let finalTop = 0;
    let finalLeft = 0;
    let finalTransform = '';

    switch (position) {
      case 'top':
        finalTop = targetRect.top - tooltipHeight - spacing;
        finalLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        finalTransform = 'translateY(-100%)';
        // If off top, switch to bottom
        if (finalTop < padding) {
          finalPosition = 'bottom';
          finalTop = targetRect.bottom + spacing;
          finalTransform = '';
        }
        break;
      case 'bottom':
        finalTop = targetRect.bottom + spacing;
        finalLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        // If off bottom, switch to top
        if (finalTop + tooltipHeight > viewportHeight - padding) {
          finalPosition = 'top';
          finalTop = targetRect.top - tooltipHeight - spacing;
          finalTransform = 'translateY(-100%)';
        }
        break;
      case 'left':
        finalTop = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        finalLeft = targetRect.left - tooltipWidth - spacing;
        finalTransform = 'translateX(-100%)';
        // If off left, switch to right
        if (finalLeft < padding) {
          finalPosition = 'right';
          finalLeft = targetRect.right + spacing;
          finalTransform = '';
        }
        break;
      case 'right':
        finalTop = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        finalLeft = targetRect.right + spacing;
        // If off right, switch to left
        if (finalLeft + tooltipWidth > viewportWidth - padding) {
          finalPosition = 'left';
          finalLeft = targetRect.left - tooltipWidth - spacing;
          finalTransform = 'translateX(-100%)';
        }
        break;
    }

    // Ensure tooltip stays within viewport bounds
    finalLeft = Math.max(padding, Math.min(finalLeft, viewportWidth - tooltipWidth - padding));
    finalTop = Math.max(padding, Math.min(finalTop, viewportHeight - tooltipHeight - padding));

    return {
      top: `${finalTop}px`,
      left: `${finalLeft}px`,
      transform: finalTransform,
      maxWidth: 'calc(100vw - 32px)',
    };
  };

  // Calculate spotlight position
  const getSpotlightStyle = () => {
    if (currentStep.target === 'center' || !targetRect) {
      return {};
    }

    return {
      clipPath: `polygon(
        0% 0%,
        0% 100%,
        ${targetRect.left}px 100%,
        ${targetRect.left}px ${targetRect.top}px,
        ${targetRect.right}px ${targetRect.top}px,
        ${targetRect.right}px ${targetRect.bottom}px,
        ${targetRect.left}px ${targetRect.bottom}px,
        ${targetRect.left}px 100%,
        100% 100%,
        100% 0%
      )`,
    };
  };

  return (
    <>
      {/* Overlay with spotlight */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        style={getSpotlightStyle()}
        onClick={(e) => {
          // Only close if clicking overlay (not tooltip)
          if (e.target === overlayRef.current) {
            // Don't close on overlay click - require explicit skip/close
          }
        }}
      />

      {/* Highlight border around target element - Best-in-class animation */}
      {targetElement && targetRect && (
        <>
          {/* Outer glow */}
          <div
            className="fixed z-[101] pointer-events-none rounded-lg shadow-[0_0_0_4px_rgba(59,130,246,0.15),0_0_20px_rgba(59,130,246,0.2)]"
            style={{
              top: `${targetRect.top - 6}px`,
              left: `${targetRect.left - 6}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          {/* Inner border */}
          <div
            className="fixed z-[101] pointer-events-none border-2 border-blue-500 rounded-lg transition-all duration-300"
            style={{
              top: `${targetRect.top - 4}px`,
              left: `${targetRect.left - 4}px`,
              width: `${targetRect.width + 8}px`,
              height: `${targetRect.height + 8}px`,
              boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.3)',
            }}
          />
        </>
      )}

      {/* Tooltip - Best-in-class design */}
      <div
        ref={tooltipRef}
        className="fixed z-[102] w-[360px]"
        style={getTooltipPosition()}
      >
        <Card className="bg-white shadow-2xl border-0 animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-2 ring-1 ring-slate-200/50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold text-slate-900 leading-tight mb-1">
                    {currentStep.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Step {currentStepIndex + 1} of {steps.length}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSkip}
                className="h-8 w-8 rounded-full hover:bg-slate-100 -mt-1 -mr-1"
                aria-label="Skip demo"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {currentStep.content}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentStep.showSkip && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                    className="h-9 text-slate-600"
                  >
                    Skip
                  </Button>
                )}
                {currentStep.action ? (
                  <Button
                    onClick={handleAction}
                    className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {currentStep.action.label}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLastStep ? 'Complete' : 'Next'}
                    {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

