
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import StarRating from './StarRating';

interface ReviewCardProps {
  id: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  images?: string[];
  businessResponse?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  customerName,
  customerAvatar,
  rating,
  date,
  title,
  content,
  images = [],
  businessResponse
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={customerAvatar}
            alt={customerName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{customerName}</h4>
              <span className="text-sm text-gray-500">{date}</span>
            </div>
            <StarRating rating={rating} size={16} />
          </div>
        </div>
        
        <div className="mb-4">
          <h5 className="font-semibold text-gray-900 mb-2">{title}</h5>
          <p className="text-gray-700 leading-relaxed">{content}</p>
        </div>
        
        {images.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {images.slice(0, 6).map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {businessResponse && (
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary">
            <div className="flex items-center mb-2">
              <span className="font-medium text-primary text-sm">Business Response</span>
            </div>
            <p className="text-gray-700 text-sm">{businessResponse}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
