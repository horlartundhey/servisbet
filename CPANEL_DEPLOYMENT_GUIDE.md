# 🚀 Shared Hosting Deployment Guide

## Prerequisites
- ✅ cPanel access to your shared hosting
- ✅ File Manager or FTP access
- ✅ Your domain pointed to the hosting

## Step-by-Step Deployment

### 1️⃣ Build the Production Bundle

```bash
cd client
npm run build
```

This creates a `dist` folder with all compiled files.

### 2️⃣ Prepare Files for Upload

The `dist` folder contains:
- `index.html` - Main HTML file
- `assets/` folder - All JavaScript, CSS, and images
- `.htaccess` - Apache configuration (copy from client/.htaccess)
- Other static files

### 3️⃣ Upload to cPanel

#### Option A: Using File Manager (Recommended for beginners)

1. **Login to cPanel**
   - Go to your hosting cPanel URL
   - Enter your credentials

2. **Navigate to File Manager**
   - Find "File Manager" in Files section
   - Click to open

3. **Go to public_html (or your domain folder)**
   - If deploying to main domain: use `public_html`
   - If deploying to subdomain: use `public_html/subdomain`

4. **Clear existing files (if any)**
   - Select all old files
   - Click Delete

5. **Upload the dist folder contents**
   - Click "Upload" button
   - Select ALL files from the `dist` folder (not the folder itself)
   - Wait for upload to complete

6. **Upload .htaccess**
   - Navigate back to your domain folder
   - Click "Upload"
   - Select the `.htaccess` file from `client/.htaccess`
   - Upload it

7. **Set Permissions**
   - Select `.htaccess` file
   - Click "Permissions"
   - Set to `644`

#### Option B: Using FTP (Recommended for advanced users)

1. **Configure FTP Client (FileZilla, etc.)**
   - Host: Your domain or cPanel IP
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21 (or 22 for SFTP)

2. **Connect and Navigate**
   - Connect to your server
   - Navigate to `public_html` (or your domain folder)

3. **Upload Files**
   - Select all files from `dist` folder
   - Drag and drop to `public_html`
   - Upload `.htaccess` separately

### 4️⃣ Verify Deployment

1. **Visit your domain**
   ```
   https://yourdomain.com
   ```

2. **Check if app loads**
   - Should see ServisbetA homepage
   - Check browser console (F12) for any errors

3. **Test API Connection**
   - Try logging in or accessing features
   - API should connect to: `https://servisbeta-server.vercel.app/api`

### 5️⃣ Troubleshooting

#### Issue: Blank page after upload
- **Solution**: Check `.htaccess` is uploaded
- **Solution**: Clear browser cache (Ctrl + Shift + Delete)
- **Solution**: Check file permissions (644 for files, 755 for folders)

#### Issue: 404 errors on refresh
- **Solution**: Ensure `.htaccess` has correct SPA rewrite rules
- **Solution**: Check if `mod_rewrite` is enabled on your host

#### Issue: API not connecting
- **Solution**: Check browser console for CORS errors
- **Solution**: Verify API URL in the app (should be Vercel server)
- **Solution**: Contact hosting to enable CORS headers

#### Issue: Assets not loading
- **Solution**: Check that `assets` folder is uploaded
- **Solution**: Verify file permissions
- **Solution**: Check browser console for 404 errors

### 6️⃣ Post-Deployment Checks

✅ Homepage loads without errors
✅ Navigation works (all routes)
✅ Can refresh page without 404
✅ Login/Register functionality works
✅ API calls succeed (check Network tab)
✅ Images and assets load properly
✅ Mobile view works correctly

## 🔧 Configuration Notes

### API Connection
The app is pre-configured to connect to:
```
https://servisbeta-server.vercel.app/api
```

No additional configuration needed! The app will automatically use the Vercel server.

### Environment Variables
The production build uses these values from `.env.production`:
- `VITE_API_BASE_URL`: https://servisbeta-server.vercel.app/api
- `VITE_APP_NAME`: ServisbetA
- `VITE_APP_VERSION`: 1.0.0
- `VITE_APP_ENVIRONMENT`: production

### Domain Configuration
If you want to use a custom domain:
1. Point your domain to your hosting IP
2. Update cPanel domain settings
3. Rebuild and redeploy (domain is baked into build)

## 📁 File Structure After Deployment

```
public_html/
├── index.html          (Main HTML file)
├── .htaccess           (Apache configuration)
├── manifest.json       (PWA manifest)
├── vite.svg            (Favicon)
└── assets/
    ├── index-[hash].js     (Main JavaScript)
    ├── index-[hash].css    (Main CSS)
    ├── react-[hash].js     (React library)
    ├── router-[hash].js    (React Router)
    ├── ui-[hash].js        (UI components)
    └── *.png, *.jpg        (Images)
```

## 🔄 Updating the App

When you make changes:
1. Run `npm run build` in the client folder
2. Delete old files from `public_html`
3. Upload new `dist` folder contents
4. Clear browser cache and test

## 🆘 Need Help?

Check these common issues:
- **Apache mod_rewrite not enabled**: Contact hosting support
- **CORS errors**: Add CORS headers in .htaccess (already included)
- **File upload size limit**: Use FTP for large files
- **Permission errors**: Set files to 644, folders to 755

## 📞 Support Resources
- cPanel Documentation
- Your hosting provider support
- ServisbetA API: https://servisbeta-server.vercel.app/
