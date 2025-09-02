import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { googleAuthService } from '@/services/googleAuthService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  mode?: 'login' | 'register';
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = 'login',
  onSuccess,
  onError,
  disabled = false
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        // Replace with your actual Google Client ID
        const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.googleusercontent.com';
        
        await googleAuthService.initialize({
          clientId: GOOGLE_CLIENT_ID
        });

        setIsInitialized(true);

        // Render the Google button
        if (buttonRef.current) {
          googleAuthService.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: mode === 'login' ? 'signin_with' : 'continue_with',
            logo_alignment: 'left',
          });
        }
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        onError?.(error);
      }
    };

    initializeGoogleAuth();

    // Listen for Google auth success
    const handleGoogleAuthSuccess = async (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsLoading(true);
      try {
        const { userInfo, credential } = customEvent.detail;
        
        // Send credential to backend for verification and user creation/login
        const response = await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            credential,
            mode // 'login' or 'register'
          }),
        });

        if (!response.ok) {
          throw new Error('Google authentication failed');
        }

        const authData = await response.json();
        
        // Store token and user data
        localStorage.setItem('authToken', authData.token);
        localStorage.setItem('user', JSON.stringify(authData.user));
        
        onSuccess?.(authData);
      } catch (error) {
        console.error('Google auth error:', error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('googleAuthSuccess', handleGoogleAuthSuccess);

    return () => {
      window.removeEventListener('googleAuthSuccess', handleGoogleAuthSuccess);
    };
  }, [mode, onSuccess, onError]);

  const handleFallbackClick = () => {
    if (!isInitialized) {
      console.error('Google Auth not initialized');
      return;
    }
    
    googleAuthService.prompt();
  };

  if (!isInitialized) {
    return (
      <Button variant="outline" disabled className="w-full">
        <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        Loading Google Auth...
      </Button>
    );
  }

  return (
    <div className="relative">
      {/* Google's rendered button */}
      <div 
        ref={buttonRef}
        style={{ display: isLoading ? 'none' : 'block' }}
        className="w-full"
      />
      
      {/* Loading state overlay */}
      {isLoading && (
        <Button variant="outline" disabled className="w-full">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Authenticating...
        </Button>
      )}
      
      {/* Fallback button if Google button doesn't render */}
      <Button
        variant="outline"
        onClick={handleFallbackClick}
        disabled={disabled || isLoading}
        className="w-full mt-2"
        style={{ display: 'none' }}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>
    </div>
  );
};

export default GoogleAuthButton;
