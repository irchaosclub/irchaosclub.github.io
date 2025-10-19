// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge class names (for conditional Tailwind classes) */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
