import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card — Versatile container with header, content, footer slots.
 * Inspired by Linear's clean card design with subtle borders and hover depth.
 */
const Card = forwardRef(({ className, children, hover = false, glass = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-[var(--radius-lg)] bg-[var(--surface-primary)]',
      'shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]',
      'transition-[box-shadow,transform] duration-200 ease-out',
      hover &&
        'cursor-pointer hover:shadow-md hover:ring-gold-primary/15 hover:-translate-y-px',
      glass && 'bg-[var(--surface-primary)]/85 backdrop-blur-md',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

const CardHeader = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between px-5 py-3.5 md:px-6 md:py-4',
      'border-b border-black/[0.04] dark:border-white/[0.05]',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-base font-semibold font-[family-name:var(--font-body)] tracking-tight',
      'text-[var(--text-primary)]',
      className
    )}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-5 py-4 md:px-6 md:py-5', className)}
    {...props}
  >
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center px-5 py-3.5 md:px-6 md:py-4',
      'border-t border-black/[0.04] dark:border-white/[0.05]',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
export default Card;
