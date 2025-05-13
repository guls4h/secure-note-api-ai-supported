'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Form, FormItem, FormLabel, FormDescription } from '@/components/ui/Form';
import { Note, NoteRequest, UpdateNoteRequest } from '@/types';
import { noteService } from '@/services/api';
import { useRouter } from 'next/navigation';

// Define schema with explicit boolean for is_encrypted
const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  is_encrypted: z.boolean(),
  encryption_password: z.string().optional(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteFormProps {
  existingNote?: Note;
  /**
   * @deprecated We now directly redirect to /notes after successful operations
   * This prop is kept for backward compatibility but will be removed in future versions.
   */
  onSuccess?: () => void;
  initialDecryptionPassword?: string;
}

export const NoteForm = ({ existingNote, onSuccess, initialDecryptionPassword }: NoteFormProps) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMounted = useRef(false);
  const router = useRouter();

  // Store the original encrypted status to detect changes
  const [wasOriginallyEncrypted] = useState(existingNote?.is_encrypted || false);

  // Set mounted state and client detection
  useEffect(() => {
    isMounted.current = true;
    setIsClient(true);
    return () => {
      isMounted.current = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: existingNote
      ? {
          title: existingNote.title,
          content: existingNote.content,
          is_encrypted: existingNote.is_encrypted,
          encryption_password: '',
        }
      : {
          title: '',
          content: '',
          is_encrypted: false,
          encryption_password: '',
        },
  });

  const isEncrypted = watch('is_encrypted');

  const onSubmit = async (data: NoteFormValues) => {
    if (!isClient || !isMounted.current) return;
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      let result;
      
      if (existingNote) {
        // Check for encryption change scenarios
        const isNewEncryption = !wasOriginallyEncrypted && data.is_encrypted;
        
        // Validate password is provided when encrypting
        if (data.is_encrypted && (!data.encryption_password || data.encryption_password.trim() === '')) {
          if (isMounted.current) {
            setApiError('Password is required when encrypting a note');
            setIsLoading(false);
          }
          return;
        }
        
        if (wasOriginallyEncrypted && data.is_encrypted) {
          // Always handle as password change when updating an encrypted note
          if (!initialDecryptionPassword) {
            if (isMounted.current) {
              setApiError('Original decryption password is required to access the content');
              setIsLoading(false);
            }
            return;
          }
          
          // Create a new note with the same content but different password
          const recreateData: NoteRequest = {
            title: data.title,
            content: data.content,
            is_encrypted: true,
            encryption_password: data.encryption_password ? data.encryption_password.trim() : ''
          };
          
          try {
            result = await noteService.recreateNote(
              existingNote.id, 
              recreateData, 
              true,
              initialDecryptionPassword
            );
            
            // Immediately redirect to the notes page after recreation
            router.push('/notes');
            return;
          } catch (error: any) {
            if (error?.response?.data?.detail) {
              setApiError(typeof error.response.data.detail === 'string' 
                ? error.response.data.detail 
                : JSON.stringify(error.response.data.detail));
            } else {
              setApiError('Failed to recreate note. Please try again.');
            }
            
            setIsLoading(false);
            return;
          }
        } else {
          // Standard update approach for non-encrypted to encrypted updates or regular updates
          const updateData: UpdateNoteRequest = {
            title: data.title,
            content: data.content,
            is_encrypted: Boolean(data.is_encrypted)
          };
          
          // Handle encryption password logic
          if (data.is_encrypted === true) {
            // New encryption for previously unencrypted note
            // Always require a new password in this case
            if (!data.encryption_password || data.encryption_password.trim() === '') {
              if (isMounted.current) {
                setApiError('Password is required when encrypting a note');
                setIsLoading(false);
              }
              return;
            }
            updateData.encryption_password = data.encryption_password.trim();
          }
          
          result = await noteService.updateNote(existingNote.id, updateData);
        }
      } else {
        // Create a new note
        const createData: NoteRequest = {
          title: data.title,
          content: data.content,
          is_encrypted: Boolean(data.is_encrypted)
        };
        
        // If creating an encrypted note, password is required
        if (data.is_encrypted === true) {
          if (!data.encryption_password) {
            if (isMounted.current) {
              setApiError('Password is required for encrypted notes');
              setIsLoading(false);
            }
            return;
          }
          createData.encryption_password = data.encryption_password.trim();
        }
        
        try {
          result = await noteService.createNote(createData);
          
          // Always redirect to My Notes page after creation
          router.push('/notes');
          return;
        } catch (error: any) {
          if (error?.response?.data?.detail) {
            setApiError(typeof error.response.data.detail === 'string' 
              ? error.response.data.detail 
              : JSON.stringify(error.response.data.detail));
          } else {
            setApiError('Failed to create note. Please try again.');
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      if (!isMounted.current) return;
      
      // Always redirect to the notes list page after successful update or creation
      router.push('/notes');
    } catch (error: any) {
      if (!isMounted.current) return;
      
      if (error?.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Handle validation errors
          setApiError(error.response.data.detail.map((err: any) => err.msg).join(', '));
        } else {
          // Handle string error
          setApiError(error.response.data.detail);
        }
      } else if (error?.message) {
        setApiError(error.message);
      } else {
        setApiError(`Failed to ${existingNote ? 'update' : 'create'} note. Please try again.`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // During SSR or before hydration, show a minimal placeholder
  if (!isClient) {
    return (
      <div className="bg-card px-6 py-8 shadow-sm rounded-lg border border-border animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-muted rounded w-full mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-24 bg-muted rounded w-full mb-6"></div>
          <div className="h-10 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card px-6 py-8 shadow-sm rounded-lg border border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        {existingNote ? 'Edit Note' : 'Create New Note'}
      </h2>

      {apiError && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {apiError}
        </div>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <FormLabel htmlFor="title" required>
            Title
          </FormLabel>
          <Input
            id="title"
            error={errors.title?.message}
            {...register('title')}
          />
        </FormItem>

        <FormItem>
          <FormLabel htmlFor="content" required>
            Content
          </FormLabel>
          <TextArea
            id="content"
            error={errors.content?.message}
            {...register('content')}
            rows={8}
          />
        </FormItem>

        <FormItem>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_encrypted"
              className="rounded border-border text-primary focus:ring-primary"
              {...register('is_encrypted')}
            />
            <FormLabel htmlFor="is_encrypted" className="!mt-0">
              Encrypt this note
            </FormLabel>
          </div>
          <FormDescription>
            Encrypting your note will require a password to view it later
          </FormDescription>
        </FormItem>

        {isEncrypted && (
          <FormItem>
            <FormLabel htmlFor="encryption_password" required={isEncrypted}>
              {wasOriginallyEncrypted ? 'New Encryption Password' : 'Encryption Password'}
            </FormLabel>
            <Input
              id="encryption_password"
              type="password"
              autoComplete="new-password"
              error={errors.encryption_password?.message}
              {...register('encryption_password')}
            />
            <FormDescription>
              {wasOriginallyEncrypted
                ? 'Enter a new password that will be used to encrypt your note'
                : 'This password will be needed to decrypt and view your note'}
            </FormDescription>
          </FormItem>
        )}

        <div className="flex flex-wrap gap-3 pt-4">
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {existingNote ? 'Update Note' : 'Create Note'}
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
}; 