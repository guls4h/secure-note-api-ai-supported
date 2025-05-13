import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Secure Notes App',
  description: 'Sign in to your secure notes account',
};

export default function LoginPage() {
  return (
    <div className="py-12">
      <LoginForm />
    </div>
  );
} 