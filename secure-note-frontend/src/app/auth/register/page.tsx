import { RegisterForm } from '@/components/auth/RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account - Secure Notes App',
  description: 'Create a new account for secure notes',
};

export default function RegisterPage() {
  return (
    <div className="py-12">
      <RegisterForm />
    </div>
  );
} 