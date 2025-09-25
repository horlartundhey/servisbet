import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Star, Send, Eye, Clock, Filter, Users, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import StarRating from './StarRating';
import { businessService } from '../services/businessService';

interface Review {
  _id: string;
  rating: number;
  text: string;
  user: {
    name: string;
    email: string;
    verified: boolean;
  };
  createdAt: string;
  businessResponse?: {
    text: string;
    respondedAt: string;
  };
}

interface Template {
  _id: string;
  name: string;
  content: string;
  category: string;
}

interface BulkResponseProps {
  businessId: string;
  onSuccess?: () => void;
}

export const BulkResponse: React.FC<BulkResponseProps> = ({ businessId, onSuccess }) => {
  const { toast } = useToast();
  
  const [eligibleReviews, setEligibleReviews] = useState<Review[]>([]);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Scheduling state
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    filter: 'all',
    rating: 'all',
    sortBy: 'newest',
    limit: 50
  });
  
  const [summary, setSummary] = useState({
    totalRegistered: 0,
    unresponded: 0,
    responded: 0,
    filtered: 0
  });

  useEffect(() => {
    loadEligibleReviews();
    loadTemplates();
  }, [businessId, filters]);

  const loadEligibleReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/bulk-response/business/${businessId}/eligible-reviews?` + 
        new URLSearchParams({
          filter: filters.filter,
          rating: filters.rating,
          sortBy: filters.sortBy,
          limit: filters.limit.toString()
        }).toString(),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEligibleReviews(data.reviews);
        setSummary(data.summary);
      } else {
        throw new Error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error loading eligible reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load eligible reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/templates/business/${businessId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableIds = eligibleReviews
        .filter(review => !review.businessResponse)
        .map(review => review._id);
      setSelectedReviews(new Set(selectableIds));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const handleReviewSelect = (reviewId: string, checked: boolean) => {
    const newSelected = new Set(selectedReviews);
    if (checked) {
      newSelected.add(reviewId);
    } else {
      newSelected.delete(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handlePreview = async () => {
    if (!selectedTemplate || selectedReviews.size === 0) {
      toast({
        title: "Missing Selection",
        description: "Please select a template and at least one review",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/bulk-response/business/${businessId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          reviewIds: Array.from(selectedReviews),
          customVariables
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviews(data.previews);
        setIsPreviewOpen(true);
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Error",
        description: "Failed to generate response preview",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (responsesToSubmit: any[], isScheduled = false) => {
    try {
      setIsSubmitting(true);
      
      const endpoint = isScheduled ? 'schedule' : 'submit';
      const payload: any = {
        templateId: selectedTemplate,
        responses: responsesToSubmit,
        customVariables
      };

      if (isScheduled && scheduledTime) {
        payload.scheduledTime = scheduledTime;
      }
      
      const response = await fetch(`/api/bulk-response/business/${businessId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isScheduled) {
          toast({
            title: "Success",
            description: `Successfully scheduled ${data.responseCount} responses for ${new Date(data.scheduledTime).toLocaleString()}`,
          });
        } else {
          toast({
            title: "Success",
            description: `Successfully sent ${data.results.successful.length} responses`,
          });

          if (data.results.failed.length > 0) {
            toast({
              title: "Partial Success",
              description: `${data.results.failed.length} responses failed to send`,
              variant: "destructive",
            });
          }
        }

        // Reset and refresh
        setSelectedReviews(new Set());
        setIsPreviewOpen(false);
        setPreviews([]);
        setScheduleMode(false);
        setScheduledTime('');
        await loadEligibleReviews();
        onSuccess?.();
      } else {
        throw new Error(`Failed to ${isScheduled ? 'schedule' : 'submit'} responses`);
      }
    } catch (error) {
      console.error(`Error ${isScheduled ? 'scheduling' : 'submitting'} responses:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isScheduled ? 'schedule' : 'submit'} responses`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectableReviews = eligibleReviews.filter(review => !review.businessResponse);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRegistered}</div>
            <p className="text-xs text-muted-foreground">
              Reviews from registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresponded</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.unresponded}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.responded}</div>
            <p className="text-xs text-muted-foreground">
              Already responded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{selectedReviews.size}</div>
            <p className="text-xs text-muted-foreground">
              Ready for bulk response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Template Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filter">Response Status</Label>
              <Select
                value={filters.filter}
                onValueChange={(value) => setFilters(prev => ({ ...prev, filter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reviews</SelectItem>
                  <SelectItem value="unresponded">Unresponded Only</SelectItem>
                  <SelectItem value="responded">Responded Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rating">Rating</Label>
              <Select
                value={filters.rating}
                onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="rating_low">Rating: Low to High</SelectItem>
                  <SelectItem value="rating_high">Rating: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template">Response Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name} ({template.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Variables */}
          <div className="space-y-2">
            <Label>Custom Variables (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="Variable name (e.g., specialOffer)"
                onChange={(e) => {
                  const variableName = e.target.value;
                  if (variableName) {
                    // Store variable name for later use
                    e.target.setAttribute('data-variable-name', variableName);
                  }
                }}
              />
              <Input
                placeholder="Variable value (e.g., 20% off next visit)"
                onChange={(e) => {
                  const variableValue = e.target.value;
                  const nameInput = e.target.previousSibling as HTMLInputElement;
                  const variableName = nameInput?.getAttribute('data-variable-name');
                  
                  if (variableName && variableValue) {
                    setCustomVariables(prev => ({
                      ...prev,
                      [variableName]: variableValue
                    }));
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Reviews for Bulk Response</CardTitle>
              <CardDescription>
                Only reviews from registered users are shown (anonymous reviews excluded)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedReviews.size === selectableReviews.length && selectableReviews.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all">Select All Unresponded</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading reviews...</div>
          ) : eligibleReviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No registered user reviews found with current filters
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {eligibleReviews.map((review) => {
                const isResponded = !!review.businessResponse;
                const isSelected = selectedReviews.has(review._id);
                
                return (
                  <div
                    key={review._id}
                    className={`p-4 border rounded-lg ${
                      isResponded ? 'bg-gray-50' : 'bg-white'
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {!isResponded && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleReviewSelect(review._id, checked as boolean)
                            }
                          />
                        )}
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{review.user.name}</span>
                            {review.user.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                            <StarRating rating={review.rating} size={16} showNumber={false} />
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700">{review.text}</p>
                          
                          {review.businessResponse && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                                <span>Business Response</span>
                                <span>{new Date(review.businessResponse.respondedAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-blue-800">
                                {review.businessResponse.text}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {isResponded ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Responded
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={!selectedTemplate || selectedReviews.size === 0}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Responses ({selectedReviews.size})
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Bulk Responses</DialogTitle>
            <DialogDescription>
              Review the generated responses before sending them to customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {previews.map((preview) => (
              <div key={preview.reviewId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{preview.customerName}</span>
                    <StarRating rating={preview.rating} size={16} showNumber={false} />
                  </div>
                  <Badge variant={preview.canRespond ? "default" : "secondary"}>
                    {preview.canRespond ? "Will Send" : "Already Responded"}
                  </Badge>
                </div>
                
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Customer Review:</strong> {preview.reviewText}
                </div>
                
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <strong>Your Response:</strong>
                  <div className="mt-1">{preview.processedResponse}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scheduling Options */}
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="schedule-mode"
                checked={scheduleMode}
                onCheckedChange={(checked) => {
                  setScheduleMode(checked as boolean);
                  if (!checked) setScheduledTime('');
                }}
              />
              <Label htmlFor="schedule-mode" className="font-medium">
                Schedule for later
              </Label>
            </div>
            
            {scheduleMode && (
              <div className="space-y-2">
                <Label htmlFor="scheduled-time">Schedule Date & Time</Label>
                <Input
                  id="scheduled-time"
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // At least 1 hour from now
                />
                <p className="text-xs text-muted-foreground">
                  Responses will be sent automatically at the scheduled time
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const responsesToSubmit = previews
                  .filter(p => p.canRespond)
                  .map(p => ({ reviewId: p.reviewId }));
                  
                if (scheduleMode) {
                  if (!scheduledTime) {
                    toast({
                      title: "Missing Schedule Time",
                      description: "Please select a date and time to schedule responses",
                      variant: "destructive",
                    });
                    return;
                  }
                  handleSubmit(responsesToSubmit, true);
                } else {
                  handleSubmit(responsesToSubmit, false);
                }
              }}
              disabled={isSubmitting || (scheduleMode && !scheduledTime)}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 
                (scheduleMode ? 'Scheduling...' : 'Sending...') : 
                (scheduleMode ? 
                  `Schedule ${previews.filter(p => p.canRespond).length} Responses` : 
                  `Send ${previews.filter(p => p.canRespond).length} Responses`
                )
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};