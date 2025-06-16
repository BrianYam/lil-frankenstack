import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'light';
}

export function Spinner({ 
  className, 
  size = 'md', 
  variant = 'primary' 
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-2',
    lg: 'h-12 w-12 border-2',
  };
  
  const variantClasses = {
    primary: 'border-indigo-500',
    light: 'border-white',
  };
  
  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-t-transparent border-b-transparent',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}
