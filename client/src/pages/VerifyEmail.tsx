import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Home, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reviewService } from '@/services/reviewService';
import authService from '@/services/authService';

const VerifyEmail = () => {
  const { token: urlToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get token from URL parameter or query parameter
  const token = urlToken || searchParams.get('token');
  const reviewId = searchParams.get('reviewId');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState<any>(null);
  const [isUserVerification, setIsUserVerification] = useState<boolean>(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          throw new Error('Invalid verification link - no token provided');
        }

        // If reviewId exists, treat as review verification, else as user verification
        const isUser = !reviewId;
        setIsUserVerification(isUser);

        if (isUser) {
          // User account verification
          console.log('🔍 Verifying user email token:', token);
          const response = await authService.verifyEmail(token);
          console.log('✅ User verification response:', response);
          setSuccess(response.success);
          setError(response.success ? '' : response.message || 'Email verification failed.');
        } else {
          // Anonymous review verification
          console.log('🔍 Verifying review token:', token);
          const response = await reviewService.verifyAnonymousEmail(token);
          console.log('✅ Review verification response:', response);
          setSuccess(true);
          setReviewData(response.data || response);
        }
      } catch (error: any) {
        console.error('❌ Email verification failed:', error);
        setError(error.response?.data?.message || error.message || 'Email verification failed. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, reviewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
          <p className="text-gray-600">Please wait while we verify your review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {success ? 'Email Verified!' : 'Verification Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              {success ? (
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    {isUserVerification ? 'Account Verified Successfully!' : 'Review Published Successfully!'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isUserVerification
                      ? 'Thank you for verifying your email. Your account is now active.'
                      : 'Thank you for verifying your email. Your review has been published and is now live.'}
                  </p>
                  {/* Show review details if review verification */}
                  {!isUserVerification && reviewData && (
                    <Alert className="mb-4">
                      <AlertDescription>
                        <div className="text-left">
                          <strong>Review Details:</strong>
                          <ul className="mt-2 space-y-1 text-sm">
                            <li>• Business: {reviewData.business?.name}</li>
                            <li>• Rating: {reviewData.rating}/5 stars</li>
                            <li>• Reviewer: {reviewData.reviewerName}</li>
                            <li>• Published: {new Date().toLocaleDateString()}</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  <p className="text-sm text-gray-500 mb-6">
                    A confirmation email has been sent to your email address.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Verification Failed
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error}
                  </p>
                  <Alert className="mb-4" variant="destructive">
                    <AlertDescription>
                      <strong>Common reasons for failure:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• The verification link has expired</li>
                        <li>• The link has already been used</li>
                        <li>• The review or account has already been verified</li>
                        <li>• Invalid or corrupted verification token</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {/* For review verification, show business link. For user, just home. */}
              {success && !isUserVerification && reviewData?.business?._id && (
                <Button
                  onClick={() => navigate(`/business/${reviewData.business._id}`)}
                  className="w-full"
                >
                  View Business Page
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              {!success && (
                <div className="text-center">
                  <button
                    onClick={() => navigate(-1)}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    <ArrowLeft className="w-3 h-3 inline mr-1" />
                    Go Back
                  </button>
                </div>
              )}
            </div>
            {success && (
              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-gray-500">
                  Thank you for helping other customers make informed decisions!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;