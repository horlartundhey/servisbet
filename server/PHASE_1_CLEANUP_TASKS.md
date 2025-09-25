# Phase 1 Cleanup Tasks

## 1. Token Cleanup Job
Add a scheduled job to clean up expired verification tokens:

```javascript
// Add to server startup
setInterval(async () => {
  await Review.updateMany(
    { 
      'anonymousReviewer.verificationTokenExpires': { $lt: new Date() },
      'anonymousReviewer.isVerified': false
    },
    { 
      $unset: { 
        'anonymousReviewer.verificationToken': 1,
        'anonymousReviewer.verificationTokenExpires': 1 
      },
      status: 'expired'
    }
  );
}, 24 * 60 * 60 * 1000); // Run daily
```

## 2. Add API Rate Limiting Middleware
```javascript
const rateLimit = require('express-rate-limit');

const anonymousReviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 reviews per IP per day
  message: 'Too many reviews from this IP. Please try again tomorrow.'
});

app.use('/api/review/anonymous', anonymousReviewLimiter);
```

## 3. Add Input Sanitization
```bash
npm install express-validator helmet
```

## 4. Add Logging
```javascript
const winston = require('winston');
// Log all review submissions, verifications, and alerts
```

## 5. Add Monitoring
- Track verification rates
- Monitor failed verification attempts  
- Alert on unusual spam activity