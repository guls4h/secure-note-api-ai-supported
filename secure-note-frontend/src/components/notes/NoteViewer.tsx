'use client';

import { useEffect, useState, useRef } from 'react';
import { Note } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormItem, FormLabel } from '@/components/ui/Form';
import { noteService } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { sanitizeString } from '@/lib/security';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";

interface NoteViewerProps {
  note: Note;
  onDelete?: (id: string) => void;
}

const decryptSchema = z.object({
  decrypt_password: z.string().min(1, 'Password is required'),
});

type DecryptFormValues = z.infer<typeof decryptSchema>;

export const NoteViewer = ({ note, onDelete }: NoteViewerProps) => {
  const [decryptedNote, setDecryptedNote] = useState<Note | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const isMounted = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<DecryptFormValues>({
    resolver: zodResolver(decryptSchema),
    defaultValues: {
      decrypt_password: ''
    }
  });

  // Set mounted state and client detection
  useEffect(() => {
    isMounted.current = true;
    setIsClient(true);
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip during SSR or if component unmounted
    if (!isClient || !isMounted.current) return;
    
    // If the note is not encrypted, use it directly
    if (!note?.is_encrypted) {
      setDecryptedNote(note);
    } else if (note?.content && !note.content.startsWith('[Encrypted content')) {
      // If content doesn't have the encrypted message placeholder,
      // it's already been decrypted by the API
      setDecryptedNote(note);
    } else {
      setDecryptedNote(null);
    }
  }, [note, isClient]);

  const onDecrypt = async (data: DecryptFormValues) => {
    if (!isClient || !isMounted.current) return;
    
    setIsDecrypting(true);
    setDecryptError(null);
    try {
      const decryptedData = await noteService.getNote(note.id, data.decrypt_password);
      
      // Only update state if component is still mounted
      if (!isMounted.current) return;
      
      // If the content still shows as encrypted, show an error
      if (decryptedData?.content && decryptedData.content.startsWith("[Encrypted content")) {
        setDecryptError("Failed to decrypt note. The provided password may be incorrect.");
        setDecryptedNote(null);
      } else if (decryptedData) {
        // Store the decryption password in the note for future use
        decryptedData.decryptionPassword = data.decrypt_password;
        setDecryptedNote(decryptedData);
      }
    } catch (error: any) {
      if (!isMounted.current) return;
      
      setDecryptError(
        error?.response?.data?.detail || 'Failed to decrypt note. Please check your password.'
      );
      setDecryptedNote(null);
    } finally {
      if (isMounted.current) {
        setIsDecrypting(false);
      }
    }
  };

  const handleDelete = () => {
    if (!isClient) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete && onDelete(note.id);
    }
  };

  // Determine sensitivity badge color based on score
  const getSensitivityColor = (score: number) => {
    if (score >= 70) return "bg-destructive text-destructive-foreground";
    if (score >= 40) return "bg-warning text-warning-foreground";
    return "bg-success/70 text-success-foreground";
  };

  // Get sensitivity badge text based on score
  const getSensitivityText = (score: number) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  // During SSR or before hydration, show a minimal placeholder
  if (!isClient) {
    return (
      <div className="bg-card shadow-sm rounded-lg border border-border overflow-hidden animate-pulse">
        <div className="px-6 py-4">
          <div className="h-6 bg-muted rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-muted rounded mb-4 w-1/5"></div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-sm rounded-lg border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-foreground">{sanitizeString(note.title)}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {formatDate(new Date(note.updated_at * 1000))}
            </p>
            
            {/* Sensitivity score indicator */}
            {(decryptedNote || !note.is_encrypted) && note.sensitivity && (
              <div className="mt-2">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-sm inline-flex items-center ${getSensitivityColor(note.sensitivity.sensitivity_score)}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Sensitivity: {getSensitivityText(note.sensitivity.sensitivity_score)} ({note.sensitivity.sensitivity_score}/100)
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">{note.sensitivity.explanation}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          
          {note.is_encrypted && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${decryptedNote ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {decryptedNote ? 'Decrypted' : 'Encrypted'}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        {note.is_encrypted && !decryptedNote ? (
          <div className="py-4">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-primary mr-2 mt-0.5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-foreground">
                  This note is encrypted and requires a password to view its content. Please enter the decryption password below.
                </p>
              </div>
            </div>
            
            {decryptError && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <div className="flex items-center">
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
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  {sanitizeString(decryptError)}
                </div>
              </div>
            )}

            <Form onSubmit={handleSubmit(onDecrypt)}>
              <FormItem>
                <FormLabel htmlFor="decrypt_password" required>
                  Decryption Password
                </FormLabel>
                <Input
                  id="decrypt_password"
                  type="password"
                  autoComplete="current-password"
                  error={errors.decrypt_password?.message}
                  {...register('decrypt_password')}
                />
              </FormItem>
              <Button type="submit" variant="primary" className="mt-2" isLoading={isDecrypting}>
                Decrypt Note
              </Button>
            </Form>
          </div>
        ) : (
          <div className="prose max-w-none py-4 text-foreground">
            <div className="whitespace-pre-wrap">
              {sanitizeString(decryptedNote?.content || note.content)}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-secondary/50 border-t border-border">
        <div className="flex justify-between items-center">
          <Link href="/notes">
            <Button variant="outline" size="sm">
              Back to Notes
            </Button>
          </Link>
          <div className="flex space-x-2">
            {decryptedNote && note.is_encrypted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDecryptedNote(null);
                  reset();
                }}
              >
                Re-encrypt
              </Button>
            )}
            <Link href={decryptedNote?.decryptionPassword 
                  ? `/notes/${note.id}/edit?password=${encodeURIComponent(decryptedNote.decryptionPassword)}`
                  : `/notes/${note.id}/edit`}>
              <Button variant="primary" size="sm">
                Edit
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 