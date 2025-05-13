'use client';

import { AuthProvider } from '@/lib/auth-context';

export const ClientAuthProvider = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => {
  return <AuthProvider>{children}</AuthProvider>;
}; 