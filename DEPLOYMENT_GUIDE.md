# 🚀 Vercel Deployment Guide

## Quick Deployment Steps

### 1. **Prepare Environment Variables**

Before deploying, gather these essential credentials:

#### Required Backend Variables:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/servisbeta?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=horlartundhey@gmail.com
EMAIL_PASS=your_gmail_app_password
```

#### Required Frontend Variables:
```
VITE_API_BASE_URL=https://your-vercel-app.vercel.app/api
```

### 2. **Deploy to Vercel**

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import this repository from GitHub
4. Vercel will automatically detect the configuration
5. Add environment variables in "Environment Variables" section
6. Click "Deploy"

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts and set up environment variables
```

### 3. **Configure Environment Variables in Vercel**

In your Vercel project dashboard:
1. Go to "Settings" → "Environment Variables"
2. Add each variable:
   - **Name**: `MONGO_URI`
   - **Value**: Your MongoDB connection string
   - **Environment**: Production, Preview, Development

Repeat for all required variables.

### 4. **Update Frontend API URL**

After deployment, update `VITE_API_BASE_URL` with your actual Vercel URL:
```
VITE_API_BASE_URL=https://your-actual-vercel-app.vercel.app/api
```

### 5. **Test Deployment**

Visit your deployed app and test:
- ✅ Homepage loads
- ✅ User registration/login
- ✅ Email verification works
- ✅ Dashboard functionality
- ✅ API endpoints respond

## 🔧 Pre-Deployment Checklist

### Frontend Optimizations ✅
- [x] Vite build configuration optimized
- [x] Environment variables configured
- [x] Code splitting implemented
- [x] Production build tested locally

### Backend Optimizations ✅
- [x] Serverless function entry point created
- [x] Database connection handling for serverless
- [x] CORS configured for production
- [x] Error handling implemented
- [x] Health check endpoints added

### Configuration Files ✅
- [x] `vercel.json` - Deployment configuration
- [x] `.vercelignore` - Files to exclude from deployment
- [x] `.env.example` - Environment variable template
- [x] Build scripts updated

## 🚨 Important Notes

### Database Configuration
- Use **production MongoDB cluster** (not development database)
- Add Vercel IP ranges to MongoDB whitelist: `0.0.0.0/0` (or specific Vercel IPs)
- Use connection string with `retryWrites=true&w=majority`

### CORS Settings
- Update `ALLOWED_ORIGINS` with your Vercel domain
- Include both www and non-www versions if needed

### Email Configuration
- Use Gmail App Password (not regular password) for `EMAIL_PASS`
- Enable 2FA on Gmail account first

### Security
- Generate new `JWT_SECRET` for production
- Never commit `.env` files to version control
- Use strong, unique passwords

## 🔍 Troubleshooting

### Common Issues:

**Build Fails:**
- Check package.json scripts
- Verify all dependencies are installed
- Check for TypeScript errors

**API Not Working:**
- Verify environment variables are set correctly
- Check CORS configuration
- Test API endpoints individually

**Database Connection Error:**
- Verify MongoDB URI format
- Check MongoDB Atlas IP whitelist
- Ensure database user has proper permissions

**Email Not Sending:**
- Verify Gmail App Password
- Check EMAIL_USER and EMAIL_PASS variables
- Test email configuration locally first

## 📁 File Structure After Deployment

```
servisbetaProj/
├── vercel.json              # Deployment configuration
├── .vercelignore           # Files to exclude
├── .env.example            # Environment template
├── client/
│   ├── dist/              # Built frontend files
│   ├── .env.production    # Production frontend env
│   └── .env.development   # Development frontend env
└── server/
    └── api/
        └── index.js       # Serverless function entry point
```

## 🎯 Post-Deployment Steps

1. **Test all functionality thoroughly**
2. **Monitor Vercel logs for errors**
3. **Set up custom domain (optional)**
4. **Configure analytics (optional)**
5. **Set up monitoring/alerts**

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Test API endpoints individually
4. Check MongoDB Atlas connectivity
5. Verify email service configuration

---

**Ready to deploy!** 🚀 The codebase is now optimized for Vercel deployment.
