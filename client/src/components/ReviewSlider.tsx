import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Play, Pause } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Review {
  id: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  images: string[];
  businessResponse?: {
    text: string;
    respondedAt: string;
  };
  businessName?: string;
  businessCategory?: string;
}

interface ReviewSliderProps {
  reviews: Review[];
}

const ReviewSlider: React.FC<ReviewSliderProps> = ({ reviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && reviews.length > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 4000); // Change slide every 4 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, reviews.length, currentIndex]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && reviews.length > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, 4000);
    }
  };

  const nextSlide = () => {
    if (isTransitioning || reviews.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const prevSlide = () => {
    if (isTransitioning || reviews.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    );
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || reviews.length === 0 || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No recent reviews available</p>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Main Slider Container */}
      <div 
        ref={sliderRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-xl border border-gray-100"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Reviews Container */}
        <div 
          className="flex transition-all duration-500 ease-out"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            opacity: isTransitioning ? 0.9 : 1
          }}
        >
          {reviews.map((review, index) => (
            <div key={review.id} className="w-full flex-shrink-0">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
                    {/* Avatar */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                      <div className="relative">
                        <img
                          src={review.customerAvatar}
                          alt={review.customerName}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-blue-100 shadow-lg"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {review.rating}
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      {/* Header */}
                      <div className="mb-4">
                        <div className="flex items-center justify-center md:justify-start space-x-1 mb-2">
                          {renderStars(review.rating)}
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                          {review.customerName}
                        </h3>
                        <div className="flex items-center justify-center md:justify-start space-x-3">
                          <span className="text-sm text-gray-500">
                            {review.date}
                          </span>
                          {review.businessCategory && (
                            <Badge variant="outline" className="text-xs">
                              {review.businessCategory}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Review Title */}
                      {review.title && (
                        <h4 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 leading-tight">
                          "{review.title}"
                        </h4>
                      )}

                      {/* Review Content */}
                      <blockquote className="text-gray-700 leading-relaxed mb-6 text-base md:text-lg italic">
                        "{review.content}"
                      </blockquote>

                      {/* Business Name */}
                      {review.businessName && (
                        <p className="text-sm text-gray-500 font-medium">
                          Review for <span className="text-blue-600 font-semibold">{review.businessName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {reviews.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white shadow-lg rounded-full w-12 h-12 p-0 transition-all duration-200 hover:scale-105"
              onClick={prevSlide}
              disabled={isTransitioning}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white shadow-lg rounded-full w-12 h-12 p-0 transition-all duration-200 hover:scale-105"
              onClick={nextSlide}
              disabled={isTransitioning}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Progress Bar */}
        {reviews.length > 1 && isPlaying && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 transition-all duration-100 ease-linear"
              style={{
                width: `${((currentIndex + 1) / reviews.length) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {reviews.length > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mt-8">
          {/* Dots Indicator */}
          <div className="flex items-center space-x-3">
            {reviews.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-blue-600 scale-125 shadow-md'
                    : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                }`}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
              />
            ))}
          </div>

          {/* Play/Pause Button */}
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Auto-play
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume Auto-play
              </>
            )}
          </Button>
        </div>
      )}

      {/* Review Counter */}
      {reviews.length > 1 && (
        <div className="text-center mt-4">
          <span className="text-sm text-gray-500">
            {currentIndex + 1} of {reviews.length} reviews
          </span>
        </div>
      )}
    </div>
  );
};

export default ReviewSlider;