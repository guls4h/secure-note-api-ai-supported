'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Note } from '@/types';
import { noteService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { NoteCard } from '@/components/notes/NoteCard';
import { useAuth } from '@/lib/auth-context';

type SortOption = 'newest' | 'oldest' | 'title';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!isAuthenticated) return;
      
      try {
        const data = await noteService.getNotes();
        setNotes(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to load notes. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNotes();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Apply filtering and sorting
  useEffect(() => {
    let result = [...notes];
    
    // Filter by search term if present
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(note => 
        note.title.toLowerCase().includes(lowercaseSearch) ||
        (!note.is_encrypted && note.content.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    // Apply sorting
    switch(sortBy) {
      case 'newest':
        result.sort((a, b) => b.updated_at - a.updated_at);
        break;
      case 'oldest':
        result.sort((a, b) => a.updated_at - b.updated_at);
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    setFilteredNotes(result);
  }, [notes, sortBy, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      await noteService.deleteNote(id);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  if (!isAuthenticated && !authLoading) {
    return null; // Will redirect in useEffect
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading your notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-5 rounded-lg max-w-3xl mx-auto mt-8">
        <div className="flex items-start">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2 mt-0.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <div>
            <h3 className="font-medium">Error Loading Notes</h3>
            <p>{error}</p>
            <button
              className="mt-3 text-sm font-medium text-destructive hover:underline"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Your Notes</h1>
        <Link href="/notes/new">
          <Button variant="primary">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Create New Note
          </Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center rounded-xl my-8">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-20 w-20 text-muted-foreground/50 mb-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
            <h3 className="text-xl font-medium text-foreground mb-3">No notes yet</h3>
            <p className="text-muted-foreground mb-8 text-center">
              Create your first note to get started with secure note-taking. 
              You can choose to encrypt sensitive notes with a password.
            </p>
            <Link href="/notes/new">
              <Button variant="primary" size="lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
                Create Your First Note
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Search and sort controls */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-8 gap-4 bg-card border border-border rounded-xl p-4">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                className="w-full px-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm('')}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center">
              <label className="text-sm text-muted-foreground mr-2">Sort by:</label>
              <select
                className="border border-border rounded-md bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          {/* Notes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {filteredNotes.length === 0 ? (
              <div className="md:col-span-2 bg-card border border-border p-8 text-center rounded-xl">
                <p className="text-muted-foreground">No notes found matching your search criteria.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onDelete={() => handleDelete(note.id)} 
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
} 