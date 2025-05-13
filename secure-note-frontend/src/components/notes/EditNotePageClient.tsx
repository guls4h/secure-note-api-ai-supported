'use client';

import { useEffect, useState, useRef } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '@/types';
import { noteService } from '@/services/api';
import { NoteForm } from '@/components/notes/NoteForm';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormItem, FormLabel } from '@/components/ui/Form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const decryptSchema = z.object({
  decrypt_password: z.string().min(1, 'Password is required'),
});

type DecryptFormValues = z.infer<typeof decryptSchema>;

const EditNotePageClient = ({
  params,
  searchParams,
}: {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: any; // Using any temporarily to avoid typing issues
}) => {
  const router = useRouter();
  // Unwrap params using use() hook
  const resolvedParams = 'then' in params ? use(params) : params;
  const noteId = resolvedParams.id;
  
  // Unwrap searchParams if it's a Promise
  const resolvedSearchParams = searchParams && 'then' in searchParams ? use(searchParams) : searchParams;
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Use refs instead of state when possible to avoid hydration issues
  const isMounted = useRef(false);
  const hasAttemptedAutoDecrypt = useRef(false);
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [needsDecryption, setNeedsDecryption] = useState(false);
  
  // Get the password parameter from URL (if any)
  const urlPassword = resolvedSearchParams?.password ? 
    (typeof resolvedSearchParams.password === 'string' 
      ? resolvedSearchParams.password 
      : Array.isArray(resolvedSearchParams.password) 
        ? resolvedSearchParams.password[0] 
        : undefined)
    : undefined;

  // Create form outside of render cycle to avoid hydration issues
  const formMethods = useForm<DecryptFormValues>({
    resolver: zodResolver(decryptSchema),
    defaultValues: {
      decrypt_password: urlPassword || ''
    }
  });
  
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
          
          // Check if the note is encrypted
          if (data?.is_encrypted) {
            setNeedsDecryption(true);
            
            // Auto-attempt decryption if password is in URL and we haven't tried yet
            if (urlPassword && !hasAttemptedAutoDecrypt.current) {
              hasAttemptedAutoDecrypt.current = true;
              await decryptNoteWithPassword(urlPassword);
            }
          }
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
  }, [noteId, isAuthenticated, authLoading, urlPassword]);

  // Function to decrypt note with a given password
  const decryptNoteWithPassword = async (password: string) => {
    if (!isMounted.current) return;
    
    setIsDecrypting(true);
    setDecryptError(null);
    try {
      const decryptedData = await noteService.getNote(noteId, password);
      
      if (!isMounted.current) return;
      
      // If the content still shows as encrypted, show an error
      if (decryptedData?.content && decryptedData.content.startsWith("[Encrypted content")) {
        setDecryptError("Failed to decrypt note. The provided password may be incorrect.");
      } else {
        // Store the decryption password along with the note data
        if (decryptedData) {
          decryptedData.decryptionPassword = password;
          setNote(decryptedData);
          setNeedsDecryption(false);
        }
      }
    } catch (error: any) {
      if (!isMounted.current) return;
      
      setDecryptError(
        error?.response?.data?.detail || 'Failed to decrypt note. Please check your password.'
      );
    } finally {
      if (isMounted.current) {
        setIsDecrypting(false);
      }
    }
  };

  // Handle decryption
  const onDecrypt = async (data: DecryptFormValues) => {
    await decryptNoteWithPassword(data.decrypt_password);
  };

  // Handle success
  const handleSuccess = () => {
    if (!isMounted.current) return;
    router.push(`/notes/${noteId}`);
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

  // Show password entry form if note needs decryption
  if (needsDecryption) {
    return (
      <div className="bg-card px-6 py-8 shadow-sm rounded-lg border border-border">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Decrypt Note to Edit</h1>
        
        <p className="text-foreground mb-4">
          This note is encrypted. Enter the password to decrypt it for editing.
        </p>
        
        {decryptError && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {decryptError}
          </div>
        )}

        <Form onSubmit={formMethods.handleSubmit(onDecrypt)}>
          <FormItem>
            <FormLabel htmlFor="decrypt_password" required>
              Decryption Password
            </FormLabel>
            <Input
              id="decrypt_password"
              type="password"
              autoComplete="current-password"
              error={formMethods.formState.errors.decrypt_password?.message}
              {...formMethods.register('decrypt_password')}
            />
          </FormItem>
          <div className="flex space-x-4 pt-4">
            <Button type="submit" variant="primary" isLoading={isDecrypting}>
              Decrypt Note
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/notes')}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  // Render the note form
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Note</h1>
        <Button
          variant="outline"
          onClick={() => router.push(`/notes/${noteId}`)}
        >
          Cancel
        </Button>
      </div>
      
      <NoteForm
        existingNote={note}
        onSuccess={handleSuccess}
        initialDecryptionPassword={note.decryptionPassword}
      />
    </div>
  );
};

export default EditNotePageClient; 