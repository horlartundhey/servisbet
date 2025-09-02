import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/services/api';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setVerificationState('error');
      setMessage('Invalid verification link. Token is missing.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.get(`/auth/verify-email/${verificationToken}`);
      setVerificationState('success');
      setMessage(response.data.message || 'Email verified successfully!');
    } catch (error: any) {
      setVerificationState('error');
      setMessage(error.response?.data?.message || 'Email verification failed. The token may be invalid or expired.');
    }
  };

  const handleContinue = () => {
    navigate('/auth');
  };

  const handleResendEmail = () => {
    navigate('/auth', { state: { showResendVerification: true } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">ServisbetA</h1>
          <p className="text-muted-foreground">Email Verification</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              {verificationState === 'loading' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying Email...</span>
                </>
              )}
              {verificationState === 'success' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Email Verified!</span>
                </>
              )}
              {verificationState === 'error' && (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Verification Failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={verificationState === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>

            {verificationState === 'success' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your email has been successfully verified. You can now access all features of ServisbetA.
                  </p>
                </div>
                <Button onClick={handleContinue} className="w-full">
                  Continue to Login
                </Button>
              </div>
            )}

            {verificationState === 'error' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Don't worry! You can request a new verification email.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={handleResendEmail} className="w-full">
                    Resend Verification Email
                  </Button>
                  <Button variant="outline" onClick={handleContinue} className="w-full">
                    Back to Login
                  </Button>
                </div>
              </div>
            )}

            {verificationState === 'loading' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Button variant="link" className="text-sm p-0 h-auto">
              Contact Support
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
