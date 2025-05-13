'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormItem, FormLabel, FormDescription } from '@/components/ui/Form';
import Link from 'next/link';
import { ReCaptcha, ReCaptchaRef } from '@/components/ui/ReCaptcha';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().optional(),
  dataProtectionConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the data protection policy to create an account'
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);
  const lastTokenTime = useRef<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      full_name: '',
      dataProtectionConsent: false,
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    // Check if we have a token and if it's possibly expired
    const currentTime = Date.now();
    const tokenAge = currentTime - lastTokenTime.current;
    
    if (!recaptchaToken || tokenAge > 110000) {  // 110 seconds - reCAPTCHA tokens expire after 2 minutes
      setApiError('Please complete the reCAPTCHA verification');
      // Force a reCAPTCHA reset to get a fresh token
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      return;
    }

    setIsLoading(true);
    setApiError(null);
    
    console.log('Form data submitted:', data);
    console.log('reCAPTCHA token age (seconds):', Math.floor(tokenAge / 1000));
    
    // Get a fresh token right before submission
    try {
      // Create the user data object exactly matching the expected API format
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        // Only include full_name if it's not empty
        ...(data.full_name ? { full_name: data.full_name } : {}),
        // Add recaptcha token
        recaptcha_token: recaptchaToken
      };
      
      console.log('Registration data being sent to API:', {
        ...userData,
        password: '****',
        recaptcha_token: `${recaptchaToken?.substring(0, 10)}...` 
      });
      
      try {
        console.log('Calling registerUser function...');
        await registerUser(userData);
        console.log('Registration completed successfully');
      } catch (error: any) {
        console.error('Registration error details:', error);
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        // Reset recaptcha on error
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
          setRecaptchaToken(null);
        }
        
        if (error?.response?.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // Handle validation errors
            const errorMessage = error.response.data.detail.map((err: any) => {
              console.log('Validation error:', err);
              return `${err.loc?.[1] || ''}: ${err.msg}`;
            }).join(', ');
            setApiError(errorMessage);
          } else {
            // Handle string error
            setApiError(error.response.data.detail);
          }
        } else if (error?.response?.status === 400) {
          setApiError('reCAPTCHA verification failed. Please try again.');
        } else if (error?.message) {
          setApiError(error.message);
        } else {
          setApiError('Failed to register. Please try again with different credentials.');
        }
      }
    } catch (error: any) {
      console.error('Error during registration:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecaptchaChange = (token: string) => {
    console.log('reCAPTCHA token received');
    setRecaptchaToken(token);
    lastTokenTime.current = Date.now();
    setApiError(null);
  };

  return (
    <div className="bg-card px-6 py-8 shadow-sm rounded-lg border border-border sm:max-w-md sm:mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create a new account</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Or{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
            sign in to your existing account
          </Link>
        </p>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {apiError}
        </div>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormItem>
          <FormLabel htmlFor="username" required>
            Username
          </FormLabel>
          <Input
            id="username"
            type="text"
            error={errors.username?.message}
            {...register('username')}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </FormItem>

        <FormItem>
          <FormLabel htmlFor="email" required>
            Email
          </FormLabel>
          <Input
            id="email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </FormItem>

        <FormItem>
          <FormLabel htmlFor="password" required>
            Password
          </FormLabel>
          <Input
            id="password"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
          <FormDescription>Must be at least 8 characters</FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel htmlFor="full_name">
            Full Name
          </FormLabel>
          <Input
            id="full_name"
            type="text"
            error={errors.full_name?.message}
            {...register('full_name')}
          />
          <FormDescription>Optional</FormDescription>
        </FormItem>

        {/* Data Protection Consent Checkbox */}
        <FormItem className="mb-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="dataProtectionConsent"
                type="checkbox"
                className="w-4 h-4 border border-border rounded bg-background focus:ring-3 focus:ring-primary"
                {...register('dataProtectionConsent')}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="dataProtectionConsent" className="font-medium text-foreground">
                I agree to the processing of my personal data according to the <Link href="/privacy-policy" className="text-primary hover:underline">privacy policy</Link>
              </label>
              {errors.dataProtectionConsent && (
                <p className="text-sm text-destructive mt-1">{errors.dataProtectionConsent.message}</p>
              )}
            </div>
          </div>
        </FormItem>

        {/* Google reCAPTCHA */}
        <ReCaptcha 
          ref={recaptchaRef}
          siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeV8DQrAAAAAFSJjM5FZ5LI-AjvC-5rJPPpb_fP"} 
          onChange={handleRecaptchaChange} 
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Create account
        </Button>
      </Form>
    </div>
  );
}; 