'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { InteractiveDemo, type InteractiveDemoRef } from './InteractiveDemo';

type DemoContextType = {
  startDemo: () => void;
  isActive: boolean;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const demoRef = useRef<InteractiveDemoRef>(null);

  const startDemo = () => {
    setIsActive(true);
    demoRef.current?.start();
  };

  return (
    <DemoContext.Provider value={{ startDemo, isActive }}>
      {children}
      <InteractiveDemo
        ref={demoRef}
        onComplete={() => setIsActive(false)}
        onSkip={() => setIsActive(false)}
      />
    </DemoContext.Provider>
  );
}

