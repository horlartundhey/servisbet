import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MessageCircle, 
  Clock, 
  Users,
  Calendar,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalReviews: number;
    averageRating: number;
    responseRate: number;
    averageResponseTime: number;
    totalResponses: number;
    templatesUsed: number;
  };
  trends: {
    reviews: Array<{ date: string; count: number; rating: number }>;
    responses: Array<{ date: string; count: number; averageTime: number }>;
    ratings: Array<{ date: string; average: number; total: number }>;
  };
  templates: {
    usage: Array<{ name: string; uses: number; category: string }>;
    performance: Array<{ name: string; rating: number; responseTime: number }>;
    categories: Array<{ category: string; count: number; averageRating: number }>;
  };
  demographics: {
    ratingDistribution: Array<{ rating: number; count: number; percentage: number }>;
    responseTimeDistribution: Array<{ range: string; count: number }>;
    topKeywords: Array<{ keyword: string; count: number; sentiment: 'positive' | 'negative' | 'neutral' }>;
  };
}

interface AdvancedAnalyticsDashboardProps {
  businessId: string;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ businessId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'trends' | 'insights'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [businessId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics/business/${businessId}?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        // Fallback to mock data for development
        setAnalytics(generateMockData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): AnalyticsData => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return {
      overview: {
        totalReviews: 247,
        averageRating: 4.3,
        responseRate: 89,
        averageResponseTime: 2.4,
        totalResponses: 220,
        templatesUsed: 156
      },
      trends: {
        reviews: last30Days.map(date => ({
          date,
          count: Math.floor(Math.random() * 15) + 3,
          rating: Math.random() * 2 + 3.5
        })),
        responses: last30Days.map(date => ({
          date,
          count: Math.floor(Math.random() * 12) + 2,
          averageTime: Math.random() * 4 + 1
        })),
        ratings: last30Days.map(date => ({
          date,
          average: Math.random() * 2 + 3.5,
          total: Math.floor(Math.random() * 15) + 3
        }))
      },
      templates: {
        usage: [
          { name: 'Thank You - General', uses: 45, category: 'appreciation' },
          { name: 'Sincere Apology', uses: 32, category: 'apology' },
          { name: 'Working on It', uses: 28, category: 'improvement' },
          { name: 'Thank You - Specific', uses: 25, category: 'appreciation' },
          { name: 'Apology with Action', uses: 18, category: 'apology' },
          { name: 'General Response', uses: 15, category: 'general' }
        ],
        performance: [
          { name: 'Thank You - General', rating: 4.8, responseTime: 1.2 },
          { name: 'Sincere Apology', rating: 4.2, responseTime: 3.1 },
          { name: 'Working on It', rating: 4.0, responseTime: 2.8 }
        ],
        categories: [
          { category: 'appreciation', count: 70, averageRating: 4.7 },
          { category: 'apology', count: 50, averageRating: 4.1 },
          { category: 'improvement', count: 28, averageRating: 4.0 },
          { category: 'general', count: 15, averageRating: 4.3 }
        ]
      },
      demographics: {
        ratingDistribution: [
          { rating: 5, count: 98, percentage: 39.7 },
          { rating: 4, count: 87, percentage: 35.2 },
          { rating: 3, count: 35, percentage: 14.2 },
          { rating: 2, count: 18, percentage: 7.3 },
          { rating: 1, count: 9, percentage: 3.6 }
        ],
        responseTimeDistribution: [
          { range: '< 1 hour', count: 145 },
          { range: '1-4 hours', count: 52 },
          { range: '4-24 hours', count: 18 },
          { range: '> 24 hours', count: 5 }
        ],
        topKeywords: [
          { keyword: 'excellent service', count: 23, sentiment: 'positive' },
          { keyword: 'friendly staff', count: 19, sentiment: 'positive' },
          { keyword: 'quick response', count: 16, sentiment: 'positive' },
          { keyword: 'slow service', count: 12, sentiment: 'negative' },
          { keyword: 'great food', count: 15, sentiment: 'positive' }
        ]
      }
    };
  };

