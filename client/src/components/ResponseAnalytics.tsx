import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Target, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface ResponseAnalyticsProps {
  businessId: string;
}

export const ResponseAnalytics: React.FC<ResponseAnalyticsProps> = ({ businessId }) => {
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [scheduledResponses, setScheduledResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    loadScheduledResponses();
  }, [businessId]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/bulk-response/business/${businessId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load response analytics",
        variant: "destructive",
      });
    }
  };

  const loadScheduledResponses = async () => {
    try {
      const response = await fetch(`/api/bulk-response/business/${businessId}/scheduled`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setScheduledResponses(data.scheduledResponses);
      }
    } catch (error) {
      console.error('Error loading scheduled responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelScheduledResponse = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/bulk-response/scheduled/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Scheduled response cancelled successfully",
        });
        await loadScheduledResponses();
      } else {
        throw new Error('Failed to cancel scheduled response');
      }
    } catch (error) {
      console.error('Error cancelling scheduled response:', error);
      toast({
        title: "Error",
        description: "Failed to cancel scheduled response",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Unable to load analytics data</p>
      </div>
    );
  }

  // Prepare chart data
  const templateUsageData = analytics.templates.map((template: any) => ({
    name: template.name.substring(0, 15) + (template.name.length > 15 ? '...' : ''),
    total: template.usage.totalUses || 0,
    scheduled: template.usage.scheduledUses || 0,
    manual: (template.usage.totalUses || 0) - (template.usage.scheduledUses || 0)
  }));

  const responseTypeData = [
    { name: 'Manual Responses', value: analytics.responses.manual, color: '#8884d8' },
    { name: 'Scheduled Responses', value: analytics.responses.scheduled, color: '#82ca9d' }
  ];

  const schedulingStatusData = [
    { name: 'Pending', value: analytics.scheduling.pending, color: '#fbbf24' },
    { name: 'Completed', value: analytics.scheduling.completed, color: '#10b981' },
    { name: 'Failed', value: analytics.scheduling.failed, color: '#ef4444' },
    { name: 'Cancelled', value: analytics.scheduling.cancelled, color: '#6b7280' }
  ];

  const hourlyDistribution = analytics.scheduling.mostActiveHours.distribution.map((count: number, hour: number) => ({
    hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
    count
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responses.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.responses.responseRate.toFixed(1)}% response rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Responses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.responses.scheduled}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.scheduling.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates Used</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.templates.length}</div>
            <p className="text-xs text-muted-foreground">
              Active templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Responses/Schedule</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.scheduling.averageResponsesPerSchedule.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.scheduling.totalScheduled} total schedules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Template Usage</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="scheduled-list">Scheduled Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={responseTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {responseTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduling Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={schedulingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {schedulingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Usage Statistics</CardTitle>
              <CardDescription>
                Compare how often each template is used for manual vs scheduled responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={templateUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="manual" stackId="a" fill="#8884d8" name="Manual" />
                  <Bar dataKey="scheduled" stackId="a" fill="#82ca9d" name="Scheduled" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.templates.map((template: any) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Category: {template.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{template.usage.totalUses || 0} uses</div>
                      <div className="text-sm text-muted-foreground">
                        {template.usage.scheduledUses || 0} scheduled
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Activity by Hour</CardTitle>
              <CardDescription>
                When you typically schedule responses (24-hour format)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Active Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.scheduling.mostActiveHours.hour === 0 ? '12 AM' : 
                   analytics.scheduling.mostActiveHours.hour < 12 ? `${analytics.scheduling.mostActiveHours.hour} AM` : 
                   analytics.scheduling.mostActiveHours.hour === 12 ? '12 PM' : 
                   `${analytics.scheduling.mostActiveHours.hour - 12} PM`}
                </div>
                <p className="text-sm text-muted-foreground">
                  {analytics.scheduling.mostActiveHours.count} schedules
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analytics.scheduling.recentActivity}
                </div>
                <p className="text-sm text-muted-foreground">
                  Schedules in last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.scheduling.totalScheduled > 0 ? 
                    ((analytics.scheduling.completed / analytics.scheduling.totalScheduled) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Successful executions
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scheduled-list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Responses</CardTitle>
              <CardDescription>
                Manage your upcoming and past scheduled responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledResponses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scheduled responses found
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledResponses.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">
                            {schedule.templateName}
                          </h4>
                          <Badge 
                            variant={
                              schedule.status === 'pending' ? 'default' :
                              schedule.status === 'completed' ? 'secondary' :
                              schedule.status === 'failed' ? 'destructive' :
                              'outline'
                            }
                          >
                            {schedule.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {schedule.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {schedule.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                            {schedule.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                            {schedule.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <strong>Scheduled:</strong> {new Date(schedule.scheduledTime).toLocaleString()}
                          </div>
                          <div>
                            <strong>Responses:</strong> {schedule.responseCount}
                          </div>
                          <div>
                            <strong>Created:</strong> {new Date(schedule.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {schedule.results && (
                          <div className="mt-2 text-sm">
                            <span className="text-green-600">
                              ✓ {schedule.results.successful} successful
                            </span>
                            {schedule.results.failed > 0 && (
                              <span className="text-red-600 ml-4">
                                ✗ {schedule.results.failed} failed
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4">
                        {schedule.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelScheduledResponse(schedule.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};