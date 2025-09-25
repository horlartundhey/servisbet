import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, Star, Crown, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import businessService, { Business, CreateBusinessData } from "../services/businessService";
import { reviewService } from "../services/reviewService";
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import { BulkResponse } from '../components/BulkResponse';
import { ResponseAnalytics } from '../components/ResponseAnalytics';
import ResponseTemplateManager from '../components/ResponseTemplateManager';
import AdvancedAnalyticsDashboard from '../components/AdvancedAnalyticsDashboard';
import BusinessImageManager from '../components/BusinessImageManager';

// BusinessVerificationUpload component
function BusinessVerificationUpload({ selectedBusiness }: { selectedBusiness: any }) {
  const [registrationDoc, setRegistrationDoc] = useState<File | null>(null);
  const [ownerId, setOwnerId] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [registrationPreview, setRegistrationPreview] = useState<string | null>(null);
  const [ownerIdPreview, setOwnerIdPreview] = useState<string | null>(null);

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

  // File validation function
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB.';
    }
    return null;
  };

  // Generate file preview
  const generatePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        resolve('/api/placeholder/pdf-icon'); // Use a PDF icon
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    });
  };

  // Handle file selection with validation and preview
  const handleFileChange = async (file: File | null, type: 'registration' | 'ownerId') => {
    if (!file) {
      if (type === 'registration') {
        setRegistrationDoc(null);
        setRegistrationPreview(null);
      } else {
        setOwnerId(null);
        setOwnerIdPreview(null);
      }
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const preview = await generatePreview(file);
      if (type === 'registration') {
        setRegistrationDoc(file);
        setRegistrationPreview(preview);
      } else {
        setOwnerId(file);
        setOwnerIdPreview(preview);
      }
      setError(null); // Clear any previous errors
    } catch (err) {
      setError('Failed to generate file preview.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationDoc || !ownerId || !selectedBusiness?._id) {
      setError('Please select both documents.');
      return;
    }
    setStatus('uploading');
    setError(null);
    try {
      await businessService.uploadVerificationDocuments(selectedBusiness._id, registrationDoc, ownerId, notes);
      setStatus('success');
      // Clear form after successful upload
      setRegistrationDoc(null);
      setOwnerId(null);
      setRegistrationPreview(null);
      setOwnerIdPreview(null);
      setNotes('');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Upload failed.';
      setError(errorMessage);
      setStatus('error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Registration Document */}
      <div className="space-y-3">
        <label className="block text-sm font-medium mb-2">
          Business Registration Document (PDF or Image) *
        </label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" 
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          required 
          onChange={e => handleFileChange(e.target.files?.[0] || null, 'registration')} 
        />
        {registrationDoc && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-3">
              {registrationPreview && registrationDoc.type !== 'application/pdf' ? (
                <img src={registrationPreview} alt="Registration document preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">PDF</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{registrationDoc.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(registrationDoc.size)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Owner ID Document */}
      <div className="space-y-3">
        <label className="block text-sm font-medium mb-2">
          Owner ID Document (PDF or Image) *
        </label>
        <input 
          type="file" 
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" 
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          required 
          onChange={e => handleFileChange(e.target.files?.[0] || null, 'ownerId')} 
        />
        {ownerId && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-3">
              {ownerIdPreview && ownerId.type !== 'application/pdf' ? (
                <img src={ownerIdPreview} alt="Owner ID preview" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                  <span className="text-red-600 text-xs font-bold">PDF</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{ownerId.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(ownerId.size)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium mb-2">Additional Notes (optional)</label>
        <textarea 
          className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          rows={3} 
          placeholder="Any additional information for the admin..." 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">Documents uploaded successfully! Awaiting admin approval.</p>
        </div>
      )}

      {/* File Requirements */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">File Requirements:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Accepted formats: PDF, JPEG, PNG, GIF, WebP</li>
          <li>• Maximum file size: 10MB per document</li>
          <li>• Both documents are required for verification</li>
          <li>• Ensure documents are clear and readable</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2" 
          disabled={status === 'uploading' || !registrationDoc || !ownerId}
        >
          {status === 'uploading' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            'Submit for Verification'
          )}
        </Button>
      </div>
    </form>
  );
}

const BusinessDashboard = () => {
  const { user, updateUser } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessReviews, setBusinessReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNewBusinessDialogOpen, setIsNewBusinessDialogOpen] = useState(false);
  
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    hours: {},
    category: '',
    website: ''
  });

  const [newBusinessForm, setNewBusinessForm] = useState({
    name: '',
    description: '',
    category: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    hours: {}
  });

  // Load user's businesses on component mount
  useEffect(() => {
    if (user?.role === 'business') {
      loadBusinesses();
    }
  }, [user]);

  // Update businessInfo when selectedBusiness changes
  useEffect(() => {
    if (selectedBusiness) {
      setBusinessInfo({
        name: selectedBusiness.name,
        description: selectedBusiness.description,
        phone: selectedBusiness.phone,
        email: selectedBusiness.email,
        address: selectedBusiness.address,
        hours: selectedBusiness.hours || {},
        category: selectedBusiness.category,
        website: selectedBusiness.website || ''
      });
      // Load reviews for the selected business
      loadBusinessReviews(selectedBusiness._id);
    }
  }, [selectedBusiness]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      console.log('Loading businesses...');
      const response = await businessService.getMyBusinesses();
      console.log('Businesses response:', response);
      setBusinesses(response.data);
      
      // Select active business or first business
      const activeBusiness = response.data.find((b: Business) => b.isActive);
      setSelectedBusiness(activeBusiness || response.data[0] || null);
      console.log('Selected business:', activeBusiness || response.data[0] || null);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load reviews for the selected business
  const loadBusinessReviews = async (businessId: string) => {
    try {
      setLoadingReviews(true);
      setBusinessReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewService.markHelpful(reviewId);
      // Refresh the reviews for the selected business
      if (selectedBusiness) {
        await loadBusinessReviews(selectedBusiness._id);
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
    }
  };
  const handleRemoveHelpful = async (reviewId: string) => {
    try {
      await reviewService.removeHelpful(reviewId);
      // Refresh the reviews for the selected business
      if (selectedBusiness) {
        await loadBusinessReviews(selectedBusiness._id);
      }
    } catch (error) {
      console.error('Error removing helpful mark:', error);
      throw error;
    }
  };

  const handleReportReview = (reviewId: string) => {
    // TODO: Implement review reporting
    console.log('Reporting review:', reviewId);
  };

  const handleCreateBusiness = async () => {
    try {
      const payload = {
        name: newBusinessForm.name,
        description: newBusinessForm.description,
        email: newBusinessForm.email,
        phone: newBusinessForm.phone,
        category: newBusinessForm.category,
        website: newBusinessForm.website,
        address: newBusinessForm.address,
        coordinates: [0, 0] as [number, number], // Properly typed coordinates
        hours: newBusinessForm.hours || {},
      };
      await businessService.createAdditionalBusiness(payload);
      setIsNewBusinessDialogOpen(false);
      setNewBusinessForm({
        name: '',
        description: '',
        category: '',
        email: '',
        phone: '',
        website: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        hours: {},
      });
      await loadBusinesses();
    } catch (error) {
      console.error('Error creating business:', error);
    }
  };

  const handleSetPrimary = async (businessId: string) => {
    try {
      await businessService.setPrimaryBusiness(businessId);
      await loadBusinesses();
    } catch (error) {
      console.error('Error setting primary business:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedBusiness) return;
    
    try {
      await businessService.updateBusiness(selectedBusiness._id, businessInfo);
      await loadBusinesses();
    } catch (error) {
      console.error('Error updating business info:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your businesses...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access your business dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'business') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied. Business account required.</p>
        </div>
      </div>
    );
  }

  const businessStats = {
    totalReviews: 247,
    averageRating: 4.6,
    monthlyViews: 1243,
    responseRate: 89
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Business Owner Onboarding Step Modal */}
      {user?.role === 'business' && selectedBusiness && selectedBusiness.verificationStatus !== 'approved' && (
        <div className="w-full flex justify-end px-4 pt-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className={`px-6 py-3 rounded-lg font-semibold text-base shadow-md ${
                  selectedBusiness.verificationStatus === 'pending' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : selectedBusiness.verificationStatus === 'rejected'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={selectedBusiness.verificationStatus === 'pending'}
              >
                {selectedBusiness.verificationStatus === 'pending' 
                  ? 'Documents Under Review'
                  : selectedBusiness.verificationStatus === 'rejected'
                  ? 'Resubmit Verification Documents'
                  : 'Continue Business Onboarding'
                }
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedBusiness.verificationStatus === 'rejected' 
                    ? 'Resubmit Verification Documents'
                    : 'Upload Verification Documents'
                  }
                </DialogTitle>
              </DialogHeader>
              <BusinessVerificationUpload selectedBusiness={selectedBusiness} />
            </DialogContent>
          </Dialog>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Header with Business Selector */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {selectedBusiness ? `${selectedBusiness.name} - Dashboard` : 'Business Dashboard'}
              </h1>
              <p className="text-muted-foreground">Manage your business profile and reviews</p>
              <p className="text-sm text-muted-foreground">Welcome back, {user.firstName}!</p>
            </div>
            
            <Dialog open={isNewBusinessDialogOpen} onOpenChange={setIsNewBusinessDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Business
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Business</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Business Name</label>
                    <Input
                      value={newBusinessForm.name}
                      onChange={(e) => setNewBusinessForm({...newBusinessForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select 
                      value={newBusinessForm.category} 
                      onValueChange={(value) => setNewBusinessForm({...newBusinessForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                        <SelectItem value="Hotel">Hotel</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Beauty">Beauty & Spa</SelectItem>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Fitness">Fitness</SelectItem>
                        <SelectItem value="Home Services">Home Services</SelectItem>
                        <SelectItem value="Professional Services">Professional Services</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone</label>
                    <Input
                      value={newBusinessForm.phone}
                      onChange={(e) => setNewBusinessForm({...newBusinessForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      value={newBusinessForm.email}
                      onChange={(e) => setNewBusinessForm({...newBusinessForm, email: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Street Address *</label>
                    <Input
                      placeholder="123 Main Street"
                      value={newBusinessForm.address.street}
                      onChange={(e) => setNewBusinessForm({
                        ...newBusinessForm, 
                        address: {...newBusinessForm.address, street: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">City *</label>
                    <Input
                      placeholder="City"
                      value={newBusinessForm.address.city}
                      onChange={(e) => setNewBusinessForm({
                        ...newBusinessForm, 
                        address: {...newBusinessForm.address, city: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">State *</label>
                    <Input
                      placeholder="State"
                      value={newBusinessForm.address.state}
                      onChange={(e) => setNewBusinessForm({
                        ...newBusinessForm, 
                        address: {...newBusinessForm.address, state: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">ZIP Code *</label>
                    <Input
                      placeholder="12345"
                      value={newBusinessForm.address.zipCode}
                      onChange={(e) => setNewBusinessForm({
                        ...newBusinessForm, 
                        address: {...newBusinessForm.address, zipCode: e.target.value}
                      })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium mb-2 block">Description <span className="text-red-500">*</span></label>
                  <Textarea
                    required
                    value={newBusinessForm.description}
                    onChange={(e) => setNewBusinessForm({...newBusinessForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsNewBusinessDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateBusiness}
                    disabled={!newBusinessForm.description || !newBusinessForm.description.trim()}
                  >
                    Create Business
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Business Selector */}
          <>
            {businesses.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <Select 
                    value={selectedBusiness?._id || ''} 
                    onValueChange={(businessId) => {
                      const business = businesses.find(b => b._id === businessId);
                      setSelectedBusiness(business || null);
                    }}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Select a business" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((business) => (
                        <SelectItem key={business._id} value={business._id}>
                          <div className="flex items-center gap-2">
                            <span>{business.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Business Verification Status Indicator */}
            {selectedBusiness && (
              <div className="mt-4">
                {selectedBusiness.verificationStatus === 'incomplete' && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800">Business Profile Incomplete</h4>
                      <p className="text-sm text-yellow-700">
                        Complete your business profile and upload verification documents to get started.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Incomplete
                    </Badge>
                  </div>
                )}

                {selectedBusiness.verificationStatus === 'pending' && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800">Verification Pending</h4>
                      <p className="text-sm text-blue-700">
                        Your verification documents have been submitted and are being reviewed by our admin team. 
                        You'll receive an email notification once the review is complete.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      Under Review
                    </Badge>
                  </div>
                )}

                {selectedBusiness.verificationStatus === 'approved' && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800">Business Verified ✓</h4>
                      <p className="text-sm text-green-700">
                        Your business has been successfully verified! Your profile is now live and customers can find and review your business.
                        {selectedBusiness.verifiedAt && (
                          <span className="block mt-1">
                            Verified on {new Date(selectedBusiness.verifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      Verified
                    </Badge>
                  </div>
                )}

                {selectedBusiness.verificationStatus === 'rejected' && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">Verification Rejected</h4>
                      <p className="text-sm text-red-700">
                        Your verification documents were rejected. Please review the feedback below and resubmit your documents.
                        {selectedBusiness.verificationNotes && (
                          <span className="block mt-2 p-2 bg-red-100 rounded text-sm">
                            <strong>Admin Feedback:</strong> {selectedBusiness.verificationNotes}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      Rejected
                    </Badge>
                  </div>
                )}
              </div>
            )}
            {businesses.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                  <p className="text-muted-foreground mb-4">Create your first business to get started</p>
                  <Button onClick={() => setIsNewBusinessDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Business
                  </Button>
                </CardContent>
              </Card>
            )}
          </>

        {/* Main Content */}
        {selectedBusiness && (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Business Profile</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="templates">Response Templates</TabsTrigger>
              <TabsTrigger value="bulk-response">Bulk Responses</TabsTrigger>
              <TabsTrigger value="response-analytics">Response Analytics</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Business Name</label>
                      <Input
                        value={businessInfo.name}
                        onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select 
                        value={businessInfo.category} 
                        onValueChange={(value) => setBusinessInfo({...businessInfo, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Restaurant">Restaurant</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Beauty">Beauty & Wellness</SelectItem>
                          <SelectItem value="Automotive">Automotive</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Phone</label>
                      <Input
                        value={businessInfo.phone}
                        onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input
                        value={businessInfo.email}
                        onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Website</label>
                      <Input
                        placeholder="https://your-website.com"
                        value={businessInfo.website}
                        onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Business Hours</label>
                      <Input
                        placeholder="Mon-Fri: 9AM-5PM"
                        value={JSON.stringify(businessInfo.hours)}
                        onChange={(e) => {
                          try {
                            const hours = JSON.parse(e.target.value);
                            setBusinessInfo({...businessInfo, hours: hours});
                          } catch {
                            // Handle invalid JSON gracefully
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Business Description</label>
                    <Textarea
                      placeholder="Describe your business..."
                      value={businessInfo.description}
                      onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Street Address</label>
                      <Input
                        placeholder="123 Main St"
                        value={businessInfo.address.street}
                        onChange={(e) => setBusinessInfo({
                          ...businessInfo, 
                          address: { ...businessInfo.address, street: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">City</label>
                      <Input
                        placeholder="City"
                        value={businessInfo.address.city}
                        onChange={(e) => setBusinessInfo({
                          ...businessInfo, 
                          address: { ...businessInfo.address, city: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">State</label>
                      <Input
                        placeholder="State"
                        value={businessInfo.address.state}
                        onChange={(e) => setBusinessInfo({
                          ...businessInfo, 
                          address: { ...businessInfo.address, state: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Zip Code</label>
                      <Input
                        placeholder="12345"
                        value={businessInfo.address.zipCode}
                        onChange={(e) => setBusinessInfo({
                          ...businessInfo, 
                          address: { ...businessInfo.address, zipCode: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <Button className="w-full md:w-auto" onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Business Image Management */}
              <BusinessImageManager
                businessId={selectedBusiness._id}
                currentImages={selectedBusiness.images}
                onImagesUpdated={(images) => {
                  // Update local business state
                  setSelectedBusiness(prev => prev ? { ...prev, images } : null);
                  // Optionally reload businesses to sync with server
                  loadBusinesses();
                }}
                isRequired={true}
              />
              
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Recent Reviews</h3>
                <Badge variant="outline">
                  {/* If you have stats, add it to the Business type and backend. Otherwise, remove this block. */}
                </Badge>
              </div>
              
              <div className="grid gap-6">
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading reviews...</p>
                  </div>
                ) : businessReviews.length > 0 ? (
                  businessReviews.map((review) => {
                    return (
                      <div key={review._id} className="relative">
                        <ReviewCard
                          id={review._id}
                          customerName={`${review.user.firstName} ${review.user.lastName}`}
                          customerAvatar={review.user.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b3fd?w=100&h=100&fit=crop&crop=face'}
                          rating={review.rating}
                          date={new Date(review.createdAt).toLocaleDateString()}
                          title={review.title}
                          content={review.content}
                          images={review.photos || []}
                          businessResponse={review.response ? {
                            text: review.response.content,
                            respondedAt: review.response.respondedAt,
                            respondedBy: review.response.respondedBy
                          } : undefined}
                          helpful={review.helpfulVotes}
                          onMarkHelpful={handleMarkHelpful}
                          onRemoveHelpful={handleRemoveHelpful}
                          onReport={handleReportReview}
                        />
                        {!review.response && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <Textarea placeholder="Write a response to this review..." rows={3} />
                            <Button className="mt-2" size="sm">Post Response</Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reviews yet for this business</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <ResponseTemplateManager />
            </TabsContent>

            <TabsContent value="bulk-response" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Response Management</CardTitle>
                  <p className="text-muted-foreground">
                    Respond to multiple reviews at once using templates. Only works with reviews from registered users.
                  </p>
                </CardHeader>
                <CardContent>
                  <BulkResponse 
                    businessId={selectedBusiness._id} 
                    onSuccess={() => {
                      // Optionally refresh reviews or show success message
                      console.log('Bulk responses sent successfully');
                    }} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="response-analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Response Analytics & Scheduling</CardTitle>
                  <p className="text-muted-foreground">
                    Track your response performance, template usage, and scheduling analytics
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponseAnalytics businessId={selectedBusiness._id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AdvancedAnalyticsDashboard businessId={selectedBusiness._id} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;