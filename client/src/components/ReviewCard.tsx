
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Flag, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
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
  businessResponse?: {
    text: string;
    respondedAt: string;
    respondedBy?: string;
  };
  helpful?: number;
  helpfulCount?: number;
  isMarkedHelpful?: boolean;
  onMarkHelpful?: (reviewId: string) => Promise<void>;
  onRemoveHelpful?: (reviewId: string) => Promise<void>;
  onReport?: (reviewId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  id,
  customerName,
  customerAvatar,
  rating,
  date,
  title,
  content,
  images = [],
  businessResponse,
  helpful = 0,
  helpfulCount = 0,
  isMarkedHelpful = false,
  onMarkHelpful,
  onRemoveHelpful,
  onReport
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [currentHelpfulCount, setCurrentHelpfulCount] = useState(helpfulCount || helpful);
  const [userMarkedHelpful, setUserMarkedHelpful] = useState(isMarkedHelpful);

  const handleHelpfulVote = async () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to vote on reviews."
      });
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      if (userMarkedHelpful) {
        // Remove helpful vote
        if (onRemoveHelpful) {
          await onRemoveHelpful(id);
          setCurrentHelpfulCount(prev => prev - 1);
          setUserMarkedHelpful(false);
          toast({
            title: "Vote removed",
            description: "Your helpful vote has been removed."
          });
        }
      } else {
        // Add helpful vote
        if (onMarkHelpful) {
          await onMarkHelpful(id);
          setCurrentHelpfulCount(prev => prev + 1);
          setUserMarkedHelpful(true);
          toast({
            title: "Vote recorded",
            description: "Thank you for marking this review as helpful!"
          });
        }
      }
    } catch (error: any) {
      console.error('Error voting on review:', error);
      toast({
        variant: "destructive",
        title: "Voting failed",
        description: error.message || "Could not record your vote. Please try again."
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to report reviews."
      });
      return;
    }

    if (onReport) {
      onReport(id);
    }
  };
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
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-primary text-sm">Business Response</span>
              <span className="text-xs text-gray-500">
                {new Date(businessResponse.respondedAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{businessResponse.text}</p>
            {businessResponse.respondedBy && (
              <p className="text-xs text-gray-500 mt-2">
                - {businessResponse.respondedBy}
              </p>
            )}
          </div>
        )}
        
        {/* Review Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {/* Helpful Vote Button */}
            <Button
              variant={userMarkedHelpful ? "default" : "outline"}
              size="sm"
              onClick={handleHelpfulVote}
              disabled={isVoting}
              className="flex items-center gap-2"
            >
              <ThumbsUp className={`w-4 h-4 ${userMarkedHelpful ? 'fill-current' : ''}`} />
              <span className="text-sm">
                Helpful ({currentHelpfulCount})
              </span>
            </Button>

            {/* Not Helpful Button (optional, for future enhancement) */}
            {/* <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-gray-500"
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm">Not helpful</span>
            </Button> */}
          </div>

          {/* Report Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600"
          >
            <Flag className="w-4 h-4" />
            <span className="text-sm">Report</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
