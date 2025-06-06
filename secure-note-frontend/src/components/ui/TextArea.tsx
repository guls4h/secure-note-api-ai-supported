'use client';

import { cn } from '@/lib/utils';
import { sanitizeString, isValidInput } from '@/lib/security';
import { forwardRef, TextareaHTMLAttributes, useState, ChangeEvent } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  sizeVariant?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  maxLength?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, sizeVariant = 'md', fullWidth = true, maxLength = 5000, onChange, ...props }, ref) => {
    const [validationError, setValidationError] = useState<string | undefined>(undefined);
    
    // Custom handler to sanitize input and validate
    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      // Perform input validation
      if (!isValidInput(e.target.value, maxLength)) {
        setValidationError('Input contains potentially unsafe content');
      } else {
        setValidationError(undefined);
      }
      
      // Call the original onChange handler if provided
      if (onChange) {
        onChange(e);
      }
    };
    
    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-2',
      lg: 'text-base px-4 py-3',
    };

    // Use either the provided error or the validation error
    const displayError = error || validationError;

    return (
      <div className={cn('space-y-1', fullWidth ? 'w-full' : 'w-auto')}>
        <div className="relative">
          <textarea
            className={cn(
              'flex w-full min-h-[100px] bg-input-background text-input-foreground border border-border rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
              sizeClasses[sizeVariant],
              displayError && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            onChange={handleInputChange}
            maxLength={maxLength}
            {...props}
          />
        </div>
        {displayError && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {sanitizeString(displayError)}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export { TextArea }; 