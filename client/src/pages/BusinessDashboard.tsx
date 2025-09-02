import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import { mockReviews } from '../data/mockData';

const BusinessDashboard = () => {
  const { user, updateUser } = useAuth();
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    hours: '',
    category: '',
    website: ''
  });

  useEffect(() => {
    if (user) {
      setBusinessInfo({
        name: user.businessName || `${user.firstName} ${user.lastName}'s Business`,
        description: user.businessDescription || '',
        phone: user.phone || '',
        email: user.email,
        address: user.businessAddress || user.location || '',
        hours: user.businessHours || '',
        category: user.businessCategory || '',
        website: user.businessWebsite || ''
      });
    }
  }, [user]);

  const handleSaveChanges = async () => {
    try {
      await updateUser({
        businessName: businessInfo.name,
        businessDescription: businessInfo.description,
        phone: businessInfo.phone,
        businessAddress: businessInfo.address,
        businessHours: businessInfo.hours,
        businessCategory: businessInfo.category,
        businessWebsite: businessInfo.website
      });
    } catch (error) {
      console.error('Error updating business info:', error);
    }
  };

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{businessInfo.name} - Dashboard</h1>
          <p className="text-muted-foreground">Manage your business profile and reviews</p>
          <p className="text-sm text-muted-foreground">Welcome back, {user.firstName}!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{businessStats.averageRating}</div>
                <div className="flex justify-center mb-2">
                  <StarRating rating={businessStats.averageRating} size={16} />
                </div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{businessStats.totalReviews}</div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{businessStats.monthlyViews.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Monthly Views</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{businessStats.responseRate}%</div>
              <div className="text-sm text-muted-foreground">Response Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Business Profile</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
                    <Select value={businessInfo.category} onValueChange={(value) => setBusinessInfo({...businessInfo, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                      value={businessInfo.hours}
                      onChange={(e) => setBusinessInfo({...businessInfo, hours: e.target.value})}
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
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Business Address</label>
                  <Input
                    placeholder="123 Main St, City, State 12345"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  />
                </div>
                
                <Button className="w-full md:w-auto" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Recent Reviews</h3>
              <Badge variant="outline">{businessStats.totalReviews} total reviews</Badge>
            </div>
            
            <div className="grid gap-6">
              {mockReviews.slice(0, 4).map((review) => (
                <div key={review.id} className="relative">
                  <ReviewCard {...review} />
                  {!review.businessResponse && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <Textarea placeholder="Write a response to this review..." rows={3} />
                      <Button className="mt-2" size="sm">Post Response</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Analytics dashboard coming soon</p>
                  <p className="text-sm text-muted-foreground">Track your business performance, review trends, and customer insights</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BusinessDashboard;