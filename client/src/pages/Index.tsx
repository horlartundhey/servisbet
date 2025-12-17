import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, Shield, Users, CheckCircle, ArrowRight, Quote, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BusinessGrid from '../components/BusinessGrid';
import ReviewSlider from '../components/ReviewSlider';
import { businessService, Business as ApiBusiness } from '../services/businessService';
import { reviewService, Review as ApiReview } from '../services/reviewService';

// Transform functions
const transformBusiness = (apiBusiness: ApiBusiness) => ({
  id: apiBusiness._id,
  slug: apiBusiness.slug,
  name: apiBusiness.name,
  category: apiBusiness.category,
  rating: apiBusiness.averageRating || 0,
  reviewCount: apiBusiness.totalReviews || 0,
  image: apiBusiness.cover || apiBusiness.images?.[1] || apiBusiness.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&h=300&fit=crop',
  description: apiBusiness.description,
});

const transformReview = (apiReview: ApiReview) => {
  const customerName = apiReview.user 
    ? `${apiReview.user.firstName} ${apiReview.user.lastName}`
    : apiReview.reviewerName || 'Anonymous User';
  
  let customerAvatar;
  if (apiReview.user?.avatar) {
    customerAvatar = apiReview.user.avatar;
  } else if (apiReview.user) {
    customerAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=3b82f6&color=fff&size=100`;
  } else {
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
  const [stats, setStats] = useState({
    totalReviews: '50,000+',
    businesses: '1,000+',
    averageRating: '4.8',
    responseRate: '95%'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load top 3 businesses
      const businessResult = await businessService.getBusinesses({ 
        limit: 3,
        page: 1,
        sortBy: 'rating'
      });
      setBusinesses(businessResult.businesses.map(transformBusiness));

      // Load latest reviews
      const reviewResult = await reviewService.getReviews({ 
        limit: 12,
        page: 1,
        sortBy: 'date',
        sortOrder: 'desc'
      });
      setReviews(reviewResult.reviews.map(transformReview));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessClick = (businessId: string, business?: any) => {
    const identifier = business?.slug || businessId;
    navigate(`/business/${identifier}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">Trusted by thousands of businesses</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Real Reviews.<br />Real Trust.
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
              Discover authentic reviews from real customers. Help others make informed decisions with your feedback.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for businesses, services, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-xl text-gray-900"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-8"
                  size="lg"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-6"
                onClick={() => navigate('/digital-services')}
              >
                Browse Businesses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                onClick={() => navigate('/auth')}
              >
                Write a Review
              </Button>
            </div> */}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stats.totalReviews}</div>
              <div className="text-muted-foreground font-medium">Reviews Posted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stats.businesses}</div>
              <div className="text-muted-foreground font-medium">Businesses Listed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stats.averageRating}</div>
              <div className="text-muted-foreground font-medium">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stats.responseRate}</div>
              <div className="text-muted-foreground font-medium">Response Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, transparent, and powerful review system
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Find Businesses</h3>
                <p className="text-muted-foreground">
                  Search and discover verified businesses in your area with authentic reviews
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Share Experience</h3>
                <p className="text-muted-foreground">
                  Write detailed reviews and help others make informed decisions
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Build Trust</h3>
                <p className="text-muted-foreground">
                  Help businesses improve and build transparent relationships
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Latest Reviews */}
      {reviews.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Latest Reviews
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See what our community is saying
              </p>
            </div>
            
            <ReviewSlider reviews={reviews.slice(0, 8)} />
            
            <div className="text-center mt-10">
              <Button 
                size="lg"
                onClick={() => navigate('/digital-services')}
                className="px-8"
              >
                View All Reviews
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Top Rated Businesses */}
      {businesses.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Top Rated Businesses
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover businesses with the best ratings
              </p>
            </div>
            
            <BusinessGrid businesses={businesses} onBusinessClick={handleBusinessClick} />
            
            <div className="text-center mt-10">
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/businesses')}
                className="px-8"
              >
                See All Businesses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Why Servisbeta?
              </h2>
              <p className="text-xl text-white/80">
                The most trusted review platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Verified Reviews</h3>
                  <p className="text-white/70">
                    All reviews are from real customers who have actually used the services
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Transparent Platform</h3>
                  <p className="text-white/70">
                    No fake reviews, no manipulation - just honest feedback
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Community Driven</h3>
                  <p className="text-white/70">
                    Built by users, for users to help everyone make better choices
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Business Engagement</h3>
                  <p className="text-white/70">
                    Businesses can respond and show they care about customer feedback
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Quote className="h-16 w-16 text-primary mx-auto mb-6 opacity-20" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Share Your Experience?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Your review can help thousands of people make better decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-10 py-6 text-lg" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg" onClick={() => navigate('/digital-services')}>
                Explore Businesses
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
