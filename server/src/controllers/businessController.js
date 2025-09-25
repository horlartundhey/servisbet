const Business = require('../models/Business');
const BusinessProfile = require('../models/BusinessProfile');
const asyncHandler = require('../middlewares/asyncHandler');

// Function to generate dummy images based on business category
const generateDummyImages = (category) => {
  // Using generic placeholder images from Unsplash
  const categoryMap = {
    restaurant: {
      logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&crop=center',
      cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop&crop=center',
      gallery: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&h=300&fit=crop&crop=center'
      ]
    },
    retail: {
      logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop&crop=center',
      cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop&crop=center',
      gallery: [
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=300&fit=crop&crop=center'
      ]
    },
    service: {
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop&crop=center',
      cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop&crop=center',
      gallery: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center'
      ]
    },
    default: {
      logo: 'https://images.unsplash.com/photo-1486312338219-ce68e2c6b81d?w=200&h=200&fit=crop&crop=center',
      cover: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=400&fit=crop&crop=center',
      gallery: [
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop&crop=center'
      ]
    }
  };
  
  return categoryMap[category?.toLowerCase()] || categoryMap.default;
};

// @desc    Get all businesses
// @route   GET /api/business
// @access  Public
const getBusinesses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    city,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    latitude,
    longitude,
    radius = 10000
  } = req.query;

  // Include all approved and active businesses (with or without complete images)
  let query = { 
    verificationStatus: 'approved', 
    isActive: true
  };
  let sort = {}; // Initialize sort object

  // Build query
  if (category) {
    query.category = category;
  }

  if (city) {
    query['address.city'] = new RegExp(city, 'i');
  }

  // Location-based search (if using coordinates)
  if (latitude && longitude) {
    // Use MongoDB's geospatial query for proper distance calculation
    query['address.coordinates'] = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)] // [lng, lat]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    };
  }

  // Text search
  if (search) {
    query.$or = [
      { businessName: new RegExp(search, 'i') },
      { businessDescription: new RegExp(search, 'i') },
      { category: new RegExp(search, 'i') }
    ];
  }

  // Sorting
  sort[sortBy] = order === 'asc' ? 1 : -1;

  const businesses = await BusinessProfile.find(query)
    .populate('owner', 'firstName lastName email')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await BusinessProfile.countDocuments(query);

  // Transform BusinessProfile data to match frontend expectations
  const transformedBusinesses = businesses.map(business => {
    // Check if business has complete images
    const hasCompleteImages = business.images?.logo && 
                             business.images?.cover && 
                             business.images?.gallery?.length >= 2;
    
    // Generate dummy images if needed
    const dummyImages = hasCompleteImages ? null : generateDummyImages(business.category);
    
    return {
      _id: business._id,
      name: business.businessName,
      businessName: business.businessName,
      description: business.businessDescription,
      category: business.category,
      businessCategory: business.category,
      email: business.businessEmail,
      phone: business.businessPhone,
      website: business.website,
      address: business.address,
      images: hasCompleteImages ? [
        business.images.logo,
        business.images.cover,
        ...(business.images.gallery || [])
      ].filter(Boolean) : [
        dummyImages.logo,
        dummyImages.cover,
        ...dummyImages.gallery
      ],
      logo: business.images?.logo || dummyImages?.logo,
      cover: business.images?.cover || dummyImages?.cover,
      averageRating: business.stats?.averageRating || 0,
      totalReviews: business.stats?.totalReviews || 0,
      verificationStatus: business.verificationStatus,
      isActive: business.isActive,
      owner: business.owner,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      hasRealImages: hasCompleteImages // Flag to indicate if images are real or dummy
    };
  });

  res.status(200).json({
    success: true,
    count: transformedBusinesses.length,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    businesses: transformedBusinesses, // Changed from 'data' to 'businesses' to match frontend
    total: total,
    totalPages: Math.ceil(total / limit)
  });
});

