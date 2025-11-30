import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Upload, X, Send, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { businessService } from '@/services/businessService';
import { reviewService } from '@/services/reviewService';

interface Business {
  _id: string;
  name: string;
  category: string;
  averageRating?: number;
  totalReviews?: number;
  logo?: string;
}

const WriteReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
    reviewerName: '',
    reviewerEmail: '',
    isAnonymous: true, // Default to anonymous, user can opt for public
    images: [] as File[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null); // Track submission to prevent duplicates

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You are back online. You can now submit reviews."
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Connection Lost", 
        description: "Please check your internet connection."
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

    // Fetch business details
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        if (!id) {
          console.log('WriteReview: No business ID provided');
          return;
        }
        
        console.log('WriteReview: Fetching business with ID:', id);
        const response = await businessService.getBusinessById(id);
        console.log('WriteReview: API Response:', response);
        setBusiness(response);
      } catch (error) {
        console.error('WriteReview: Error fetching business:', error);
        console.error('WriteReview: Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL
          }
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load business details. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [id, toast]);

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle star rating
  const handleRatingClick = (rating: number) => {
    handleInputChange('rating', rating);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "Too many images",
        description: "You can upload maximum 5 images per review."
      });
      return;
    }
    
    handleInputChange('images', [...formData.images, ...files]);
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    handleInputChange('images', newImages);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.rating) newErrors.rating = 'Please select a rating';
    if (!formData.content.trim()) newErrors.content = 'Please write your review';
    if (!formData.reviewerName.trim()) newErrors.reviewerName = 'Please enter your name';
    if (!formData.reviewerEmail.trim()) newErrors.reviewerEmail = 'Please enter your email address';
    
    // Validate email format
    if (formData.reviewerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reviewerEmail)) {
      newErrors.reviewerEmail = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit review with retry mechanism
  const handleSubmit = async (e: React.FormEvent, isRetry = false) => {
    e.preventDefault();
    
    // Check online status
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your internet connection and try again."
      });
      return;
    }

    // Prevent duplicate submissions (unless it's a retry)
    if (submitting && !isRetry) {
      console.log('Submission already in progress, ignoring duplicate request');
      return;
    }
    
    console.log('=== Review Submission Started ===');
    console.log('Form Data:', formData);
    console.log('Business ID:', id);
    console.log('Is Retry:', isRetry, 'Retry Count:', retryCount);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast({
        variant: "destructive",
        title: "Please fix the errors",
        description: "Check the form for validation errors."
      });
      return;
    }

    setSubmitting(true);
    console.log('Setting submitting state to true');

    try {
      console.log('Creating FormData for submission...');
      
      // Generate unique submission ID to track this attempt
      const currentSubmissionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSubmissionId(currentSubmissionId);
      console.log('Submission ID:', currentSubmissionId);
      
      // Create form data for file upload
      const submitData = new FormData();
      submitData.append('business', id!);
      submitData.append('rating', formData.rating.toString());
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('reviewerName', formData.reviewerName);
      submitData.append('reviewerEmail', formData.reviewerEmail);
      submitData.append('isAnonymous', formData.isAnonymous.toString());
      submitData.append('submissionId', currentSubmissionId); // Add submission tracking
      
      console.log('Form data prepared:', {
        business: id,
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
        reviewerName: formData.reviewerName,
        reviewerEmail: formData.reviewerEmail,
        imageCount: formData.images.length
      });
      
      // Add images
      formData.images.forEach((image, index) => {
        console.log(`Adding image ${index + 1}:`, image.name);
        submitData.append('photos', image);
      });

      console.log('Calling reviewService.createAnonymousReview...');
      const response = await reviewService.createAnonymousReview(submitData);
      console.log('Review submission response:', response);
      
      setVerificationData(response.data);
      setShowVerification(true);
      
      // Different messages for anonymous vs public reviews
      if (formData.isAnonymous) {
        toast({
          title: "Anonymous Review Submitted!",
          description: "Please check your email to verify and publish your review."
        });
      } else {
        toast({
          title: "Public Review Submitted!",
          description: response.data.verificationRequired ? 
            "Please check your email to verify your review." : 
            "Your review has been published and is now live!"
        });
      }
      
      console.log('=== Review Submission Completed Successfully ===');
      
    } catch (error: any) {
      console.error('=== Review Submission Error ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Network error:', error.message);
      
      // Determine error type and show appropriate message
      let errorTitle = "Submission Failed";
      let errorDescription = "Failed to submit review. Please try again.";
      
      if (error.status === 409) {
        // Duplicate review error
        errorTitle = "Duplicate Review Detected";
        errorDescription = error.message || "You have already reviewed this business. Please wait 24 hours between reviews.";
      } else if (error.status === 403) {
        // Permission error (like business owner trying to review own business)
        errorTitle = "Not Allowed";
        errorDescription = error.message || "You are not allowed to perform this action.";
      } else if (error.status === 429) {
        // Rate limiting
        errorTitle = "Too Many Requests";
        errorDescription = "Please wait a moment before submitting another review.";
      } else if (error.message.includes('Network error') || error.message.includes('timeout')) {
        // Network issues
        errorTitle = "Connection Problem";
        errorDescription = "Please check your internet connection and try again. Your review has not been saved.";
        setRetryCount(prev => prev + 1); // Enable retry button
      } else if (error.status >= 500) {
        // Server errors
        errorTitle = "Server Error";
        errorDescription = "Our servers are having issues. Please try again in a few moments.";
      } else {
        // Use error message from API or generic message
        errorDescription = error.message || error.response?.data?.message || errorDescription;
      }
      
      // Show error message
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorDescription
      });
      
      // Reset verification state on error to prevent confusion
      setShowVerification(false);
      setVerificationData(null);
    } finally {
      console.log('Setting submitting state to false');
      setSubmitting(false);
    }
  };

  // Retry submission function
  const handleRetry = () => {
    const syntheticEvent = {
      preventDefault: () => {}
    } as React.FormEvent;
    handleSubmit(syntheticEvent, true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
          <p className="text-gray-600 mb-4">The business you're trying to review could not be found.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (showVerification) {
    return (
      <EmailVerification
        business={business}
        verificationData={verificationData}
        onBack={() => setShowVerification(false)}
        onSuccess={() => navigate(`/business/${id}`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-4">
            {business.logo && (
              <img
                src={business.logo}
                alt={business.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{business.name}</h1>
              <Badge variant="secondary" className="mt-1">
                {business.category}
              </Badge>
              {business.averageRating && (
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(business.averageRating!)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {business.averageRating.toFixed(1)} ({business.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
            <Alert>
              <AlertDescription>
                Your review will help other customers make informed decisions. 
                No account registration required - just verify your email address.
              </AlertDescription>
            </Alert>

            {/* Connection Status Indicator */}
            {!isOnline && (
              <Alert variant="destructive" className="mt-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  <AlertDescription>
                    No internet connection. Please check your connection to submit your review.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <Label className="text-base font-medium">Rating *</Label>
                <div className="flex items-center space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= formData.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                  {formData.rating > 0 && (
                    <span className="ml-2 text-sm font-medium">
                      {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {errors.rating && (
                  <p className="text-sm text-red-600 mt-1">{errors.rating}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Review Title (Optional)</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Summarize your experience..."
                  maxLength={100}
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Your Review *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Share your experience with this business. What did you like or dislike?"
                  rows={5}
                  maxLength={2000}
                />
                <div className="flex justify-between mt-1">
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">
                    {formData.content.length}/2000
                  </p>
                </div>
              </div>

              {/* Photos */}
              <div>
                <Label>Photos (Optional)</Label>
                <p className="text-sm text-gray-600 mb-2">
                  Add up to 5 photos to support your review
                </p>
                
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.images.length < 5 && (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                    >
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">
                          Click to upload photos
                        </p>
                      </div>
                    </Label>
                  </div>
                )}
              </div>

              {/* Reviewer Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reviewerName">Your Name *</Label>
                    <Input
                      id="reviewerName"
                      value={formData.reviewerName}
                      onChange={(e) => handleInputChange('reviewerName', e.target.value)}
                      placeholder="Enter your name"
                      maxLength={50}
                    />
                    {errors.reviewerName && (
                      <p className="text-sm text-red-600 mt-1">{errors.reviewerName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reviewerEmail">Your Email *</Label>
                    <Input
                      id="reviewerEmail"
                      value={formData.reviewerEmail}
                      onChange={(e) => handleInputChange('reviewerEmail', e.target.value)}
                      placeholder="your@email.com"
                      type="email"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Used for verification and review updates
                    </p>
                    {errors.reviewerEmail && (
                      <p className="text-sm text-red-600 mt-1">{errors.reviewerEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Privacy Options */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      checked={formData.isAnonymous}
                      onChange={() => handleInputChange('isAnonymous', true)}
                      className="mt-1 w-4 h-4 text-[#ff1550] border-gray-300 focus:ring-[#ff1550]"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Anonymous Review</div>
                      <div className="text-sm text-gray-600">Your name will not be displayed publicly with this review</div>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!formData.isAnonymous}
                      onChange={() => handleInputChange('isAnonymous', false)}
                      className="mt-1 w-4 h-4 text-[#ff1550] border-gray-300 focus:ring-[#ff1550]"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Public Review</div>
                      <div className="text-sm text-gray-600">Your name will be displayed publicly with this review</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Connection Status */}
              {!isOnline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                    <p className="text-yellow-800 text-sm">
                      No internet connection. Please check your connection to submit your review.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  disabled={submitting || !isOnline}
                  className="w-full md:w-auto"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
                
                {/* Retry button for failed submissions */}
                {retryCount > 0 && !submitting && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetry}
                    disabled={!isOnline}
                    className="ml-3"
                  >
                    <div className="w-4 h-4 mr-2">🔄</div>
                    Retry ({retryCount}/3)
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Email Verification Component
interface EmailVerificationProps {
  business: Business;
  verificationData: any;
  onBack: () => void;
  onSuccess: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  business,
  verificationData,
  onBack,
  onSuccess
}) => {
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    setResending(true);

    try {
      await reviewService.resendEmailVerification({
        reviewId: verificationData.reviewId
      });

      toast({
        title: "Email Sent",
        description: "A new verification email has been sent to your inbox."
      });
    } catch (error: any) {
      console.error('Failed to resend email:', error);
      toast({
        variant: "destructive",
        title: "Failed to Resend",
        description: error.response?.data?.message || "Could not resend verification email."
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verification Email Sent!</h3>
              <p className="text-gray-600 mb-4">
                We've sent a verification link to{' '}
                <span className="font-medium">{verificationData.reviewerEmail}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Please check your email and click the verification link to publish your review for{' '}
                <span className="font-medium">{business.name}</span>.
              </p>
            </div>

            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>What happens next:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Your review will be published immediately</li>
                    <li>You'll receive a confirmation email</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">Didn't receive the email?</p>
                
                <Button
                  onClick={handleResendEmail}
                  disabled={resending}
                  variant="outline"
                  className="w-full"
                >
                  {resending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
                
                <div>
                  <button
                    onClick={onBack}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Back to review form
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    onClick={onSuccess}
                    className="text-sm text-primary hover:underline"
                  >
                    Continue to {business.name}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WriteReview;
