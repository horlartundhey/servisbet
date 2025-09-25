# Phase 2 Implementation Plan (2-3 weeks)

## Overview
Phase 2 focuses on building the core business management features that are currently missing from your platform. These features will enable business owners to manage multiple locations, provide advanced review moderation, and enhance business response capabilities.

---

## 🎯 **Feature 1: Multi-Business Registration Flow**
**Priority: HIGH** | **Time Estimate: 1 week**

### Current State
- ✅ Single business per business user
- ✅ Basic business profile creation
- ❌ No multi-location support
- ❌ No business relationship management

### What to Build

#### 1.1 Database Schema Updates
```javascript
// Add to Business model
const businessSchema = new mongoose.Schema({
  // Existing fields...
  
  // Multi-business support
  parentBusiness: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    default: null // null for parent businesses
  },
  isMainLocation: {
    type: Boolean,
    default: true
  },
  locationName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  businessChain: {
    chainName: String,
    chainId: String,
    totalLocations: Number
  }
});

// Add to User model
const userSchema = new mongoose.Schema({
  // Existing fields...
  
  // Multi-business management
  managedBusinesses: [{
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business'
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'admin'],
      default: 'owner'
    },
    permissions: [{
      type: String,
      enum: ['view', 'respond', 'edit', 'analytics', 'manage_staff']
    }],
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
});
```

#### 1.2 API Endpoints to Create
```javascript
// New routes for multi-business management
POST   /api/business/create-location        // Add new location
GET    /api/business/my-locations          // Get all user's businesses
POST   /api/business/:id/add-manager       // Add business manager
DELETE /api/business/:id/remove-manager    // Remove business manager
GET    /api/business/:id/managers          // Get business managers
POST   /api/business/transfer-ownership    // Transfer business ownership
GET    /api/business/chain/:chainId        // Get all locations in chain
```

#### 1.3 Frontend Components
- **Business Location Selector**: Dropdown/tabs to switch between locations
- **Add New Location Form**: Multi-step location creation
- **Location Management Dashboard**: Centralized location overview
- **Staff Management Panel**: Invite and manage location staff
- **Business Chain Setup**: Configure multi-location business chains

#### 1.4 Implementation Steps
1. **Week 1 Day 1-2**: Update database schemas and run migrations
2. **Week 1 Day 3-4**: Build backend API endpoints and controllers
3. **Week 1 Day 5-7**: Create frontend components and routing

---

## 🎯 **Feature 2: Advanced Review Moderation System**
**Priority: HIGH** | **Time Estimate: 1 week**

### Current State
- ✅ Basic admin approve/reject
- ✅ Simple flagging system
- ❌ No automated moderation
- ❌ No spam detection algorithms
- ❌ No content filtering

### What to Build

#### 2.1 Automated Moderation Engine
```javascript
// Add to Review model
const reviewSchema = new mongoose.Schema({
  // Existing fields...
  
  // Advanced moderation fields
  moderationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  moderationFlags: [{
    type: {
      type: String,
      enum: ['spam', 'profanity', 'fake', 'inappropriate', 'personal_info', 'competitor']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    reason: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  autoModerationResult: {
    action: {
      type: String,
      enum: ['approve', 'reject', 'flag', 'quarantine'],
      default: 'approve'
    },
    confidence: Number,
    reasons: [String]
  }
});
```

#### 2.2 Moderation Algorithms
```javascript
// services/moderationService.js
class ModerationService {
  // Spam detection
  async detectSpam(review) {
    let spamScore = 0;
    
    // Check for spam indicators
    if (this.hasRepeatedText(review.content)) spamScore += 30;
    if (this.hasExcessiveCaps(review.content)) spamScore += 20;
    if (this.hasSuspiciousPatterns(review.content)) spamScore += 25;
    if (await this.isDuplicateContent(review)) spamScore += 40;
    
    return spamScore;
  }
  
  // Profanity detection
  async detectProfanity(content) {
    // Implement profanity detection logic
  }
  
  // Fake review detection
  async detectFakeReview(review) {
    // Check review patterns, timing, user behavior
  }
}
```

#### 2.3 Admin Moderation Dashboard
- **Moderation Queue**: Reviews pending manual review
- **Auto-Moderation Settings**: Configure sensitivity levels
- **Moderation Analytics**: Track moderation metrics
- **Bulk Actions**: Approve/reject multiple reviews
- **Appeal System**: Handle disputed moderation decisions

