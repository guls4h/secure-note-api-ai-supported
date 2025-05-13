'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export interface ReCaptchaRef {
  reset: () => void;
  execute: () => Promise<string>;
}

interface ReCaptchaProps {
  siteKey: string;
  onChange: (token: string) => void;
}

export const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ siteKey, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [loadAttempts, setLoadAttempts] = useState(0);
    const widgetIdRef = useRef<number | null>(null);
    const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.grecaptcha && widgetIdRef.current !== null) {
          console.log("Resetting reCAPTCHA");
          window.grecaptcha.reset(widgetIdRef.current);
          if (expiryTimerRef.current) {
            clearTimeout(expiryTimerRef.current);
            expiryTimerRef.current = null;
          }
        }
      },
      execute: async () => {
        return new Promise((resolve, reject) => {
          if (!window.grecaptcha || widgetIdRef.current === null) {
            reject(new Error("reCAPTCHA not initialized"));
            return;
          }
          
          try {
            // First reset to ensure we get a fresh token
            window.grecaptcha.reset(widgetIdRef.current);
            
            // Get the response (this triggers verification)
            const response = window.grecaptcha.getResponse(widgetIdRef.current);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      }
    }));
    
    // Set up global callback for reCAPTCHA
    useEffect(() => {
      // Define global callback
      window.onReCaptchaLoad = () => {
        console.log("reCAPTCHA script loaded successfully");
        setIsScriptLoaded(true);
      };
      
      // Clean up
      return () => {
        window.onReCaptchaLoad = undefined;
        if (expiryTimerRef.current) {
          clearTimeout(expiryTimerRef.current);
        }
      };
    }, []);
    
    // Load the script if needed
    useEffect(() => {
      // Check if we've already tried loading too many times
      if (loadAttempts > 2) {
        console.error("Failed to load reCAPTCHA after multiple attempts");
        return;
      }
      
      // Don't load the script if it's already loaded
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        console.log("reCAPTCHA already available in window");
        setIsScriptLoaded(true);
        return;
      }
      
      // Don't reload if already loading
      if (document.querySelector('script[src*="recaptcha/api.js"]')) {
        console.log("reCAPTCHA script is already loading");
        return;
      }
      
      console.log("Loading reCAPTCHA script...");
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?onload=onReCaptchaLoad&render=explicit`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error("Error loading reCAPTCHA script");
        // Try again with a small delay
        setTimeout(() => {
          setLoadAttempts(prev => prev + 1);
        }, 1000);
      };
      
      document.head.appendChild(script);
      
      return () => {
        // No need to remove script on cleanup - it's global
      };
    }, [loadAttempts]);
    
    // Render reCAPTCHA once script is loaded
    useEffect(() => {
      if (isRendered || !isScriptLoaded || !containerRef.current) return;
      
      if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') {
        console.error("grecaptcha not available even though script is loaded");
        return;
      }
      
      try {
        console.log("Rendering reCAPTCHA...");
        const widgetId = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log("reCAPTCHA verification completed, token received");
            onChange(token);
            
            // Set a timer to warn about token expiry (tokens expire after 2 minutes)
            if (expiryTimerRef.current) {
              clearTimeout(expiryTimerRef.current);
            }
            expiryTimerRef.current = setTimeout(() => {
              console.warn("reCAPTCHA token is about to expire, will reset on form submission");
            }, 110000); // 1m50s (just before the 2 minute expiry)
          },
          'expired-callback': () => {
            console.log("reCAPTCHA token expired");
            onChange(''); // Clear token
          },
          'error-callback': () => {
            console.error("reCAPTCHA error occurred");
          }
        });
        widgetIdRef.current = widgetId;
        setIsRendered(true);
      } catch (error) {
        console.error("Error rendering reCAPTCHA:", error);
      }
    }, [isScriptLoaded, siteKey, onChange, isRendered]);
    
    return (
      <div className="flex flex-col items-center my-4">
        <div ref={containerRef} className="g-recaptcha" />
        {!isScriptLoaded && (
          <div className="text-sm text-gray-500 mt-2">
            Loading reCAPTCHA...
          </div>
        )}
        {isScriptLoaded && !isRendered && (
          <div className="text-sm text-gray-500 mt-2">
            Initializing reCAPTCHA...
          </div>
        )}
      </div>
    );
  }
);

// Add display name for debugging
ReCaptcha.displayName = 'ReCaptcha';

// Add grecaptcha to Window interface
declare global {
  interface Window {
    grecaptcha: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
    };
    onReCaptchaLoad?: () => void;
  }
} 