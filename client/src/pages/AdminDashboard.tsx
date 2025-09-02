import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "../contexts/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Access denied. Administrator privileges required.</p>
        </div>
      </div>
    );
  }

  const platformStats = {
    totalUsers: 15642,
    totalBusinesses: 3247,
    totalReviews: 89532,
    flaggedReviews: 23
  };

  // Mock data - replace with actual API calls
  const [stats, setStats] = useState({
    totalUsers: 156,
    totalBusinesses: 89,
    totalReviews: 324,
    pendingReviews: 12,
    flaggedContent: 3
  });

  // Admin action handlers
  const handleUserAction = (userId: number, action: string) => {
    console.log(`Admin ${user.firstName} ${user.lastName} performing ${action} on user ${userId}`);
    // TODO: Implement actual API calls
  };

  const handleBusinessAction = (businessId: number, action: string) => {
    console.log(`Admin ${user.firstName} ${user.lastName} performing ${action} on business ${businessId}`);
    // TODO: Implement actual API calls
  };

  const handleReviewAction = (reviewId: number, action: string) => {
    console.log(`Admin ${user.firstName} ${user.lastName} performing ${action} on review ${reviewId}`);
    // TODO: Implement actual API calls
  };

  const [recentUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user', joinDate: '2024-01-15', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'business', joinDate: '2024-01-14', status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'user', joinDate: '2024-01-13', status: 'pending' },
  ]);

  const [pendingReviews] = useState([
    { id: 1, business: 'Tech Solutions Inc', reviewer: 'Alice Brown', rating: 5, date: '2024-01-16', status: 'pending' },
    { id: 2, business: 'Green Café', reviewer: 'Bob Wilson', rating: 2, date: '2024-01-15', status: 'flagged' },
    { id: 3, business: 'Fix It Right', reviewer: 'Carol Davis', rating: 4, date: '2024-01-14', status: 'pending' },
  ]);

  // Load real admin data on component mount
  useEffect(() => {
    // TODO: Replace with actual API calls
    // fetchAdminStats();
    // fetchRecentUsers();
    // fetchPendingReviews();
  }, []);

  const recentBusinesses = [
    { id: 1, name: "Pizza Palace", owner: "John Doe", category: "Restaurant", status: "Verified" },
    { id: 2, name: "Tech Solutions", owner: "Jane Smith", category: "Technology", status: "Pending" },
    { id: 3, name: "Bella Salon", owner: "Maria Rodriguez", category: "Beauty", status: "Verified" },
  ];

  const flaggedContent = [
    { id: 1, type: "Review", content: "This place is terrible...", reporter: "User123", reason: "Inappropriate language" },
    { id: 2, type: "Business", content: "Fake Business Name", reporter: "User456", reason: "Fraudulent listing" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.firstName} {user.lastName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="default" className="px-3 py-1">
                {user.role.toUpperCase()}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">Last login: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
                {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalBusinesses.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Businesses</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalReviews.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.pendingReviews}</div>
              <div className="text-sm text-muted-foreground">Pending Reviews</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{stats.flaggedContent}</div>
              <div className="text-sm text-muted-foreground">Flagged Content</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline">Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserAction(user.id, 'edit')}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserAction(user.id, user.status === 'active' ? 'suspend' : 'activate')}
                            >
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="businesses" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Business Management</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBusinesses.map((business) => (
                      <TableRow key={business.id}>
                        <TableCell className="font-medium">{business.name}</TableCell>
                        <TableCell>{business.owner}</TableCell>
                        <TableCell>{business.category}</TableCell>
                        <TableCell>
                          <Badge variant={business.status === 'Verified' ? 'default' : 'secondary'}>
                            {business.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleBusinessAction(business.id, business.status === 'Verified' ? 'unverify' : 'verify')}
                            >
                              {business.status === 'Verified' ? 'Unverify' : 'Verify'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleBusinessAction(business.id, 'edit')}
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Review Management</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.business}</TableCell>
                        <TableCell>{review.reviewer}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                            <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                            <span className="ml-2 text-sm">({review.rating})</span>
                          </div>
                        </TableCell>
                        <TableCell>{review.date}</TableCell>
                        <TableCell>
                          <Badge variant={review.status === 'pending' ? 'secondary' : review.status === 'flagged' ? 'destructive' : 'default'}>
                            {review.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleReviewAction(review.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.content}</TableCell>
                        <TableCell>{item.reporter}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReviewAction(item.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleReviewAction(item.id, 'remove')}
                            >
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Advanced analytics dashboard coming soon</p>
                  <p className="text-sm text-muted-foreground">Track platform growth, user engagement, and content metrics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;