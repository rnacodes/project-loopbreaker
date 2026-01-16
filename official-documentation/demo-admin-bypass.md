# Demo Admin Bypass

> For a complete overview of how demo mode works, see [Demo Mode](demo-mode.md).

The demo site runs in read-only mode to prevent public users from modifying data. There are two ways to bypass this restriction:

1. **Global toggle (`DEMO_WRITE_ENABLED`)** - Allows ALL write operations for everyone (useful for quick maintenance)
2. **Per-session key (`DEMO_ADMIN_KEY`)** - Allows write operations only for requests with the correct header

## Quick Write Mode Toggle

For temporary maintenance or when the admin key approach isn't working, you can enable write mode globally:

```
DEMO_WRITE_ENABLED=true
```

On Render, add this in the Environment section of your service settings.

**WARNING:** This allows ALL visitors to perform write operations. Only use temporarily and remove or set to `false` when done.

## Per-Session Admin Key

The `DemoReadOnlyFilter` blocks all write operations (POST, PUT, DELETE, PATCH) when the backend runs in the Demo environment. By setting a secret key and including it in your request headers, you can bypass this restriction for your session only.

## Priority Order

The filter checks bypass options in this order:

1. `DEMO_WRITE_ENABLED=true` → All writes allowed (no key needed)
2. `DEMO_ADMIN_KEY` + matching `X-Demo-Admin-Key` header → Writes allowed for that session
3. `/api/dev/seed-demo-data` path → Always allowed
4. Default → Block write operations (403 Forbidden)

## Setup (Per-Session Key)

Add the `DEMO_ADMIN_KEY` environment variable to your demo server:

```
DEMO_ADMIN_KEY=your-secret-key-here
```

On Render, add this in the Environment section of your service settings.

**Note:** The backend reads this value directly from the environment variable using `Environment.GetEnvironmentVariable("DEMO_ADMIN_KEY")`, so it must be set as an actual environment variable (not just in appsettings).

## Using the Admin UI

The easiest way to enable admin mode is through the built-in UI:

1. Navigate to `/demo-admin` on your demo site
2. Toggle the "Admin Mode" switch to ON
3. Enter your admin key when prompted
4. The key is stored in your browser's session storage (cleared when you close the tab)
5. All API requests from the frontend will automatically include the admin key header
6. Toggle OFF when done to restore read-only mode

## Manual API Usage

You can also include the `X-Demo-Admin-Key` header manually with your requests:

### PowerShell

```powershell
Invoke-WebRequest -Uri 'https://your-demo-api.com/api/book' `
  -Method POST `
  -Headers @{
    'X-Demo-Admin-Key' = 'your-secret-key-here'
    'Content-Type' = 'application/json'
  } `
  -Body '{"title": "My Book", "author": "Author Name"}'
```

### curl

```bash
curl -X POST 'https://your-demo-api.com/api/book' \
  -H 'X-Demo-Admin-Key: your-secret-key-here' \
  -H 'Content-Type: application/json' \
  -d '{"title": "My Book", "author": "Author Name"}'
```

### Postman / Insomnia

Add a header:
- Key: `X-Demo-Admin-Key`
- Value: `your-secret-key-here`

## Security Notes

- If neither `DEMO_WRITE_ENABLED` nor `DEMO_ADMIN_KEY` is set, full read-only mode is enforced
- All bypassed operations are logged:
  - Global toggle: "Demo write mode globally enabled via DEMO_WRITE_ENABLED"
  - Per-session key: "Demo admin key bypass used"
- Regular users without the header (and without global toggle) see the read-only demo experience
- Keep the admin key secret and change it periodically
- **Important:** Remove or set `DEMO_WRITE_ENABLED=false` after maintenance to restore read-only mode

## Related Files

**Backend:**
- Filter: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Filters/DemoReadOnlyFilter.cs`
- Dev endpoints: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/DevController.cs`

**Frontend:**
- Admin page: `frontend/src/components/DemoAdminPage.jsx`
- Context: `frontend/src/contexts/DemoAdminContext.jsx`
- API client (header injection): `frontend/src/api/apiClient.js`
