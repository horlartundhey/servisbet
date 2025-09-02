# Environment Variables Configuration

## Required Environment Variables

Copy this template to your `.env` file and replace the placeholder values with your actual credentials:

```env
# Database Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
DB_NAME=servisbeta

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Settings
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000

# Cloudinary Configuration (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Optional - for future features)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@servisbeta.com

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Settings (Optional)
MAX_FILE_SIZE=5242880
MAX_FILES_PER_REQUEST=10

# Security (Optional)
BCRYPT_SALT_ROUNDS=12
```

## Variable Descriptions

### ✅ **REQUIRED FOR BASIC FUNCTIONALITY**

#### Database
- **`MONGO_URI`**: Your MongoDB connection string
  - Get from MongoDB Atlas dashboard
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

#### Authentication
- **`JWT_SECRET`**: Secret key for JWT token signing
  - Should be a long, random string
  - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

#### Cloudinary (for image uploads)
- **`CLOUDINARY_CLOUD_NAME`**: Your Cloudinary cloud name
- **`CLOUDINARY_API_KEY`**: Your Cloudinary API key  
- **`CLOUDINARY_API_SECRET`**: Your Cloudinary API secret
  - Get all three from [Cloudinary Dashboard](https://cloudinary.com/console)

### ⚙️ **OPTIONAL (with defaults)**

#### Server
- **`PORT`**: Server port (default: 5000)
- **`NODE_ENV`**: Environment (development/production)
- **`JWT_EXPIRE`**: JWT expiration time (default: 30d)

#### CORS
- **`CLIENT_URL`**: Main frontend URL
- **`ALLOWED_ORIGINS`**: Comma-separated list of allowed origins

#### Security
- **`BCRYPT_SALT_ROUNDS`**: Password hashing rounds (default: 12)

#### File Upload
- **`MAX_FILE_SIZE`**: Max file size in bytes (default: 5MB)
- **`MAX_FILES_PER_REQUEST`**: Max files per upload (default: 10)

#### Email (for future features)
- **`EMAIL_HOST`**: SMTP server host
- **`EMAIL_PORT`**: SMTP server port
- **`EMAIL_USER`**: Email username
- **`EMAIL_PASS`**: Email password (use app password for Gmail)
- **`EMAIL_FROM`**: From email address

#### Rate Limiting
- **`RATE_LIMIT_WINDOW_MS`**: Time window in milliseconds
- **`RATE_LIMIT_MAX_REQUESTS`**: Max requests per window

## How to Get Required Credentials

### 1. MongoDB URI
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create account and cluster
3. Go to "Connect" → "Connect your application"
4. Copy connection string
5. Replace `<username>`, `<password>`, and `<database>`

### 2. JWT Secret
Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Cloudinary Credentials
1. Go to [Cloudinary](https://cloudinary.com/)
2. Create free account
3. Go to Dashboard
4. Copy Cloud Name, API Key, and API Secret

## Minimum Required .env for Testing

For basic testing, you only need:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Production
```env
NODE_ENV=production
PORT=80
CLIENT_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use strong, unique passwords** and secrets
3. **Rotate secrets regularly** in production
4. **Use environment-specific values** for different deployments
5. **Limit database user permissions** to minimum required
6. **Use MongoDB Atlas IP whitelist** for additional security

## Troubleshooting

### Common Issues
- **MongoDB Connection Error**: Check MONGO_URI format and credentials
- **JWT Token Invalid**: Verify JWT_SECRET is set correctly
- **Cloudinary Upload Fails**: Verify all three Cloudinary credentials
- **CORS Errors**: Check ALLOWED_ORIGINS includes your frontend URL
- **Port Already in Use**: Change PORT value or kill existing process
