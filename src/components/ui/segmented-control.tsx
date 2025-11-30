'use client';
import { cn } from '@/lib/utils';

interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  disabled = false,
  className,
}: SegmentedControlProps) {
  const activeIndex = options.findIndex(opt => opt.value === value);
  const activeWidth = 100 / options.length;

  return (
    <div
      className={cn(
        'relative flex bg-gray-100 rounded-lg p-1',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      role="tablist"
    >
      {/* Sliding indicator */}
      <div
        className="absolute inset-y-1 bg-white rounded-md shadow-sm transition-all duration-200 ease-out"
        style={{
          left: `${activeIndex * activeWidth}%`,
          width: `${activeWidth}%`,
        }}
      />
      
      {/* Options */}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => !disabled && onChange(option.value)}
          className={cn(
            'relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            value === option.value
              ? 'text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          )}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

