'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export const Form = ({ children, className, onSubmit }: FormProps) => {
  return (
    <form
      className={cn('space-y-6', className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit && onSubmit(e);
      }}
    >
      {children}
    </form>
  );
};

interface FormItemProps {
  children: ReactNode;
  className?: string;
}

export const FormItem = ({ children, className }: FormItemProps) => {
  return <div className={cn('space-y-2', className)}>{children}</div>;
};

interface FormLabelProps {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}

export const FormLabel = ({ children, className, htmlFor, required }: FormLabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-sm font-medium leading-none text-gray-700 dark:text-gray-200', className)}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
};

interface FormDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const FormDescription = ({ children, className }: FormDescriptionProps) => {
  return (
    <p className={cn('text-sm text-gray-600 dark:text-gray-300', className)}>
      {children}
    </p>
  );
}; 