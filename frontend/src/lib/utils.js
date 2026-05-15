import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes without conflicts.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Standard utility used across all shadcn/ui-style components.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
