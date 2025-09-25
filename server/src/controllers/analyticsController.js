const Review = require('../models/Review');
const Business = require('../models/Business');
const ResponseTemplate = require('../models/ResponseTemplate');

// Get comprehensive analytics for a business
const getBusinessAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Verify business ownership
    if (req.user.role === 'business' && req.user.businessId !== businessId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get reviews in date range
    const reviews = await Review.find({
      business: businessId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('responses.template', 'name category');

    // Get all templates for this business
    const templates = await ResponseTemplate.find({
      $or: [
        { business: businessId },
        { business: null, isDefault: true }
      ]
    });

    // Calculate overview metrics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const reviewsWithResponses = reviews.filter(review => review.responses && review.responses.length > 0);
    const responseRate = totalReviews > 0 ? (reviewsWithResponses.length / totalReviews) * 100 : 0;
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    
    reviewsWithResponses.forEach(review => {
      if (review.responses && review.responses.length > 0) {
        const firstResponse = review.responses[0];
        const responseTime = (new Date(firstResponse.createdAt) - new Date(review.createdAt)) / (1000 * 60 * 60); // hours
        totalResponseTime += responseTime;
        responseCount++;
      }
    });
    
    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    
    // Count template usage
    const templateUsageMap = new Map();
    let templatesUsed = 0;
    
    reviewsWithResponses.forEach(review => {
      review.responses.forEach(response => {
        if (response.template) {
          const templateId = response.template._id.toString();
          templateUsageMap.set(templateId, (templateUsageMap.get(templateId) || 0) + 1);
          templatesUsed++;
        }
      });
    });

    // Generate daily trends
    const dailyTrends = generateDailyTrends(reviews, startDate, endDate);

    // Template analytics
    const templateAnalytics = generateTemplateAnalytics(templates, templateUsageMap, reviews);

    // Demographics and insights
    const demographics = generateDemographics(reviews, reviewsWithResponses);

    const analytics = {
      overview: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        responseRate: parseFloat(responseRate.toFixed(1)),
        averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
        totalResponses: reviewsWithResponses.reduce((sum, review) => sum + review.responses.length, 0),
        templatesUsed
      },
      trends: dailyTrends,
      templates: templateAnalytics,
      demographics
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting business analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data'
    });
  }
};

// Helper function to generate daily trends
const generateDailyTrends = (reviews, startDate, endDate) => {
  const days = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const reviewTrends = days.map(date => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayReviews = reviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      return reviewDate >= dayStart && reviewDate <= dayEnd;
    });

    const averageRating = dayReviews.length > 0
      ? dayReviews.reduce((sum, review) => sum + review.rating, 0) / dayReviews.length
      : 0;

    return {
      date: date.toISOString().split('T')[0],
      count: dayReviews.length,
      rating: parseFloat(averageRating.toFixed(2))
    };
  });

  const responseTrends = days.map(date => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayResponses = [];
    reviews.forEach(review => {
      if (review.responses) {
        review.responses.forEach(response => {
          const responseDate = new Date(response.createdAt);
          if (responseDate >= dayStart && responseDate <= dayEnd) {
            dayResponses.push({
              response,
              reviewDate: new Date(review.createdAt)
            });
          }
        });
      }
    });

    const averageTime = dayResponses.length > 0
      ? dayResponses.reduce((sum, item) => {
          const responseTime = (new Date(item.response.createdAt) - item.reviewDate) / (1000 * 60 * 60);
          return sum + responseTime;
        }, 0) / dayResponses.length
      : 0;

    return {
      date: date.toISOString().split('T')[0],
      count: dayResponses.length,
      averageTime: parseFloat(averageTime.toFixed(2))
    };
  });

  const ratingTrends = reviewTrends.map(day => ({
    date: day.date,
    average: day.rating,
    total: day.count
  }));

  return {
    reviews: reviewTrends,
    responses: responseTrends,
    ratings: ratingTrends
  };
};