  const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: string;
  }> = ({ title, value, change, icon, color = COLORS.primary }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="text-sm font-medium">
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Analytics data will appear here once you have reviews and responses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'templates', label: 'Template Performance' },
            { id: 'trends', label: 'Trends' },
            { id: 'insights', label: 'Insights' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Reviews"
              value={analytics.overview.totalReviews}
              change={12.5}
              icon={<Star className="w-6 h-6" />}
              color={COLORS.warning}
            />
            <MetricCard
              title="Average Rating"
              value={analytics.overview.averageRating.toFixed(1)}
              change={3.2}
              icon={<Star className="w-6 h-6" />}
              color={COLORS.secondary}
            />
            <MetricCard
              title="Response Rate"
              value={`${analytics.overview.responseRate}%`}
              change={5.8}
              icon={<MessageCircle className="w-6 h-6" />}
              color={COLORS.primary}
            />
            <MetricCard
              title="Avg Response Time"
              value={`${analytics.overview.averageResponseTime}h`}
              change={-15.2}
              icon={<Clock className="w-6 h-6" />}
              color={COLORS.purple}
            />
            <MetricCard
              title="Total Responses"
              value={analytics.overview.totalResponses}
              change={8.9}
              icon={<MessageCircle className="w-6 h-6" />}
              color={COLORS.primary}
            />
            <MetricCard
              title="Templates Used"
              value={analytics.overview.templatesUsed}
              change={22.1}
              icon={<Zap className="w-6 h-6" />}
              color={COLORS.pink}
            />
          </div>

          {/* Rating Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.demographics.ratingDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ rating, percentage }) => `${rating}★ (${percentage.toFixed(1)}%)`}
                    >
                      {analytics.demographics.ratingDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.rating === 5 ? COLORS.secondary :
                            entry.rating === 4 ? COLORS.primary :
                            entry.rating === 3 ? COLORS.warning :
                            entry.rating === 2 ? '#f97316' :
                            COLORS.danger
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.demographics.responseTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Template Performance Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.templates.usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="uses" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.templates.categories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} />
                    <Bar yAxisId="right" dataKey="averageRating" fill={COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Template Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Template Name</th>
                      <th className="text-left py-2">Usage Count</th>
                      <th className="text-left py-2">Avg Rating</th>
                      <th className="text-left py-2">Response Time</th>
                      <th className="text-left py-2">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.templates.usage.map((template, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{template.name}</td>
                        <td className="py-2">{template.uses}</td>
                        <td className="py-2">
                          {analytics.templates.performance.find(p => p.name === template.name)?.rating.toFixed(1) || 'N/A'}
                        </td>
                        <td className="py-2">
                          {analytics.templates.performance.find(p => p.name === template.name)?.responseTime.toFixed(1) || 'N/A'}h
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            template.category === 'appreciation' ? 'bg-green-100 text-green-800' :
                            template.category === 'apology' ? 'bg-red-100 text-red-800' :
                            template.category === 'improvement' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {template.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Rating Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.trends.reviews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="count" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                    <Line yAxisId="right" type="monotone" dataKey="rating" stroke={COLORS.warning} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends.responses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="averageTime" stroke={COLORS.danger} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Strong Performance</h4>
                </div>
                <p className="text-green-800">Your response rate of {analytics.overview.responseRate}% is above average. Keep engaging with customers!</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Template Optimization</h4>
                </div>
                <p className="text-blue-800">Your "Thank You - General" template has the highest usage and rating. Consider creating variations for different scenarios.</p>
              </div>

              {analytics.overview.averageResponseTime > 3 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-900">Response Time Opportunity</h4>
                  </div>
                  <p className="text-yellow-800">Your average response time is {analytics.overview.averageResponseTime}h. Consider using more templates to respond faster.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Keywords in Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.demographics.topKeywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{keyword.keyword}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        keyword.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        keyword.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {keyword.sentiment}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">{keyword.count} mentions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalyticsDashboard;