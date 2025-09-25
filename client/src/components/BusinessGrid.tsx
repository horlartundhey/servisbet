
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          {...business}
          onClick={handleBusinessClick}
        />
      ))}
    </div>
  );
};

export default BusinessGrid;
