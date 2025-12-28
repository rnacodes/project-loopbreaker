# Production API Troubleshooting Guide

## Issue: 500 Internal Server Error + CORS Error

You're seeing:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://www.api.mymediaverseuniverse.com/api/genres. (Reason: CORS header 'Access-Control-Allow-Origin' missing). Status code: 500.
```

**Important**: The CORS error is a symptom, not the root cause. The real issue is the **500 Internal Server Error**. When the API crashes before the CORS middleware can add headers, you get both errors.

## What I've Fixed

### 1. Added Global Exception Handler Middleware
- **File**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Middleware/GlobalExceptionHandlerMiddleware.cs`
- **Purpose**: Catches all unhandled exceptions and ensures CORS headers are always included in error responses
- **Benefit**: You'll now get detailed error information even when the API crashes

### 2. Added Health Check Endpoints
- **File**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/HealthController.cs`
- **Endpoints**:
  - `GET /api/health` - Basic health check
  - `GET /api/health/detailed` - Tests database connectivity and configuration
  - `GET /api/health/cors-test` - Verifies CORS is working

## Diagnostic Steps

### Step 1: Test Basic API Connectivity
```bash
curl https://www.api.mymediaverseuniverse.com/api/health
```

**Expected Response** (if API is running):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "Production"
}
```

**If this fails**: Your API isn't running or isn't accessible at this URL.

### Step 2: Test Detailed Health (Database + Config)
```bash
curl https://www.api.mymediaverseuniverse.com/api/health/detailed
```

**Expected Response** (if everything is configured):
```json
{
  "api": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "Production"
  },
  "database": {
    "status": "healthy",
    "canConnect": true,
    "genreCount": 10,
    "provider": "Npgsql.EntityFrameworkCore.PostgreSQL"
  },
  "configuration": {
    "hasConnectionString": true,
    "hasJwtSecret": true,
    "hasTypesenseConfig": true,
    "environment": "Production"
  }
}
```

**If database.status is "unhealthy"**: Database connection issue (see below).

### Step 3: Test CORS
```bash
curl -H "Origin: https://www.mymediaverseuniverse.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://www.api.mymediaverseuniverse.com/api/health/cors-test
```

### Step 4: Test the Original Failing Endpoint
```bash
curl -v https://www.api.mymediaverseuniverse.com/api/genres
```

With the new exception handler, you should now get a detailed error response instead of just a 500.

## Common Production Issues

### Issue 1: Database Connection Failed

**Symptoms**:
- `/api/health/detailed` shows `database.status: "unhealthy"`
- Error message mentions connection refused or authentication failed

**Solutions**:
1. Verify `DATABASE_URL` environment variable is set correctly
2. Check database server is running and accessible
3. Verify database credentials are correct
4. Check if database requires SSL/TLS (most cloud providers do)
5. Ensure database migrations have been applied:
   ```bash
   dotnet ef database update --project src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure
   ```

**Environment Variable Format**:
```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### Issue 2: Missing Environment Variables

**Symptoms**:
- `/api/health/detailed` shows `hasConnectionString: false` or other `false` values
- Application logs show "WARNING: No database connection string configured"

**Required Environment Variables**:
```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Authentication (REQUIRED if using auth)
JWT_SECRET=your-secret-key-here

# Typesense Search (OPTIONAL but recommended)
TYPESENSE_ADMIN_API_KEY=your-api-key
TYPESENSE_HOST=search.yourdomain.com
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https

# External APIs (OPTIONAL)
LISTENNOTES_API_KEY=your-key
TMDB_API_KEY=your-key
READWISE_API_KEY=your-key

# DigitalOcean Spaces (OPTIONAL - for thumbnails)
DIGITALOCEANSPACES__ACCESSKEY=your-key
DIGITALOCEANSPACES__SECRETKEY=your-secret
DIGITALOCEANSPACES__ENDPOINT=nyc3.digitaloceanspaces.com
DIGITALOCEANSPACES__REGION=us-east-1
DIGITALOCEANSPACES__BUCKETNAME=your-bucket
```

### Issue 3: Database Migrations Not Applied

**Symptoms**:
- Database connects but queries fail
- Error mentions missing tables or columns

**Solution**:
```bash
cd src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
dotnet ef database update --project ../ProjectLoopbreaker.Infrastructure
```

### Issue 4: ASPNETCORE_ENVIRONMENT Not Set

**Symptoms**:
- CORS allows localhost but not production domains
- Swagger UI appears in production

**Solution**:
Set environment variable:
```bash
ASPNETCORE_ENVIRONMENT=Production
```

### Issue 5: Reverse Proxy/Load Balancer Issues

**Symptoms**:
- Health checks pass but frontend still gets CORS errors
- API works with curl but not from browser

**Solutions**:
1. Ensure reverse proxy forwards `Origin` header
2. Check if reverse proxy is stripping CORS headers
3. Verify SSL/TLS termination is configured correctly
4. Check if reverse proxy has its own CORS configuration that conflicts

**Common Reverse Proxy Configs**:

**Nginx**:
```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Don't add CORS headers here - let the API handle it
}
```

**Apache**:
```apache
ProxyPass /api http://localhost:5000/api
ProxyPassReverse /api http://localhost:5000/api
ProxyPreserveHost On
```

## Checking Application Logs

Your application logs should show:
```
Environment: Production
Connection string source: DATABASE_URL env var
Connection string parsed successfully. Host: xxx, Database: xxx
JWT Authentication configured successfully.
Typesense client configured successfully.
```

If you see warnings like:
- "WARNING: No database connection string configured"
- "WARNING: No JWT secret configured"
- "WARNING: Typesense configuration is incomplete"

Then you need to set the corresponding environment variables.

## Testing CORS Locally

To test the CORS fix locally before deploying:

1. Build and run the API:
   ```bash
   cd src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
   dotnet build
   dotnet run
   ```

2. Test from browser console (open https://www.mymediaverseuniverse.com):
   ```javascript
   fetch('https://www.api.mymediaverseuniverse.com/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error);
   ```

## Deployment Checklist

Before deploying to production:

- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Set `DATABASE_URL` with production database credentials
- [ ] Set `JWT_SECRET` (use a strong random value)
- [ ] Apply database migrations
- [ ] Configure Typesense (if using search)
- [ ] Test health endpoints after deployment
- [ ] Check application logs for errors
- [ ] Test CORS from frontend domain

## Next Steps

1. **Deploy these changes** to your production API
2. **Check the logs** immediately after deployment
3. **Test the health endpoints** to diagnose the issue
4. **Share the error response** from `/api/health/detailed` if you still have issues

The new exception handler will now give you detailed error information that will help us identify exactly what's failing in production.







