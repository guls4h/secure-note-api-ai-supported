'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled 
          ? 'bg-card/80 backdrop-blur-md border-b border-border shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                  Secure Notes
                </span>
              </Link>
            </div>
            <nav className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-white/90 transition-colors ${
                  pathname === '/' 
                    ? 'border-b-2 border-primary text-white' 
                    : 'hover:text-white'
                }`}
              >
                <div className="group relative py-2 px-1">
                  Home
                  <span className="absolute -bottom-[2px] left-0 h-[2px] w-full bg-primary transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                </div>
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/notes"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-white/90 transition-colors ${
                      pathname === '/notes' 
                        ? 'border-b-2 border-primary text-white' 
                        : 'hover:text-white'
                    }`}
                  >
                    <div className="group relative py-2 px-1">
                      My Notes
                      <span className="absolute -bottom-[2px] left-0 h-[2px] w-full bg-primary transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                    </div>
                  </Link>
                  <Link
                    href="/profile"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-white/90 transition-colors ${
                      pathname === '/profile' 
                        ? 'border-b-2 border-primary text-white' 
                        : 'hover:text-white'
                    }`}
                  >
                    <div className="group relative py-2 px-1">
                      Profile
                      <span className="absolute -bottom-[2px] left-0 h-[2px] w-full bg-primary transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
                    </div>
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">{user?.username}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:text-white/90">
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-white hover:text-white/90">Sign in</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="gradient" size="sm" rounded="full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg
                  className="block h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="sm:hidden bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname === '/' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-transparent text-white hover:bg-primary/10 hover:border-primary/30 hover:text-white'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/notes"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/notes' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-transparent text-white hover:bg-primary/10 hover:border-primary/30 hover:text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Notes
                </Link>
                <Link
                  href="/profile"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    pathname === '/profile' 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-transparent text-white hover:bg-primary/10 hover:border-primary/30 hover:text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            {isAuthenticated ? (
              <div className="space-y-1">
                <div className="px-4 py-2 flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-medium text-white">{user?.username}</p>
                    <p className="text-sm text-white/70">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left pl-7 pr-4 py-2 text-base font-medium text-white/70 hover:text-white hover:bg-primary/10"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-4 py-4 flex flex-col">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" fullWidth className="text-white border-white/30">Sign in</Button>
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="gradient" fullWidth>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}; 