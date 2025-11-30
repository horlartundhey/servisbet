# Vercel Environment Variables Setup Guide

## 🚨 **CRITICAL: API Connection Issue on iOS**

The iOS issue is caused by **missing environment variables** in Vercel. The app defaults to `localhost` which doesn't work on mobile devices.

## ✅ **Solution: Set Vercel Environment Variables**

### **Method 1: Via Vercel Dashboard (Recommended)**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select project: `servisbet-client`

2. **Navigate to Settings:**
   - Click on **"Settings"** tab
   - Click on **"Environment Variables"** in the sidebar

3. **Add the following variable:**

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `VITE_API_BASE_URL` | `https://servisbet-git-main-horlartundheys-projects.vercel.app/api` | Production, Preview, Development |

4. **Save and Redeploy:**
   - Click "Save"
   - Go to **"Deployments"** tab
   - Click the three dots on the latest deployment
   - Click **"Redeploy"**

### **Method 2: Via Vercel CLI**

Run these commands in PowerShell:

```powershell
# Login to Vercel (if not already logged in)
vercel login

# Navigate to client directory
cd c:\Users\HP\Desktop\Clients-project\Servisbeta\servisbetaProj\client

# Set production environment variable
vercel env add VITE_API_BASE_URL production
# When prompted, enter: https://servisbet-git-main-horlartundheys-projects.vercel.app/api

# Set preview environment variable
vercel env add VITE_API_BASE_URL preview
# When prompted, enter: https://servisbet-git-main-horlartundheys-projects.vercel.app/api

# Set development environment variable
vercel env add VITE_API_BASE_URL development
# When prompted, enter: https://servisbet-git-main-horlartundheys-projects.vercel.app/api

# Redeploy to production
vercel --prod
```

## 🔍 **Verify the Fix**

After setting environment variables and redeploying:

1. **Open the diagnostic page on iOS:**
   ```
   https://servisbet-client.vercel.app/ios-test.html
   ```

2. **Click "Test API Connection"**
   - Should now show: `✅ API responded: 200`
   - Instead of: `❌ API responded: 404`

3. **Click "Test Main App"**
   - Should redirect to working main app

4. **Open the main app:**
   ```
   https://servisbet-client.vercel.app
   ```
   - Should now work on iOS!

## 📋 **All Required Environment Variables**

For full functionality, set these in Vercel:

```bash
# Required for API connection
VITE_API_BASE_URL=https://servisbet-git-main-horlartundheys-projects.vercel.app/api

# App Configuration (Optional)
VITE_APP_NAME=ServisbetA
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Feature Flags (Optional)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

## 🎯 **Why This Fixes the iOS Issue**

**Root Cause:**
- Client app was using `http://localhost:5000/api` in production
- iOS Safari couldn't connect to localhost
- App failed to load due to failed API calls

**The Fix:**
- Set correct production API URL in Vercel environment variables
- Added fallback in code to use production URL when `VITE_API_BASE_URL` is not set
- iOS can now connect to the actual API server

## ⚠️ **Important Notes**

1. **Environment variables in `.env.production` file are NOT used by Vercel**
   - Vercel requires variables to be set in the dashboard or via CLI

2. **After changing environment variables, you MUST redeploy**
   - Changes only take effect on new deployments

3. **Vite environment variables must start with `VITE_`**
   - This is a security feature
   - Only `VITE_*` variables are exposed to the client

## 🔄 **Quick Redeploy Command**

After setting environment variables:

```powershell
# Trigger a new deployment
git commit --allow-empty -m "Trigger redeploy with env variables"
git push
```

Or use Vercel CLI:

```powershell
vercel --prod
```

## ✅ **Verification Checklist**

- [ ] Environment variable `VITE_API_BASE_URL` set in Vercel dashboard
- [ ] New deployment triggered after setting variable
- [ ] Diagnostic page shows API connection success
- [ ] Main app loads on iOS Safari
- [ ] Can browse and interact with the app on iOS

## 🆘 **Still Not Working?**

If the issue persists after setting environment variables:

1. Check the browser console on iOS:
   - Settings → Safari → Advanced → Web Inspector

2. Verify the API URL in the console log:
   - Should show: `API Base URL: https://servisbet-git-main...`
   - Not: `API Base URL: http://localhost:5000/api`

3. Test the server directly:
   - Visit: https://servisbet-git-main-horlartundheys-projects.vercel.app/api/health
   - Should return JSON with status information
