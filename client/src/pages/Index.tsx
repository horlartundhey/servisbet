
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';
import ProcessSection from '../components/ProcessSection';
import BusinessGrid from '../components/BusinessGrid';
import ReviewSlider from '../components/ReviewSlider';
import { businessService, Business as ApiBusiness } from '../services/businessService';
import { reviewService, Review as ApiReview } from '../services/reviewService';

// Transform functions for interface compatibility
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
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState<ReturnType<typeof transformBusiness>[]>([]);
  const [reviews, setReviews] = useState<ReturnType<typeof transformReview>[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle hash scrolling after content loads
  useEffect(() => {
    if (!loading && location.hash) {
      const id = location.hash.replace('#', '');
      const scrollToSection = () => {
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          return true;
        }
        return false;
      };

      // Try scrolling with multiple attempts
      setTimeout(() => {
        if (!scrollToSection()) {
          setTimeout(scrollToSection, 200);
        }
      }, 100);
    }
  }, [loading, location.hash]);

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

  const handleBusinessClick = (businessId: string, business?: any) => {
    const identifier = business?.slug || businessId;
    navigate(`/business/${identifier}`);
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
      {/* Hero Section - Agency Focused */}
      <HeroSection />
      
      {/* Services Section - Primary Focus */}
      <div id="services">
        <ServicesSection />
      </div>

      {/* Process Section - Show our methodology */}
      <div id="process">
        <ProcessSection />
      </div>

      {/* Client Success & Trust Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Delivering Results That Matter
            </h2>
            <p className="text-xl mb-12 text-gray-300">
              Our clients trust us to transform their digital presence and drive measurable growth
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">200+</div>
                <div className="text-gray-300">Projects Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-gray-300">Client Retention</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">50K+</div>
                <div className="text-gray-300">Reviews Managed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-gray-300">Support Available</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-3xl mx-auto border border-white/10">
              <h3 className="text-2xl font-semibold mb-6">What Sets Us Apart</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl flex-shrink-0">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">Data-Driven Strategy</h4>
                    <p className="text-sm text-gray-300">Every decision backed by analytics and insights</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl flex-shrink-0">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">Expert Team</h4>
                    <p className="text-sm text-gray-300">Certified designers, developers, and marketers</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl flex-shrink-0">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">Transparent Process</h4>
                    <p className="text-sm text-gray-300">Clear communication and regular progress updates</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400 text-xl flex-shrink-0">✓</span>
                  <div>
                    <h4 className="font-semibold mb-1">Integrated Platform</h4>
                    <p className="text-sm text-gray-300">Built-in review system to showcase your success</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Client Testimonials - Subtle Review Platform Integration */}
      {reviews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 block">
                Client Success Stories
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                What Our Clients Say
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Real feedback from businesses we've helped grow digitally
              </p>
            </div>
            <ReviewSlider reviews={reviews.slice(0, 6)} />
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/search')}
                className="text-primary hover:text-primary/80 font-semibold inline-flex items-center transition-colors"
              >
                Browse more verified reviews
                <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Client Projects - Using Business Data */}
      {businesses.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 block">
                Our Portfolio
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Featured Client Projects
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Businesses we've helped establish a strong digital presence
              </p>
            </div>
            <BusinessGrid businesses={businesses.slice(0, 6)} onBusinessClick={handleBusinessClick} />
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/businesses')}
                className="text-primary hover:text-primary/80 font-semibold inline-flex items-center transition-colors"
              >
                View all client projects
                <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Final Call to Action */}
      <section className="py-20 bg-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-10 text-white/90">
              Let's create something extraordinary together. Schedule a free consultation to discuss your digital goals.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/contact')}
                className="bg-white text-secondary hover:bg-gray-100 px-10 py-5 rounded-lg font-bold text-lg transition-all duration-300 shadow-xl hover:scale-105"
              >
                Schedule Free Consultation
              </button>
              <button 
                onClick={() => navigate('/portfolio')}
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-5 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105"
              >
                View Our Portfolio
              </button>
            </div>
            <p className="mt-8 text-sm text-white/80">
              Or <button onClick={() => navigate('/search')} className="underline hover:text-white transition-colors">browse our business directory</button> to see our review platform in action
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
