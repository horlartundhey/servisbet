
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Upload, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mockBusinesses } from '../data/mockData';

const WriteReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Review submitted:', { rating, title, content, images });
    // In a real app, this would submit to an API
    navigate(`/business/${id}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, you'd upload these files
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages([...images, ...newImages.slice(0, 6 - images.length)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to={`/business/${id}`} className="inline-flex items-center text-gray-600 hover:text-primary mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {business.name}
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Write a Review</h1>
              <p className="text-gray-600">Share your experience with {business.name}</p>
            </div>

            {/* Business Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-8">
              <img
                src={business.image}
                alt={business.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-lg">{business.name}</h3>
                <p className="text-gray-600">{business.category}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-lg font-medium mb-3">How would you rate your experience?</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-1"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        size={32}
                        className={
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-4 text-lg font-medium">
                    {rating > 0 && (
                      rating === 1 ? 'Poor' :
                      rating === 2 ? 'Fair' :
                      rating === 3 ? 'Good' :
                      rating === 4 ? 'Very Good' : 'Excellent'
                    )}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-lg font-medium mb-2">
                  Review Title
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience..."
                  className="text-lg p-3"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label htmlFor="content" className="block text-lg font-medium mb-2">
                  Your Review
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell others about your experience..."
                  className="min-h-32 text-lg p-3"
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-lg font-medium mb-2">Add Photos (Optional)</label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={images.length >= 6}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        images.length >= 6
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'border-primary text-primary hover:bg-primary/5'
                      }`}
                    >
                      <Upload className="h-5 w-5" />
                      {images.length >= 6 ? 'Maximum 6 photos' : 'Upload Photos'}
                    </label>
                    <span className="text-sm text-gray-500">
                      {images.length}/6 photos uploaded
                    </span>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  disabled={rating === 0 || !title.trim() || !content.trim()}
                >
                  Submit Review
                </Button>
                <Link to={`/business/${id}`}>
                  <Button type="button" variant="outline" size="lg">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WriteReview;
