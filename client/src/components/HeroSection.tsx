
import React from 'react';
import SearchBar, { SearchFilters } from './SearchBar';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const handleSearch = (query: string, filters?: SearchFilters) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.location) params.set('location', filters.location);
    if (filters?.rating) params.set('rating', filters.rating.toString());
    if (filters?.priceRange) params.set('priceRange', filters.priceRange);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.openNow) params.set('openNow', 'true');

    window.location.href = `/search?${params.toString()}`;
  };
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-white to-primary/10 py-20">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-primary"> Business</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Discover trusted businesses through authentic reviews and stunning visuals. 
            See what real customers experienced before you decide.
          </p>
          
          <div className="flex justify-center mb-12">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">500K+</div>
              <div className="text-gray-600">Verified Reviews</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-gray-600">Trusted Businesses</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-gray-600">Photo Reviews</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
