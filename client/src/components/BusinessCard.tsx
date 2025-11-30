
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import StarRating from './StarRating';

interface BusinessCardProps {
  id: string;
  slug?: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  onClick: (id: string, business?: any) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  id,
  slug,
  name,
  category,
  rating,
  reviewCount,
  image,
  description,
  onClick
}) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
      onClick={() => onClick(id, { id, slug, name })}
    >
      <CardContent className="p-0">
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <StarRating rating={rating} size={16} showNumber={false} />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                {name}
              </h3>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {category}
              </p>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>
          
          <div className="flex items-center justify-between">
            <StarRating rating={rating} size={18} />
            <span className="text-sm text-gray-500">
              {reviewCount.toLocaleString()} reviews
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessCard;
