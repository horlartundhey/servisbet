# Postman Production Testing Guide

## Quick Test URLs

### 1. Server Health Check
```
GET https://servisbet-server-git-main-horlartundheys-projects.vercel.app/
```

### 2. API Health Check  
```
GET https://servisbet-server-git-main-horlartundheys-projects.vercel.app/api
```

### 3. Login Test
```
POST https://servisbet-server-git-main-horlartundheys-projects.vercel.app/api/auth/login

Headers:
Content-Type: application/json

Body:
{
  "email": "test@example.com",
  "password": "password123"
}
```

## Expected Results

### Server Health (/)
```json
{
  "success": true,
  "message": "ServisbetA API Server Running",
  "version": "1.0.0",
  "timestamp": "...",
  "environment": "production"
}
```

### API Health (/api)
```json
{
  "success": true,
  "message": "ServisbetA API Endpoint",
  "version": "1.0.0",
  "timestamp": "..."
}
```

### Login Response
- **Success**: 200 status with token
- **Failure**: Error message explaining the issue

## Troubleshooting

If you get:
- **500 Error**: Database connection issue
- **404 Error**: Routing/deployment issue  
- **CORS Error**: Environment variable issue
- **Authentication Error**: Endpoint working, just need valid user

## Environment Variable Check

Make sure in Vercel Dashboard → Server Project → Settings → Environment Variables:

```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,https://servisbet-client-git-main-horlartundheys-projects.vercel.app
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```
