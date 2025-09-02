
import React from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessCard from './BusinessCard';

interface Business {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
}

interface BusinessGridProps {
  businesses: Business[];
  onBusinessClick?: (id: string) => void;
}

const BusinessGrid: React.FC<BusinessGridProps> = ({ businesses, onBusinessClick }) => {
  const navigate = useNavigate();

  const handleBusinessClick = (id: string) => {
    if (onBusinessClick) {
      onBusinessClick(id);
    }
    navigate(`/business/${id}`);
  };

  return (
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              {...business}
              onClick={handleBusinessClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BusinessGrid;
