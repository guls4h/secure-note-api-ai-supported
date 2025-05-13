'use client';

import { useEffect, useState, useRef } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '@/types';
import { noteService } from '@/services/api';
import { NoteViewer } from '@/components/notes/NoteViewer';
import { useAuth } from '@/lib/auth-context';

// Next.js 14+ expects specific page props format
const NotePageClient = ({
  params,
  searchParams,
}: {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}) => {
  const router = useRouter();
  // Properly unwrap params with React.use()
  const unwrappedParams = 'then' in params ? use(params) : params;
  const noteId = unwrappedParams.id;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Use refs instead of state when possible to avoid hydration issues
  const isMounted = useRef(false);
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Store searchParams in state to prevent direct access during render
  const [initializedParams] = useState(searchParams);

  // Handle client-side mounting
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle authentication
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch note data
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    if (!noteId) return;
    
    const fetchNote = async () => {
      if (!isMounted.current) return;
      
      try {
        const data = await noteService.getNote(noteId);
        
        if (isMounted.current) {
          setNote(data);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted.current) {
          const errorMessage = err.response?.status === 404
            ? 'Note not found. It may have been deleted or you don\'t have access to it.'
            : 'Failed to load note. Please try again later.';
          
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    fetchNote();
  }, [noteId, isAuthenticated, authLoading]);

  // Delete handler
  const handleDelete = async (noteId: string) => {
    if (!isMounted.current) return;
    
    try {
      await noteService.deleteNote(noteId);
      router.push('/notes');
    } catch (err) {
      if (isMounted.current) {
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle authentication redirect
  if (!isAuthenticated) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
        <p>{error}</p>
        <button 
          onClick={() => router.push('/notes')}
          className="mt-3 text-sm font-medium text-destructive hover:underline"
        >
          Back to Notes
        </button>
      </div>
    );
  }

  // Empty state
  if (!note) {
    return (
      <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-md">
        <p>Note not found.</p>
        <button 
          onClick={() => router.push('/notes')}
          className="mt-3 text-sm font-medium text-warning hover:underline"
        >
          Back to Notes
        </button>
      </div>
    );
  }

  // Render the note viewer only on client-side
  return <NoteViewer note={note} onDelete={handleDelete} />;
};

export default NotePageClient; 