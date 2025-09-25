import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Star, 
  Calendar, 
  ThumbsUp, 
  MessageCircle, 
  TrendingUp, 
  Award, 
  Clock,
  Edit,
  Settings,
  Mail
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from '../contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { reviewService } from '../services/reviewService';
import ReviewCard from '../components/ReviewCard';

interface UserReview {
  _id: string;
  business: {
    _id: string;
    name: string;
  };
  rating: number;
  title: string;
  content: string;
  photos?: string[];
  helpfulVotes: number;
  isMarkedHelpful?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UserStats {
  totalReviews: number;
  averageRating: number;
  totalHelpfulVotes: number;
  totalPhotos: number;
  joinedDate: string;
  reviewStreak: number;
  badges: string[];
}

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user reviews
      const reviewsResponse = await reviewService.getUserReviews(user._id);
      setUserReviews(reviewsResponse.reviews || []);

      // Calculate user statistics
      const stats = calculateUserStats(reviewsResponse.reviews || [], user);
      setUserStats(stats);
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Generate mock data for demonstration
      const mockReviews = generateMockReviews();
      const mockStats = calculateUserStats(mockReviews, user);
      setUserReviews(mockReviews);
      setUserStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (reviews: UserReview[], currentUser: any): UserStats => {
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    const totalHelpfulVotes = reviews.reduce((sum, review) => sum + review.helpfulVotes, 0);
    const totalPhotos = reviews.reduce((sum, review) => sum + (review.photos?.length || 0), 0);
    const joinedDate = currentUser?.createdAt || new Date().toISOString();
    
    // Calculate review streak (days with at least one review in last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentReviews = reviews.filter(review => 
      new Date(review.createdAt) >= thirtyDaysAgo
    );
    const reviewStreak = recentReviews.length;
    
    // Calculate badges
    const badges = [];
    if (totalReviews >= 10) badges.push('Prolific Reviewer');
    if (averageRating >= 4) badges.push('Positive Reviewer');
    if (totalHelpfulVotes >= 50) badges.push('Helpful Contributor');
    if (totalPhotos >= 20) badges.push('Photo Expert');
    if (reviewStreak >= 7) badges.push('Active Member');

    return {
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalHelpfulVotes,
      totalPhotos,
      joinedDate,
      reviewStreak,
      badges
    };
  };

  const generateMockReviews = (): UserReview[] => {
    return [
      {
        _id: '1',
        business: { _id: 'b1', name: 'Pizza Palace' },
        rating: 5,
        title: 'Amazing pizza experience!',
        content: 'Had the best margherita pizza here. The crust was perfectly crispy and the ingredients were fresh. Will definitely come back!',
        photos: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop'],
        helpfulVotes: 12,
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        _id: '2',
        business: { _id: 'b2', name: 'Coffee Corner' },
        rating: 4,
        title: 'Great coffee, cozy atmosphere',
        content: 'Perfect spot for morning coffee. The baristas know their craft and the atmosphere is very welcoming.',
        helpfulVotes: 8,
        createdAt: '2024-01-10T14:20:00Z'
      },
      {
        _id: '3',
        business: { _id: 'b3', name: 'Tech Repair Shop' },
        rating: 3,
        title: 'Decent service, could be faster',
        content: 'They fixed my phone but it took longer than expected. Quality of work was good though.',
        helpfulVotes: 5,
        createdAt: '2024-01-05T09:15:00Z'
      }
    ];
  };

  const handleProfileSave = async () => {
    try {
      // TODO: Implement profile update API call
      // await userService.updateProfile(profileForm);
      
      // For now, just update local state
      updateUser({
        ...user!,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName
      });
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update profile. Please try again."
      });
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewService.markHelpful(reviewId);
      // Refresh user reviews
      await loadUserProfile();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
    }
  };

  const handleRemoveHelpful = async (reviewId: string) => {
    try {
      await reviewService.removeHelpful(reviewId);
      // Refresh user reviews
      await loadUserProfile();
    } catch (error) {
      console.error('Error removing helpful mark:', error);
      throw error;
    }
  };

  const handleReportReview = (reviewId: string) => {
    console.log('Reporting review:', reviewId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-4">
            You need to be signed in to view your profile.
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4 max-w-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleProfileSave}>
                        Save Changes
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">
                        {user.firstName} {user.lastName}
                      </h1>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(userStats?.joinedDate || '').toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* User Badges */}
                    {userStats?.badges && userStats.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {userStats.badges.map((badge, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              {userStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{userStats.totalReviews}</div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{userStats.averageRating}</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{userStats.totalHelpfulVotes}</div>
                    <div className="text-sm text-gray-600">Helpful Votes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{userStats.totalPhotos}</div>
                    <div className="text-sm text-gray-600">Photos</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  My Reviews ({userReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userReviews.length > 0 ? (
                  <div className="space-y-6">
                    {userReviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                        <div className="flex items-center justify-between mb-3">
                          <Link 
                            to={`/business/${review.business._id}`}
                            className="text-lg font-semibold text-primary hover:underline"
                          >
                            {review.business.name}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <ReviewCard
                          id={review._id}
                          customerName={`${user.firstName} ${user.lastName}`}
                          customerAvatar={user.avatar || ''}
                          rating={review.rating}
                          date={new Date(review.createdAt).toLocaleDateString()}
                          title={review.title}
                          content={review.content}
                          images={review.photos || []}
                          helpfulCount={review.helpfulVotes}
                          isMarkedHelpful={review.isMarkedHelpful}
                          onMarkHelpful={handleMarkHelpful}
                          onRemoveHelpful={handleRemoveHelpful}
                          onReport={handleReportReview}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600 mb-4">Start sharing your experiences with the community!</p>
                    <Link to="/businesses">
                      <Button>Find Businesses to Review</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userReviews.slice(0, 5).map((review, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          You reviewed{' '}
                          <Link to={`/business/${review.business._id}`} className="font-medium text-primary hover:underline">
                            {review.business.name}
                          </Link>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {userReviews.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="settingsFirstName">First Name</Label>
                        <Input
                          id="settingsFirstName"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="settingsLastName">Last Name</Label>
                        <Input
                          id="settingsLastName"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="settingsEmail">Email</Label>
                        <Input
                          id="settingsEmail"
                          type="email"
                          value={user.email}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="settingsLocation">Location (Optional)</Label>
                        <Input
                          id="settingsLocation"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, State"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="settingsBio">Bio (Optional)</Label>
                      <Textarea
                        id="settingsBio"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button onClick={handleProfileSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
