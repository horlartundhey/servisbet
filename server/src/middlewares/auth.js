const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');

// Verify JWT token middleware
const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Access denied. No token provided.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Token is no longer valid.' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
});

// Require specific role middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
