import React, { useState } from 'react';
import { MessageSquare, Send, Wand2, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReviewTemplateSelector from './ReviewTemplateSelector';

interface BusinessReviewResponseProps {
  review: {
    _id: string;
    rating: number;
    content: string;
    customerName?: string;
    customer?: {
      firstName?: string;
      lastName?: string;
    };
  };
  onResponse: (reviewId: string, responseContent: string) => Promise<void>;
  disabled?: boolean;
}

const BusinessReviewResponse: React.FC<BusinessReviewResponseProps> = ({ 
  review, 
  onResponse, 
  disabled = false 
}) => {
  const [responseContent, setResponseContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerName = review.customerName || 
    (review.customer ? `${review.customer.firstName || ''} ${review.customer.lastName || ''}`.trim() : '');

  const reviewForTemplate = {
    ...review,
    customerName: customerName || 'valued customer'
  };

  const handleSubmitResponse = async () => {
    if (!responseContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onResponse(review._id, responseContent.trim());
      setResponseContent('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateSelect = (content: string) => {
    setResponseContent(content);
    setIsTemplateModalOpen(false);
  };

  const getResponseButtonText = () => {
    if (review.rating <= 2) return 'Address Concern';
    if (review.rating === 3) return 'Follow Up';
    return 'Say Thank You';
  };

  const getResponseButtonColor = () => {
    if (review.rating <= 2) return 'bg-red-600 hover:bg-red-700';
    if (review.rating === 3) return 'bg-yellow-600 hover:bg-yellow-700';
    return 'bg-green-600 hover:bg-green-700';
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            className={`flex items-center gap-2 text-white ${getResponseButtonColor()}`}
            disabled={disabled}
          >
            <MessageSquare className="w-4 h-4" />
            {getResponseButtonText()}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Review Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{reviewForTemplate.customerName}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 text-sm">{review.content}</p>
            </div>

            {/* Response Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Your Response
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Use Template
                </Button>
              </div>
              
              <Textarea
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Write your response to this review..."
                className="min-h-[120px] resize-none"
              />
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{responseContent.length} characters</span>
                <span>
                  {responseContent.length > 500 && (
                    <span className="text-amber-600">Consider keeping responses concise</span>
                  )}
                </span>
              </div>
            </div>

            {/* Response Tips */}
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Response Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {review.rating <= 2 ? (
                  <>
                    <li>• Acknowledge their concerns sincerely</li>
                    <li>• Offer a solution or way to make it right</li>
                    <li>• Provide contact information for follow-up</li>
                  </>
                ) : review.rating === 3 ? (
                  <>
                    <li>• Thank them for their feedback</li>
                    <li>• Address any specific concerns mentioned</li>
                    <li>• Invite them to experience improvements</li>
                  </>
                ) : (
                  <>
                    <li>• Express genuine gratitude</li>
                    <li>• Mention specific aspects they praised</li>
                    <li>• Invite them to return</li>
                  </>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitResponse}
                disabled={!responseContent.trim() || isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending...' : 'Send Response'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selector Modal */}
      <ReviewTemplateSelector
        review={reviewForTemplate}
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setIsTemplateModalOpen(false)}
        isOpen={isTemplateModalOpen}
      />
    </>
  );
};

export default BusinessReviewResponse;