import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VerifyReview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [reviewData, setReviewData] = useState<any>(null);

  useEffect(() => {
    const verifyReview = async () => {
      const token = searchParams.get('token');
      const reviewId = searchParams.get('reviewId');

      if (!token) {
        setStatus('error');
        setMessage('Missing verification token');
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'https://servisbeta-server.vercel.app/api'}/review/verify/${token}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Your review has been verified and published successfully!');
          setReviewData(data.data);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
        console.error('Review verification error:', error);
      }
    };

    verifyReview();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <h2 className="text-2xl font-bold mb-2">Verifying Your Review</h2>
            <p className="text-muted-foreground">Please wait while we verify your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2 text-green-600">Review Verified!</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            
            {reviewData && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm mb-1">
                  <span className="font-semibold">Reviewer:</span> {reviewData.reviewerName}
                </p>
                {reviewData.businessName && (
                  <p className="text-sm">
                    <span className="font-semibold">Business:</span> {reviewData.businessName}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/')}
                className="w-full bg-[#f91942] hover:bg-[#d91639]"
              >
                Go to Home
              </Button>
              {reviewData?.businessName && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/businesses')}
                  className="w-full"
                >
                  Browse Businesses
                </Button>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Possible reasons:</strong>
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside mt-2 text-left">
                <li>The verification link has expired</li>
                <li>The review has already been verified</li>
                <li>The verification token is invalid</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyReview;
