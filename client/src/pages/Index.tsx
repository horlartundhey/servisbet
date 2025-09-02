
import React, { useState } from 'react';
import HeroSection from '../components/HeroSection';
import BusinessGrid from '../components/BusinessGrid';
import ReviewCard from '../components/ReviewCard';
import { mockBusinesses, mockReviews } from '../data/mockData';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
    // In a real app, this would trigger an API call
  };

  const handleBusinessClick = (businessId: string) => {
    console.log('Business clicked:', businessId);
    // In a real app, this would navigate to the business detail page
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection onSearch={handleSearch} />
      
      {/* Featured Businesses */}
      <BusinessGrid businesses={mockBusinesses} onBusinessClick={handleBusinessClick} />
      
      {/* Recent Reviews Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recent Reviews
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what customers are saying about their experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {mockReviews.map((review) => (
              <ReviewCard key={review.id} {...review} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Trust Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Trusted by Millions
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join our community of verified reviewers and help others make informed decisions
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">4.8★</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">99%</div>
                <div className="text-gray-600">Verified Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">24/7</div>
                <div className="text-gray-600">Customer Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">100K+</div>
                <div className="text-gray-600">Daily Visitors</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
