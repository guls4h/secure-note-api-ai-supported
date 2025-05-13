'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormItem, FormLabel } from '@/components/ui/Form';
import Link from 'next/link';
import { ReCaptcha, ReCaptchaRef } from '@/components/ui/ReCaptcha';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCaptchaRef>(null);
  const lastTokenTime = useRef<number>(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  // Check for registration success message on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const registrationSuccess = localStorage.getItem('registration_success');
      const registeredUsername = localStorage.getItem('registered_username');
      
      if (registrationSuccess === 'true') {
        setSuccessMessage(`Account created successfully! Please sign in.`);
        
        // Pre-fill the username if available
        if (registeredUsername) {
          setValue('username', registeredUsername);
        }
        
        // Clear the registration success flag
        localStorage.removeItem('registration_success');
        localStorage.removeItem('registered_username');
      }
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
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
    setSuccessMessage(null);
    
    console.log('Login form data:', data);
    console.log('reCAPTCHA token age (seconds):', Math.floor(tokenAge / 1000));
    
    try {
      await login({
        username: data.username,
        password: data.password,
        recaptcha_token: recaptchaToken
      });
    } catch (error: any) {
      console.error('Login error details:', error.response?.data);
      
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
        setApiError('Failed to login. Please check your credentials.');
      }
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
        <h1 className="text-2xl font-bold text-foreground">Sign in to your account</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Or{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:text-primary/80">
            create a new account
          </Link>
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-md text-sm">
          {successMessage}
        </div>
      )}

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
        </FormItem>
        
        {/* Google reCAPTCHA */}
        <ReCaptcha 
          ref={recaptchaRef}
          siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeV8DQrAAAAAFSJjM5FZ5LI-AjvC-5rJPPpb_fP"} 
          onChange={handleRecaptchaChange} 
        />

        <Button type="submit" fullWidth isLoading={isLoading}>
          Sign in
        </Button>
      </Form>
    </div>
  );
}; 