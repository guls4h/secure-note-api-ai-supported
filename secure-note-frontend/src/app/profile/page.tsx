'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormItem, FormLabel, FormDescription } from '@/components/ui/Form';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const profileSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  full_name: z.string().optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  confirm_password: z.string().optional().or(z.literal('')),
})
.refine((data) => !data.password || data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, invalidateSession } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    setApiError(null);
    setApiSuccess(null);

    try {
      const updateData = {
        email: data.email,
        full_name: data.full_name,
        ...(data.password ? { password: data.password } : {}),
      };

      await userService.updateUser(updateData);
      setApiSuccess('Profile updated successfully!');
    } catch (error: any) {
      setApiError(
        error?.response?.data?.detail || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setApiError(null);

    try {
      // Delete user account from the server
      await userService.deleteUser();
      
      // Use the invalidateSession method from auth context
      // This will clear all tokens, cache, and perform a full page reload
      await invalidateSession();
    } catch (error: any) {
      setApiError(
        error?.response?.data?.detail || 'Failed to delete account. Please try again.'
      );
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account information and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">{user.username}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Member since {new Date(user.created_at * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Account Information</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Username</span>
                  <span className="text-foreground font-medium text-right">{user.username}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground font-medium text-right break-all">{user.email}</span>
                </div>
                {user.full_name && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="text-foreground font-medium text-right">{user.full_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Edit Profile</h2>

            {apiError && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {apiError}
              </div>
            )}

            {apiSuccess && (
              <div className="mb-6 p-4 bg-success/10 text-success rounded-lg text-sm">
                {apiSuccess}
              </div>
            )}

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormItem className="mb-6">
                <FormLabel htmlFor="email" required>
                  Email
                </FormLabel>
                <Input
                  id="email"
                  type="email"
                  error={errors.email?.message}
                  className="w-full text-base py-2"
                  {...register('email')}
                />
              </FormItem>

              <FormItem className="mb-6">
                <FormLabel htmlFor="full_name">
                  Full Name
                </FormLabel>
                <Input
                  id="full_name"
                  type="text"
                  error={errors.full_name?.message}
                  className="w-full text-base py-2"
                  {...register('full_name')}
                />
              </FormItem>

              <div className="border-t border-border my-8 pt-8">
                <h3 className="text-xl font-medium text-foreground mb-6">Change Password</h3>
                
                <FormItem className="mb-6">
                  <FormLabel htmlFor="password">
                    New Password
                  </FormLabel>
                  <Input
                    id="password"
                    type="password"
                    error={errors.password?.message}
                    className="w-full text-base py-2"
                    {...register('password')}
                  />
                  <FormDescription>Leave blank to keep your current password</FormDescription>
                </FormItem>

                <FormItem className="mb-8">
                  <FormLabel htmlFor="confirm_password">
                    Confirm New Password
                  </FormLabel>
                  <Input
                    id="confirm_password"
                    type="password"
                    error={errors.confirm_password?.message}
                    className="w-full text-base py-2"
                    {...register('confirm_password')}
                  />
                </FormItem>
              </div>

              <Button type="submit" variant="primary" isLoading={isUpdating} size="lg">
                Update Profile
              </Button>
            </Form>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-8">
            <h2 className="text-2xl font-bold text-destructive mb-4">Danger Zone</h2>
            <p className="text-muted-foreground mb-8">
              Deleting your account will permanently remove all your notes and personal information. 
              This action cannot be undone.
            </p>
            <Button variant="danger" size="lg" onClick={handleDeleteAccount} isLoading={isDeleting}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 