// @desc    Get single business
// @route   GET /api/business/:id
// @access  Public
const getBusiness = asyncHandler(async (req, res) => {
  console.log('🔍 getBusiness called with ID/slug:', req.params.id);
  
  // Use same filtering as getBusinesses - only require approved and active
  const business = await BusinessProfile.findOne({ 
    $or: [{ _id: req.params.id }, { businessSlug: req.params.id }],
    verificationStatus: 'approved',
    isActive: true
  }).populate('owner', 'firstName lastName email');

  console.log('🏢 Business found:', business ? 'YES' : 'NO');
  
  if (!business) {
    console.log('❌ Business not found with filters:', {
      id: req.params.id,
      filters: { verificationStatus: 'approved', status: 'active' }
    });
    
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  console.log('✅ Returning business data for:', business.businessName);
  
  // Transform BusinessProfile data to match frontend expectations
  // Check if business has complete images
  const hasCompleteImages = business.images?.logo && 
                           business.images?.cover && 
                           business.images?.gallery?.length >= 2;
  
  // Generate dummy images if needed
  const dummyImages = hasCompleteImages ? null : generateDummyImages(business.category);
  
  const transformedBusiness = {
    _id: business._id,
    name: business.businessName,
    businessName: business.businessName,
    description: business.businessDescription,
    category: business.category,
    businessCategory: business.category,
    email: business.businessEmail,
    phone: business.businessPhone,
    website: business.website,
    address: business.address,
    images: hasCompleteImages ? [
      business.images.logo,
      business.images.cover,
      ...(business.images.gallery || [])
    ].filter(Boolean) : [
      dummyImages.logo,
      dummyImages.cover,
      ...dummyImages.gallery
    ],
    logo: business.images?.logo || dummyImages?.logo,
    cover: business.images?.cover || dummyImages?.cover,
    averageRating: business.stats?.averageRating || 0,
    totalReviews: business.stats?.totalReviews || 0,
    verificationStatus: business.verificationStatus,
    isActive: business.isActive,
    owner: business.owner,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    hasRealImages: hasCompleteImages // Flag to indicate if images are real or dummy
  };
  
  res.status(200).json({
    success: true,
    data: transformedBusiness
  });
});

// @desc    Create new business
// @route   POST /api/business
// @access  Private (Business users only)
const createBusiness = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.owner = req.user.id;

  const business = await BusinessProfile.create(req.body);

  res.status(201).json({
    success: true,
    data: business,
    message: 'Business created successfully'
  });
});

// @desc    Create additional business (for multi-business)
// @route   POST /api/business/create-additional
// @access  Private (Business users only)
const createAdditionalBusiness = asyncHandler(async (req, res) => {
  // Check if user already has maximum allowed businesses (optional limit)
  const existingBusinesses = await BusinessProfile.countDocuments({ 
    owner: req.user.id, 
    isActive: true 
  });
  
  const MAX_BUSINESSES = 5; // Configure as needed
  if (existingBusinesses >= MAX_BUSINESSES) {
    return res.status(400).json({
      success: false,
      message: `Maximum ${MAX_BUSINESSES} businesses allowed per account`
    });
  }

  // Add user to req.body
  req.body.owner = req.user.id;
  req.body.isPrimary = false; // Additional businesses are not primary by default

  const business = await BusinessProfile.create(req.body);

  res.status(201).json({
    success: true,
    data: business,
    message: 'Additional business created successfully'
  });
});

// @desc    Get user's businesses
// @route   GET /api/business/my-businesses
// @access  Private (Business users only)
const getMyBusinesses = asyncHandler(async (req, res) => {
  const businesses = await BusinessProfile.getUserBusinesses(req.user.id, true);

  // Transform the data to match frontend interface
  const transformedBusinesses = businesses.map(business => ({
    _id: business._id,
    name: business.businessName,
    description: business.businessDescription,
    category: business.category,
    address: business.address,
    location: business.location,
    phone: business.businessPhone,
    email: business.businessEmail,
    website: business.website,
    hours: business.businessHours,
    images: business.images || [],
    owner: business.owner,
    averageRating: business.averageRating || 0,
    totalReviews: business.totalReviews || 0,
    isVerified: business.verificationStatus === 'approved',
    isActive: business.isActive,
    verificationStatus: business.verificationStatus,
    verificationNotes: business.verificationNotes,
    verifiedAt: business.verifiedAt,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt
  }));

  res.status(200).json({
    success: true,
    count: transformedBusinesses.length,
    data: transformedBusinesses
  });
});

