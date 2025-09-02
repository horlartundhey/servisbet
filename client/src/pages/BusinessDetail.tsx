
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Phone, Globe, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import { mockBusinesses, mockReviews } from '../data/mockData';

const BusinessDetail = () => {
  const { id } = useParams();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Find the business (in a real app, this would be an API call)
  const business = mockBusinesses.find(b => b.id === id);
  
  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Business not found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to home</Link>
        </div>
      </div>
    );
  }

  // Mock additional business data
  const businessImages = [
    business.image,
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
  ];

  const businessInfo = {
    address: "123 Main Street, Downtown",
    phone: "(555) 123-4567",
    website: "www.example.com",
    hours: "Mon-Fri: 9AM-6PM, Sat-Sun: 10AM-4PM"
  };

  const businessReviews = mockReviews.filter((_, index) => index < 6);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to search
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Business Header */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
                    <p className="text-lg text-gray-600 mb-4">{business.category}</p>
                    <div className="flex items-center gap-4 mb-4">
                      <StarRating rating={business.rating} size={20} />
                      <span className="text-lg font-medium">{business.reviewCount.toLocaleString()} reviews</span>
                    </div>
                    <p className="text-gray-700 mb-6">{business.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Gallery */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <Camera className="mr-2 h-6 w-6" />
                  Photos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="aspect-video">
                    <img
                      src={businessImages[activeImageIndex]}
                      alt="Business photo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {businessImages.slice(1, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Business photo ${index + 2}`}
                        className="aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setActiveImageIndex(index + 1)}
                      />
                    ))}
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-300 transition-colors">
                      +{businessImages.length - 4} more
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Reviews</h2>
                  <Link to={`/write-review/${business.id}`}>
                    <Button>Write a Review</Button>
                  </Link>
                </div>
                <div className="space-y-6">
                  {businessReviews.map((review) => (
                    <ReviewCard key={review.id} {...review} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Business Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600">{businessInfo.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">{businessInfo.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-gray-600">{businessInfo.website}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Hours</p>
                      <p className="text-gray-600">{businessInfo.hours}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link to={`/write-review/${business.id}`}>
                    <Button className="w-full">Write a Review</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
