import { Metadata } from 'next';

// Type declarations for Next.js pages
declare module 'next' {
  interface PageProps {
    params?: Record<string, string>;
    searchParams?: Record<string, string | string[]>;
  }
} 