// @desc    Get user's primary business
// @route   GET /api/business/my-primary
// @access  Private (Business users only)
const getMyPrimaryBusiness = asyncHandler(async (req, res) => {
  const business = await BusinessProfile.getUserPrimaryBusiness(req.user.id);

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'No primary business found'
    });
  }

  res.status(200).json({
    success: true,
    data: business
  });
});

// @desc    Set business as primary
// @route   PUT /api/business/:id/set-primary
// @access  Private (Owner only)
const setPrimaryBusiness = asyncHandler(async (req, res) => {
  const business = await BusinessProfile.findOne({
    _id: req.params.id,
    owner: req.user.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  await business.setPrimary();

  res.status(200).json({
    success: true,
    data: business,
    message: 'Business set as primary'
  });
});

// @desc    Get business by slug
// @route   GET /api/business/slug/:slug
// @access  Public
const getBusinessBySlug = asyncHandler(async (req, res) => {
  const business = await BusinessProfile.findBySlug(req.params.slug)
    .populate('owner', 'name email');

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  res.status(200).json({
    success: true,
    data: business
  });
});

// @desc    Update business
// @route   PUT /api/business/:id
// @access  Private (Owner or Admin)
const updateBusiness = asyncHandler(async (req, res) => {
  let business = await BusinessProfile.findOne({
    _id: req.params.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Make sure user is business owner or admin
  if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this business'
    });
  }

  business = await BusinessProfile.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: business,
    message: 'Business updated successfully'
  });
});

// @desc    Delete business (soft delete)
// @route   DELETE /api/business/:id
// @access  Private (Owner or Admin)
const deleteBusiness = asyncHandler(async (req, res) => {
  const business = await BusinessProfile.findOne({
    _id: req.params.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Make sure user is business owner or admin
  if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this business'
    });
  }

  // Soft delete
  await business.deactivate();

  res.status(200).json({
    success: true,
    message: 'Business deactivated successfully'
  });
});

// @desc    Get businesses owned by user
// @route   GET /api/business/my-businesses
// @access  Private (Business users only)
// [This is handled by the new getMyBusinesses function above]

// @desc    Get business analytics
// @route   GET /api/business/:id/analytics
// @access  Private (Owner or Admin)
const getBusinessAnalytics = asyncHandler(async (req, res) => {
  const business = await BusinessProfile.findOne({
    _id: req.params.id,
    isActive: true
  });

  if (!business) {
    return res.status(404).json({
      success: false,
      message: 'Business not found'
    });
  }

  // Make sure user is business owner or admin
  if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view analytics for this business'
    });
  }

  // Get review statistics
  const Review = require('../models/Review');
  
  const reviewStats = await Review.aggregate([
    { $match: { business: business._id } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingBreakdown: {
          $push: '$rating'
        }
      }
    }
  ]);

  // Calculate rating breakdown
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (reviewStats[0]) {
    reviewStats[0].ratingBreakdown.forEach(rating => {
      ratingCounts[rating]++;
    });
  }

  // Get recent reviews
  const recentReviews = await Review.find({ business: business._id })
    .populate('user', 'name')
    .sort('-createdAt')
    .limit(5);

  const analytics = {
    business: {
      name: business.businessName,
      totalReviews: reviewStats[0]?.totalReviews || 0,
      averageRating: reviewStats[0]?.averageRating || 0,
      profileCompletion: business.completionPercentage
    },
    ratingBreakdown: ratingCounts,
    recentReviews
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});

module.exports = {
  getBusinesses,
  getBusiness,
  createBusiness,
  createAdditionalBusiness,
  updateBusiness,
  deleteBusiness,
  getMyBusinesses,
  getMyPrimaryBusiness,
  setPrimaryBusiness,
  getBusinessBySlug,
  getBusinessAnalytics
};
