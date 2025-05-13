'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import AnimatedNotesPreview from '@/components/AnimatedNotesPreview';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  // Set client state for hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <section className="py-12 lg:py-24 max-w-7xl mx-auto w-full">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex-1 space-y-6 max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Secure Notes with <span className="text-gradient">AI Sensitivity Analysis</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Take notes with confidence. Our <span className="font-semibold text-gradient">AI sensitivity analysis</span> helps 
              identify potentially risky content, while password protection keeps your information secure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {!isClient || isLoading ? (
                <div className="h-10 bg-muted rounded-md w-32 animate-pulse"></div>
              ) : isAuthenticated ? (
                <Link href="/notes">
                  <Button variant="primary" size="lg">
                    Go to My Notes
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="primary" size="lg">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button variant="secondary" size="lg">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg">
            <div className="relative">
              <AnimatedNotesPreview />
              <div className="absolute top-2 right-2 bg-primary/10 rounded-md py-1 px-2 text-xs font-medium text-primary border border-primary/20">
                Live Demo Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background p-8 rounded-xl border border-border shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Password-Based Encryption</h3>
              <p className="text-muted-foreground">
                Encrypt your sensitive notes with a personal password. The encryption happens on the server using your password as the key.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-background p-8 rounded-xl border border-border shadow-sm gradient-highlight">
              <div className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gradient">AI Sensitivity Analysis</h3>
              <p className="text-muted-foreground">
                Our advanced AI analyzes your content to identify sensitive information and provides a numerical score from 0-100, helping you decide when encryption is necessary.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-background p-8 rounded-xl border border-border shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Modern & Responsive UI</h3>
              <p className="text-muted-foreground">
                Enjoy a clean, intuitive interface built with Next.js and Tailwind CSS that works seamlessly across all devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-bold mb-6">1</div>
            <h3 className="text-xl font-semibold mb-3">Create a Note</h3>
            <p className="text-muted-foreground">
              Write down your thoughts, ideas, or sensitive information in our clean editor.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-bold mb-6">2</div>
            <h3 className="text-xl font-semibold mb-3"><span className="text-gradient">AI Analysis</span></h3>
            <p className="text-muted-foreground">
              Our AI examines your content and gives it a sensitivity score, helping you identify potentially sensitive information.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-bold mb-6">3</div>
            <h3 className="text-xl font-semibold mb-3">Choose Protection</h3>
            <p className="text-muted-foreground">
              Based on the sensitivity score, decide whether to encrypt your note with a password you'll use to decrypt it later.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-bold mb-6">4</div>
            <h3 className="text-xl font-semibold mb-3">Access Securely</h3>
            <p className="text-muted-foreground">
              Retrieve your notes anytime and decrypt protected content using your password when needed.
            </p>
          </div>
        </div>
      </section>

      {/* Security Approach Section */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Security Approach</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your notes are secured with password-based encryption, enhanced by AI-powered risk assessment
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-background p-8 rounded-xl border border-border shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password-Based Encryption
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Strong PBKDF2 key derivation with SHA-256 hashing algorithm</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Fernet symmetric encryption using your password as the key</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Unique salt for each encrypted note to prevent rainbow table attacks</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>100,000 iterations for key derivation to protect against brute force attempts</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-background p-8 rounded-xl border border-border shadow-sm gradient-highlight">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-gradient">AI Sensitivity Analysis</span>
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Intelligent AI model that evaluates note content sensitivity on a scale of <span className="font-medium">0-100</span></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Detailed explanations of why content may be sensitive or at risk</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Suggestions for when encryption might be appropriate based on content</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Detection of personal information, financial data, and other high-risk content</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-card border-t border-border mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-5">Take Control of Your Notes Today</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Start securing your important information with <span className="text-gradient font-medium">AI-powered sensitivity analysis</span> and password-based encryption.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isClient || isLoading ? (
              <div className="h-10 bg-muted rounded-md w-32 animate-pulse"></div>
            ) : isAuthenticated ? (
              <Link href="/notes">
                <Button variant="primary" size="lg">
                  Go to My Notes
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/register">
                  <Button variant="primary" size="lg">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="secondary" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
