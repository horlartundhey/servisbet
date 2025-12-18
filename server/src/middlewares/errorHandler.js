// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    let message = 'Duplicate field value entered';
    
    // Provide more specific error messages
    if (field === 'businessSlug') {
      message = 'A business with this name already exists. Please use a different name.';
    } else if (field === 'businessEmail') {
      message = 'This email address is already registered to another business.';
    } else if (field === 'businessPhone') {
      message = 'This phone number is already registered to another business.';
    } else if (field) {
      message = `This ${field} is already in use. Please use a different value.`;
    }
    
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
