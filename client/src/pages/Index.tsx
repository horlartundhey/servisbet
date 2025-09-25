
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import BusinessGrid from '../components/BusinessGrid';
import ReviewSlider from '../components/ReviewSlider';
import { businessService, Business as ApiBusiness } from '../services/businessService';
import { reviewService, Review as ApiReview } from '../services/reviewService';

// Transform functions for interface compatibility
const transformBusiness = (apiBusiness: ApiBusiness) => ({
  id: apiBusiness._id,
  name: apiBusiness.name,
  category: apiBusiness.category,
  rating: apiBusiness.averageRating || 0,
  reviewCount: apiBusiness.totalReviews || 0,
  image: apiBusiness.cover || apiBusiness.images?.[1] || apiBusiness.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&h=300&fit=crop',
  description: apiBusiness.description,
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
      respondedAt: new Date(apiReview.response.respondedAt || apiReview.createdAt).toLocaleDateString()
    } : undefined,
  };
};

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState<ReturnType<typeof transformBusiness>[]>([]);
  const [reviews, setReviews] = useState<ReturnType<typeof transformReview>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading businesses...');
        // Load featured businesses (top rated, limited)
        const businessResult = await businessService.getBusinesses({ 
          limit: 6,
          page: 1 
        });
        console.log('Business result:', businessResult);
        const transformedBusinesses = businessResult.businesses.map(transformBusiness);
        console.log('Transformed businesses:', transformedBusinesses);
        setBusinesses(transformedBusinesses);

        console.log('Loading recent reviews...');
        // Load recent reviews across all businesses
        const reviewResult = await reviewService.getReviews({ 
          limit: 10,
          page: 1,
          sortBy: 'date',
          sortOrder: 'desc'
        });
        console.log('Review result:', reviewResult);
        const transformedReviews = reviewResult.reviews.map(transformReview);
        console.log('Transformed reviews:', transformedReviews);
        setReviews(transformedReviews);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Navigate to search results with the query
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleBusinessClick = (businessId: string) => {
    navigate(`/business/${businessId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection onSearch={handleSearch} />
      
      {/* Recent Reviews Section - Moved to top */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Community is Saying
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real reviews from verified customers sharing their experiences
            </p>
          </div>
          
          <ReviewSlider reviews={reviews} />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Popular Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find businesses across different industries
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Restaurants', icon: '🍽️', count: '2.3K+' },
              { name: 'Beauty & Spa', icon: '💄', count: '1.8K+' },
              { name: 'Technology', icon: '💻', count: '950+' },
              { name: 'Healthcare', icon: '🏥', count: '1.2K+' },
              { name: 'Automotive', icon: '🚗', count: '780+' },
              { name: 'Home Services', icon: '🏠', count: '1.5K+' },
            ].map((category) => (
              <div
                key={category.name}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {category.count} businesses
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Businesses */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Businesses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore top-rated businesses with authentic reviews and beautiful imagery
            </p>
          </div>
          <BusinessGrid businesses={businesses} onBusinessClick={handleBusinessClick} />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Servisbeta Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to find trusted businesses and share your experiences
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                1. Search & Discover
              </h3>
              <p className="text-gray-600">
                Search for businesses by name, category, or location. Browse reviews and ratings from verified customers.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                2. Read Reviews
              </h3>
              <p className="text-gray-600">
                Make informed decisions based on authentic reviews from real customers who've experienced the service.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                3. Share Experience
              </h3>
              <p className="text-gray-600">
                Help others by sharing your honest feedback. Your review helps businesses improve and others decide.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust & Safety Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Trusted by Millions Worldwide
            </h2>
            <p className="text-xl mb-12 opacity-90">
              Join our community of verified reviewers and help others make informed decisions
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">4.8★</div>
                <div className="opacity-80">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">99%</div>
                <div className="opacity-80">Verified Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="opacity-80">Customer Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">1M+</div>
                <div className="opacity-80">Happy Users</div>
              </div>
            </div>

            <div className="mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold mb-3">Why Trust Servisbeta?</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-300">✓</span>
                    <span>Email-verified reviews only</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-300">✓</span>
                    <span>AI-powered spam detection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-300">✓</span>
                    <span>Business owner responses</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-green-300">✓</span>
                    <span>Community moderation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-white border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Find Your Next Favorite Business?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of customers who trust Servisbeta to make better decisions
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => navigate('/businesses')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Explore All Businesses
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
