import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, Globe, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import { BusinessBreadcrumb } from '../components/Breadcrumb';
import { SEOManager } from '../utils/seo';
import { businessService, Business as ApiBusiness } from '../services/businessService';
import { reviewService, Review as ApiReview } from '../services/reviewService';

// Transform functions
const transformBusiness = (apiBusiness: ApiBusiness) => ({
  id: apiBusiness._id,
  name: apiBusiness.name,
  category: apiBusiness.category,
  rating: apiBusiness.averageRating || 0,
  reviewCount: apiBusiness.totalReviews || 0,
  image: apiBusiness.cover || apiBusiness.images?.[1] || apiBusiness.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
  logo: apiBusiness.logo || apiBusiness.images?.[0] || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
  images: apiBusiness.images || [],
  description: apiBusiness.description,
  phone: apiBusiness.phone,
  email: apiBusiness.email,
  website: apiBusiness.website,
  address: apiBusiness.address,
  businessHours: apiBusiness.businessHours || apiBusiness.hours,
  isVerified: apiBusiness.verificationStatus === 'approved',
  tags: apiBusiness.tags || [],
});

const transformReview = (apiReview: ApiReview) => {
  // Generate customer name
  const customerName = apiReview.user 
    ? `${apiReview.user.firstName} ${apiReview.user.lastName}`
    : apiReview.reviewerName || 'Anonymous User';
  
  // Generate avatar - use UI Avatars service for personalized avatars
  let customerAvatar;
  if (apiReview.user?.avatar) {
    // User has uploaded avatar
    customerAvatar = apiReview.user.avatar;
  } else if (apiReview.user) {
    // Authenticated user without avatar - blue background
    customerAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=3b82f6&color=fff&size=100`;
  } else {
    // Anonymous user - gray background
    customerAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=6b7280&color=fff&size=100`;
  }
  
  return {
    id: apiReview._id,
    customerName,
    customerAvatar,
    rating: apiReview.rating,
    date: new Date(apiReview.createdAt).toLocaleDateString(),
    title: apiReview.title,
    content: apiReview.content,
    images: apiReview.photos || [],
    businessResponse: apiReview.response ? {
      text: apiReview.response.content,
      respondedAt: apiReview.response.respondedAt,
      respondedBy: apiReview.response.respondedBy
    } : undefined,
  };
};

const BusinessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<ReturnType<typeof transformBusiness> | null>(null);
  const [reviews, setReviews] = useState<ReturnType<typeof transformReview>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinessDetail = async () => {
      if (!id) {
        console.log('❌ BusinessDetail: No ID provided');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 BusinessDetail: Loading business with ID:', id);

        // Load business details - try slug first, then ID
        let businessData;
        try {
          console.log('📡 BusinessDetail: Trying slug-based lookup first');
          businessData = await businessService.getBusinessBySlug(id);
          console.log('✅ BusinessDetail: Slug lookup successful');
        } catch (slugError) {
          console.log('📡 BusinessDetail: Slug lookup failed, trying ID-based lookup');
          console.log('📡 BusinessDetail: Making API call to businessService.getBusinessById');
          businessData = await businessService.getBusinessById(id);
          console.log('✅ BusinessDetail: ID lookup successful');
        }
        console.log('✅ BusinessDetail: API response received:', businessData);
        
        const transformedBusiness = transformBusiness(businessData);
        console.log('🔄 BusinessDetail: Transformed business data:', transformedBusiness);
        setBusiness(transformedBusiness);

        // Set SEO meta tags and structured data for business
        SEOManager.setBusinessPageMeta(transformedBusiness);

        // Load business reviews (with error handling) - use actual business _id, not slug
        try {
          console.log('📡 BusinessDetail: Loading reviews for business ID:', businessData._id);
          const reviewsResult = await reviewService.getBusinessReviews(businessData._id, { limit: 10, page: 1 });
          console.log('✅ BusinessDetail: Reviews loaded:', reviewsResult);
          
          const transformedReviews = reviewsResult.reviews.map(transformReview);
          console.log('🔄 BusinessDetail: Transformed reviews:', transformedReviews);
          setReviews(transformedReviews);
        } catch (reviewError) {
          console.warn('⚠️ BusinessDetail: Could not load reviews:', reviewError);
          setReviews([]); // Set empty reviews array if loading fails
        }

      } catch (error: any) {
        console.error('❌ BusinessDetail: Error loading business details:', error);
        console.error('❌ BusinessDetail: Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          config: error?.config
        });
        setError('Failed to load business details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBusinessDetail();
  }, [id]);

  const formatHours = (hours: any) => {
    if (!hours) return 'Hours not available';
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today];
    
    if (!todayHours) return 'Hours not available';
    
    if (todayHours.closed) {
      return 'Closed today';
    }
    
    return `Open today: ${todayHours.open} - ${todayHours.close}`;
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewService.markHelpful(reviewId);
      // Refresh the reviews to get updated counts
      const reviewsResult = await reviewService.getBusinessReviews(id!, { limit: 10, page: 1 });
      const transformedReviews = reviewsResult.reviews.map(transformReview);
      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
    }
  };

  const handleRemoveHelpful = async (reviewId: string) => {
    try {
      await reviewService.removeHelpful(reviewId);
      // Refresh the reviews to get updated counts
      const reviewsResult = await reviewService.getBusinessReviews(id!, { limit: 10, page: 1 });
      const transformedReviews = reviewsResult.reviews.map(transformReview);
      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error removing helpful mark:', error);
      throw error;
    }
  };

  const handleReportReview = (reviewId: string) => {
    // TODO: Implement review reporting
    console.log('Reporting review:', reviewId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The business you are looking for could not be found.'}</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 space-y-2">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to search
          </Link>
          <BusinessBreadcrumb business={business} />
        </div>
      </div>

      {/* Cover Image Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={business.image}
          alt={`${business.name} cover`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <div className="flex items-end gap-4">
              {/* Business Logo */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-4 border-white shadow-lg bg-white flex-shrink-0">
                <img
                  src={business.logo || business.image}
                  alt={`${business.name} logo`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-2xl md:text-4xl font-bold text-white truncate">{business.name}</h1>
                  {business.isVerified && (
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-4 flex-shrink-0">
                      Verified
                    </div>
                  )}
                </div>
                <p className="text-lg text-white/90 mb-2">{business.category}</p>
                <div className="flex items-center gap-4">
                  <StarRating rating={business.rating} size={20} />
                  <span className="text-lg font-medium text-white">{business.rating.toFixed(1)}</span>
                  <span className="text-white/80">({business.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Business Description */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About {business.name}</h2>
                <p className="text-gray-700 mb-6 leading-relaxed">{business.description}</p>
                    
                {/* Tags */}
                {business.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gallery Section */}
            {business.images && business.images.length > 2 && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Gallery</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {business.images.slice(2).map((image, index) => (
                      <div 
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={image}
                          alt={`${business.name} gallery image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Reviews ({business.reviewCount})</h2>
                  <Button
                    onClick={() => navigate(`/write-review/${business.id}`)}
                    className="flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Write a Review
                  </Button>
                </div>
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <ReviewCard 
                        key={review.id} 
                        {...review} 
                        onMarkHelpful={handleMarkHelpful}
                        onRemoveHelpful={handleRemoveHelpful}
                        onReport={handleReportReview}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Business Information</h3>
                <div className="space-y-4">
                  {business.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-gray-600">
                          {business.address.street && `${business.address.street}, `}
                          {business.address.city && `${business.address.city}, `}
                          {business.address.state}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-600">{business.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {business.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Website</p>
                        <a 
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {business.website}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Hours</p>
                      <p className="text-gray-600">{formatHours(business.businessHours)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => navigate(`/write-review/${business.id}`)}
                    className="w-full"
                  >
                    Write a Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/businesses')}
                    className="w-full"
                  >
                    View All Businesses
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
