# Demo Mode

This document describes how demo mode works across the frontend and backend of ProjectLoopbreaker.

## Overview

Demo mode allows the application to be publicly accessible for demonstration purposes while protecting data from modifications. It combines:

- **Backend:** Read-only restrictions that block write operations
- **Frontend:** Bypassed authentication so visitors can browse without logging in

## Environment Configuration

### Backend

Set the environment name to `Demo`:

```
ASPNETCORE_ENVIRONMENT=Demo
```

This activates the `DemoReadOnlyFilter` which blocks POST, PUT, DELETE, and PATCH requests.

### Frontend

Set the demo mode flag:

```
VITE_DEMO_MODE=true
```

This allows public access to all routes without requiring authentication.

## How It Works

### Backend: DemoReadOnlyFilter

Located at: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Filters/DemoReadOnlyFilter.cs`

When the backend runs in the Demo environment:

1. All GET requests are allowed (browsing, searching, viewing)
2. All write operations (POST, PUT, DELETE, PATCH) return 403 Forbidden
3. The error response includes:
   ```json
   {
     "error": "Write operations are disabled in demo mode",
     "message": "This demo environment is read-only...",
     "allowedOperations": ["GET"],
     "blockedOperation": "POST"
   }
   ```

**Exceptions (in priority order):**
1. `DEMO_WRITE_ENABLED=true` environment variable - allows ALL write operations globally
2. Requests with a valid `X-Demo-Admin-Key` header bypass the restriction (see [Demo Admin Bypass](demo-admin-bypass.md))
3. `/api/dev/seed-demo-data` endpoint is always allowed (for seeding demo data)

### Frontend: ConditionalProtectedRoute

Located at: `frontend/src/components/ConditionalProtectedRoute.jsx`

When `VITE_DEMO_MODE=true`:
- All protected routes become publicly accessible
- No login is required to browse the application
- The login page still exists but is not enforced

When `VITE_DEMO_MODE=false`:
- Routes wrapped in `ConditionalProtectedRoute` require authentication
- Unauthenticated users are redirected to `/login`

### Frontend: API Client Behavior

Located at: `frontend/src/api/apiClient.js`

In demo mode:
- 401 errors don't trigger token refresh or login redirects
- Authentication is essentially skipped
- The demo admin key (if set) is automatically included in request headers

## Deployment Configurations

### Production (Full Access)

```
# Backend
ASPNETCORE_ENVIRONMENT=Production

# Frontend
VITE_DEMO_MODE=false
```

- Requires login
- Full CRUD operations allowed
- Standard authentication flow

### Demo Site (Read-Only Public)

```
# Backend
ASPNETCORE_ENVIRONMENT=Demo
DEMO_ADMIN_KEY=your-secret-key     # Optional, for per-session admin access
DEMO_WRITE_ENABLED=false           # Optional, set to "true" to allow all writes globally

# Frontend
VITE_DEMO_MODE=true
VITE_API_URL=https://your-demo-api.com/api
```

- No login required
- Read-only access for public visitors
- Two options for enabling write access:
  - **Quick toggle:** Set `DEMO_WRITE_ENABLED=true` to allow all writes (useful for maintenance)
  - **Per-session:** Use `/demo-admin` page with `DEMO_ADMIN_KEY` for controlled access

### Development (Local)

```
# Backend
ASPNETCORE_ENVIRONMENT=Development

# Frontend
VITE_DEMO_MODE=false  # or true if testing demo behavior
```

- Full access locally
- Can toggle demo mode to test behavior

## Demo Data

Sample data files for seeding a demo database:

- `official-documentation/demo_media_items.json` - Sample media items
- `official-documentation/demo_mixlists.json` - Sample mixlists

The backend also has a seeding endpoint:
```
POST /api/dev/seed-demo-data
```

This creates sample topics, genres, books, movies, videos, articles, and mixlists.

## Admin Access in Demo Mode

When you need to modify data on the demo site:

1. Navigate to `/demo-admin`
2. Enable admin mode with the secret key
3. Make your changes
4. Disable admin mode when done

See [Demo Admin Bypass](demo-admin-bypass.md) for detailed instructions.

## Related Files

**Backend:**
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Filters/DemoReadOnlyFilter.cs` - Read-only filter
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/DevController.cs` - Dev/seeding endpoints
- `appsettings.Demo.json` - Demo environment configuration

**Frontend:**
- `frontend/src/components/ConditionalProtectedRoute.jsx` - Route protection logic
- `frontend/src/components/DemoAdminPage.jsx` - Admin toggle UI
- `frontend/src/contexts/DemoAdminContext.jsx` - Admin mode state
- `frontend/src/api/apiClient.js` - API client with demo handling