#### 2.4 Implementation Steps
1. **Week 2 Day 1-2**: Build moderation algorithms and scoring
2. **Week 2 Day 3-4**: Create admin moderation dashboard
3. **Week 2 Day 5**: Implement automated moderation pipeline
4. **Week 2 Day 6-7**: Testing and fine-tuning algorithms

---

## 🎯 **Feature 3: Business Response Enhancements**
**Priority: MEDIUM** | **Time Estimate: 1 week**

### Current State
- ✅ Basic text responses
- ❌ No response templates
- ❌ No response analytics
- ❌ No bulk response tools

### What to Build

#### 3.1 Response Templates System
```javascript
// New model: ResponseTemplate
const responseTemplateSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'complaint', 'compliment'],
    required: true
  },
  template: {
    type: String,
    required: true,
    maxlength: 1000
  },
  placeholders: [{
    name: String,
    description: String,
    required: Boolean
  }],
  usageCount: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});
```

#### 3.2 Enhanced Response Features
- **Template Library**: Pre-built response templates
- **Custom Templates**: Business-specific template creation
- **Template Variables**: Dynamic content insertion (customer name, etc.)
- **Response Scheduling**: Schedule responses for optimal timing
- **Bulk Response Tools**: Respond to multiple reviews at once
- **Response Analytics**: Track response effectiveness

#### 3.3 API Endpoints
```javascript
GET    /api/response-templates                    // Get all templates
POST   /api/response-templates                    // Create template
PUT    /api/response-templates/:id               // Update template
DELETE /api/response-templates/:id               // Delete template
POST   /api/reviews/bulk-respond                 // Bulk respond to reviews
GET    /api/reviews/response-analytics          // Response analytics
```

#### 3.4 Frontend Components
- **Template Manager**: Create and organize templates
- **Response Editor**: Enhanced response writing with templates
- **Bulk Response Interface**: Multi-select and bulk actions
- **Response Analytics Dashboard**: Performance metrics

#### 3.5 Implementation Steps
1. **Week 3 Day 1-2**: Build response template system
2. **Week 3 Day 3-4**: Create enhanced response interface
3. **Week 3 Day 5-6**: Implement bulk response tools
4. **Week 3 Day 7**: Add response analytics tracking

---

## 📋 **Testing Checklist for Phase 2**

### Multi-Business Registration
- [ ] Create parent business successfully
- [ ] Add multiple locations to business
- [ ] Manage staff across locations
- [ ] Switch between business locations
- [ ] Transfer business ownership
- [ ] Location-specific permissions work correctly

### Review Moderation
- [ ] Spam reviews are automatically flagged
- [ ] Profanity detection works accurately  
- [ ] Admin moderation queue functions properly
- [ ] Bulk moderation actions work
- [ ] Appeal system handles disputes
- [ ] Moderation analytics show correct metrics

### Business Responses
- [ ] Create and use response templates
- [ ] Template variables populate correctly
- [ ] Bulk respond to multiple reviews
- [ ] Schedule responses for later
- [ ] Response analytics track effectiveness
- [ ] Custom templates save and load properly

---

## 🎯 **Success Metrics for Phase 2**

### Multi-Business Management
- Business owners can manage 5+ locations efficiently
- 80% of business users utilize location switching
- Staff invitation acceptance rate >70%

### Review Moderation
- 90% spam detection accuracy
- 95% reduction in manual moderation time
- <24 hour average moderation response time

### Enhanced Responses
- 60% of businesses use response templates
- 40% increase in response rate
- 25% improvement in response consistency

---

## 🔄 **Phase 2 to Phase 3 Transition**

After completing Phase 2, you'll have:
- ✅ Multi-business management capabilities
- ✅ Advanced automated moderation
- ✅ Enhanced business response tools

This creates the foundation for Phase 3 features:
- **Promotional System**: Can promote across multiple locations
- **Advanced Analytics**: Can analyze data across business chains
- **Reviews Slider**: Can showcase reviews from all locations

**Estimated Total Time: 3 weeks**
**Team Size: 2-3 developers**
**Priority Order: Multi-business → Moderation → Responses**