'use client';

import { cn } from '@/lib/utils';
import { sanitizeString, isValidInput } from '@/lib/security';
import { forwardRef, InputHTMLAttributes, useState, ChangeEvent } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  sizeVariant?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  maxLength?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, sizeVariant = 'md', fullWidth = true, maxLength = 1000, onChange, ...props }, ref) => {
    const [validationError, setValidationError] = useState<string | undefined>(undefined);
    
    // Custom handler to sanitize input and validate
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      sm: 'h-8 text-xs px-2',
      md: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4',
    };

    // Use either the provided error or the validation error
    const displayError = error || validationError;

    return (
      <div className={cn('space-y-1', fullWidth ? 'w-full' : 'w-auto')}>
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            className={cn(
              'flex w-full bg-input-background text-input-foreground border border-border rounded-md py-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
              sizeClasses[sizeVariant],
              icon && 'pl-10',
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

Input.displayName = 'Input';

export { Input }; 