'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-primary-foreground shadow-sm group-hover:brightness-110 group-hover:scale-[1.02] group-hover:shadow-lg hover:brightness-110 hover:scale-[1.02] hover:shadow-lg',
        primary: 'bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white shadow-md font-medium hover:shadow-lg hover:scale-[1.02] hover:brightness-110 active:translate-y-[1px]',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm group-hover:bg-destructive/90 group-hover:scale-[1.02] group-hover:shadow-lg hover:bg-destructive/90 hover:scale-[1.02] hover:shadow-lg',
        danger: 'bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white shadow-sm hover:brightness-110 hover:scale-[1.02] hover:shadow-lg active:translate-y-[1px]',
        outline: 'border border-border bg-transparent text-foreground group-hover:bg-accent/80 group-hover:text-accent-foreground group-hover:border-accent/50 group-hover:shadow-md hover:bg-accent/80 hover:text-accent-foreground hover:border-accent/50 hover:shadow-md',
        secondary: 'bg-gradient-to-r from-[#e0e7ff] to-[#c7d2fe] text-[#4338ca] font-medium shadow-sm hover:brightness-105 hover:scale-[1.02] hover:shadow-md active:translate-y-[1px]',
        ghost: 'text-foreground group-hover:bg-accent group-hover:text-accent-foreground group-hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]',
        link: 'text-primary underline-offset-4 group-hover:underline group-hover:text-primary/80 hover:underline hover:text-primary/80',
        subtle: 'bg-gradient-to-r from-[#e0e7ff] to-[#eff6ff] text-[#4338ca] hover:brightness-105 hover:scale-[1.02] hover:shadow-sm active:translate-y-[1px]',
        gradient: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:from-primary hover:to-primary/70 hover:shadow-lg hover:scale-[1.02] hover:brightness-110 active:translate-y-[1px]',
      },
      size: {
        default: 'h-10 py-2 px-4',
        xs: 'h-8 px-2.5 rounded-md text-xs',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        xl: 'h-12 px-10 rounded-md text-base',
        icon: 'h-10 w-10 rounded-full',
      },
      fullWidth: {
        true: 'w-full',
      },
      rounded: {
        default: 'rounded-md',
        full: 'rounded-full',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  fullWidth?: boolean;
  rounded?: 'default' | 'full' | 'none';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, fullWidth, isLoading = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, rounded, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center w-full h-full">
          {isLoading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {children}
        </span>
        <span className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none">
          <span className="absolute inset-0 opacity-0 group-hover:opacity-10 hover:opacity-10 bg-white transition-opacity duration-300 ease-in-out"></span>
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants }; 