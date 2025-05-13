'use client';

import dynamic from 'next/dynamic';
import { NotePageProps } from '@/types';

// Create a client-only component with no SSR
const NotePageClient = dynamic(() => import('@/components/notes/NotePageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
});

// This is just a thin wrapper that exports the client-only component
// Passing through props to the client component which will properly handle params with React.use()
export default function NotePage(props: NotePageProps) {
  return <NotePageClient {...props} />;
} 