// Helper function to generate template analytics
const generateTemplateAnalytics = (templates, templateUsageMap, reviews) => {
  const templateUsage = templates.map(template => ({
    name: template.name,
    uses: templateUsageMap.get(template._id.toString()) || 0,
    category: template.category
  })).sort((a, b) => b.uses - a.uses);

  // Calculate template performance metrics
  const templatePerformance = templates.map(template => {
    const templateId = template._id.toString();
    const usages = templateUsageMap.get(templateId) || 0;
    
    if (usages === 0) return null;

    // Find reviews that used this template
    const reviewsWithTemplate = reviews.filter(review => 
      review.responses && review.responses.some(response => 
        response.template && response.template._id.toString() === templateId
      )
    );

    const averageRating = reviewsWithTemplate.length > 0
      ? reviewsWithTemplate.reduce((sum, review) => sum + review.rating, 0) / reviewsWithTemplate.length
      : 0;

    // Calculate average response time for this template
    let totalResponseTime = 0;
    let responseCount = 0;

    reviewsWithTemplate.forEach(review => {
      const templateResponse = review.responses.find(response => 
        response.template && response.template._id.toString() === templateId
      );
      if (templateResponse) {
        const responseTime = (new Date(templateResponse.createdAt) - new Date(review.createdAt)) / (1000 * 60 * 60);
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    return {
      name: template.name,
      rating: parseFloat(averageRating.toFixed(2)),
      responseTime: parseFloat(averageResponseTime.toFixed(2))
    };
  }).filter(Boolean);

  // Calculate category performance
  const categoryMap = new Map();
  templateUsage.forEach(template => {
    const category = template.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, totalRating: 0, reviewCount: 0 });
    }
    const categoryData = categoryMap.get(category);
    categoryData.count += template.uses;

    // Find average rating for this category
    const categoryReviews = reviews.filter(review =>
      review.responses && review.responses.some(response =>
        response.template && response.template.category === category
      )
    );

    categoryData.reviewCount += categoryReviews.length;
    categoryData.totalRating += categoryReviews.reduce((sum, review) => sum + review.rating, 0);
  });

  const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    count: data.count,
    averageRating: data.reviewCount > 0 ? parseFloat((data.totalRating / data.reviewCount).toFixed(2)) : 0
  }));

  return {
    usage: templateUsage,
    performance: templatePerformance,
    categories
  };
};

// Helper function to generate demographics
const generateDemographics = (reviews, reviewsWithResponses) => {
  // Rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingCounts[review.rating]++;
  });

  const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
    rating: parseInt(rating),
    count,
    percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0
  }));

  // Response time distribution
  const responseTimeBuckets = { 
    '< 1 hour': 0, 
    '1-4 hours': 0, 
    '4-24 hours': 0, 
    '> 24 hours': 0 
  };

  reviewsWithResponses.forEach(review => {
    if (review.responses && review.responses.length > 0) {
      const firstResponse = review.responses[0];
      const responseTime = (new Date(firstResponse.createdAt) - new Date(review.createdAt)) / (1000 * 60 * 60);
      
      if (responseTime < 1) {
        responseTimeBuckets['< 1 hour']++;
      } else if (responseTime < 4) {
        responseTimeBuckets['1-4 hours']++;
      } else if (responseTime < 24) {
        responseTimeBuckets['4-24 hours']++;
      } else {
        responseTimeBuckets['> 24 hours']++;
      }
    }
  });

  const responseTimeDistribution = Object.entries(responseTimeBuckets).map(([range, count]) => ({
    range,
    count
  }));

  // Extract keywords from reviews (simplified)
  const keywordMap = new Map();
  const positiveKeywords = ['excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'perfect', 'love', 'best', 'awesome', 'friendly', 'helpful', 'quick', 'fast', 'good', 'nice'];
  const negativeKeywords = ['terrible', 'awful', 'horrible', 'bad', 'worst', 'slow', 'rude', 'poor', 'disappointing', 'unacceptable', 'disgusting'];

  reviews.forEach(review => {
    const text = (review.comment || '').toLowerCase();
    const words = text.split(/\s+/);
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        keywordMap.set(cleanWord, (keywordMap.get(cleanWord) || 0) + 1);
      }
    });
  });

  const topKeywords = Array.from(keywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => {
      const sentiment = positiveKeywords.some(pos => keyword.includes(pos)) ? 'positive' :
                       negativeKeywords.some(neg => keyword.includes(neg)) ? 'negative' : 'neutral';
      
      return {
        keyword,
        count,
        sentiment
      };
    });

  return {
    ratingDistribution,
    responseTimeDistribution,
    topKeywords
  };
};

module.exports = {
  getBusinessAnalytics
};