// Google OAuth Service using Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

class GoogleAuthService {
  private clientId: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.loadGoogleScript();
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      
      document.head.appendChild(script);
    });
  }

  public async initialize(config: GoogleAuthConfig): Promise<void> {
    await this.loadGoogleScript();
    
    this.clientId = config.clientId;
    
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
      });
      
      this.isInitialized = true;
    }
  }

  private handleCredentialResponse(response: GoogleAuthResponse): void {
    // Decode the JWT token to get user info
    const userInfo = this.parseJwt(response.credential);
    
    // Dispatch custom event with user data
    const event = new CustomEvent('googleAuthSuccess', {
      detail: { userInfo, credential: response.credential }
    });
    window.dispatchEvent(event);
  }

  private parseJwt(token: string): GoogleUser {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      throw new Error('Invalid token');
    }
  }

  public renderButton(element: HTMLElement, options: any = {}): void {
    if (!this.isInitialized || !window.google) {
      console.error('Google Auth not initialized');
      return;
    }

    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      shape: 'rectangular',
      text: 'continue_with',
      logo_alignment: 'left',
    };

    window.google.accounts.id.renderButton(element, { ...defaultOptions, ...options });
  }

  public prompt(): void {
    if (!this.isInitialized || !window.google) {
      console.error('Google Auth not initialized');
      return;
    }

    window.google.accounts.id.prompt();
  }

  public disableAutoSelect(): void {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  // Method to send credential to backend for verification
  public async verifyWithBackend(credential: string): Promise<any> {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        throw new Error('Backend verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Backend verification error:', error);
      throw error;
    }
  }
}

export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
