
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, MapPin, Calendar, Award, Camera, User as UserIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import { mockReviews } from '../data/mockData';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('reviews');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      await updateUser(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
          <Link to="/auth" className="text-primary hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  // User stats - these would come from API in real implementation
  const userStats = {
    reviewCount: 47,
    photoCount: 132,
    helpfulVotes: 284,
    averageRating: 4.2,
    joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    }) : 'Recently'
  };

  const userReviews = mockReviews.slice(0, 8);

  const stats = [
    { label: "Reviews", value: userStats.reviewCount, icon: Edit },
    { label: "Photos", value: userStats.photoCount, icon: Camera },
    { label: "Helpful votes", value: userStats.helpfulVotes, icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-primary hover:underline">← Back to home</Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6 text-center">
                <div className="relative mb-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {!isEditing ? (
                  <>
                    <h1 className="text-2xl font-bold mb-2">{user.firstName} {user.lastName}</h1>
                    {profileData.location && (
                      <div className="flex items-center justify-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profileData.location}
                      </div>
                    )}
                    <div className="flex items-center justify-center text-gray-600 mb-6">
                      <Calendar className="h-4 w-4 mr-1" />
                      Member since {userStats.joinDate}
                    </div>
                    
                    {profileData.bio && (
                      <p className="text-gray-600 text-sm mb-6 text-left">{profileData.bio}</p>
                    )}
                  </>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="First Name"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      />
                      <Input
                        placeholder="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      />
                    </div>
                    <Input
                      placeholder="Location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    />
                    <Input
                      placeholder="Phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                    <Textarea
                      placeholder="Bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      rows={3}
                    />
                  </div>
                )}
                
                <div className="space-y-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <stat.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{stat.label}</span>
                      </div>
                      <span className="font-bold text-primary">{stat.value}</span>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Average rating</span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={userStats.averageRating} size={16} showNumber={false} />
                      <span className="font-bold text-primary">{userStats.averageRating}</span>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <Button className="w-full mt-6" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 mt-6">
                    <Button className="flex-1" onClick={handleSaveProfile}>Save</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="reviews">Reviews ({userStats.reviewCount})</TabsTrigger>
                <TabsTrigger value="photos">Photos ({userStats.photoCount})</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="space-y-6">
                <div className="grid gap-6">
                  {userReviews.map((review) => (
                    <ReviewCard key={review.id} {...review} />
                  ))}
                </div>
                <div className="text-center py-8">
                  <Button variant="outline">Load More Reviews</Button>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className="aspect-square">
                      <img
                        src={`https://images.unsplash.com/photo-${1517248135467 + index}?w=300&h=300&fit=crop`}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-center py-8">
                  <Button variant="outline">Load More Photos</Button>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {[
                        { action: "Reviewed", business: "Blue Mountain Cafe", date: "2 days ago" },
                        { action: "Added photos to", business: "Downtown Gym", date: "1 week ago" },
                        { action: "Reviewed", business: "Tech Solutions Inc", date: "2 weeks ago" },
                        { action: "Updated review for", business: "Sunset Restaurant", date: "3 weeks ago" },
                        { action: "Added photos to", business: "City Library", date: "1 month ago" }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-gray-700">{activity.action} </span>
                            <span className="font-medium text-primary">{activity.business}</span>
                          </div>
                          <span className="text-sm text-gray-500">{activity.date}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
