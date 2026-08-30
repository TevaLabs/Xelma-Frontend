import { cn } from '../../lib/utils';

interface SpinnerProps {
  /** Size of the spinner: "sm", "md", or "lg" */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label for screen readers */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Spinner = ({ size = 'md', label, className }: SpinnerProps) => {
  const sizeClass = sizeClasses[size];
  const ariaLabel = label || 'Loading';
  const borderWidth = size === 'lg' ? '4' : '2';

  return (
    <div
      className={cn(
        `rounded-full border-${borderWidth} border-[#2C4BFD] border-t-transparent animate-spin ${sizeClass} motion-safe:animate-spin`,
        className
      )}
      role="status"
      aria-label={ariaLabel}
    />
  );
};