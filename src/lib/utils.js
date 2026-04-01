import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely, resolving conflicts via tailwind-merge.
 * Drop-in equivalent of the shadcn/ui `cn` utility.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
