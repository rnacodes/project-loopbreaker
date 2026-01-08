# Demo Admin Bypass

> For a complete overview of how demo mode works, see [Demo Mode](demo-mode.md).

The demo site runs in read-only mode to prevent public users from modifying data. However, you can temporarily bypass this restriction to upload data to the demo database using a secret admin key.

## How It Works

The `DemoReadOnlyFilter` blocks all write operations (POST, PUT, DELETE, PATCH) when the backend runs in the Demo environment. By setting a secret key and including it in your request headers, you can bypass this restriction.

## Setup

Add the `DEMO_ADMIN_KEY` environment variable to your demo server:

```
DEMO_ADMIN_KEY=your-secret-key-here
```

On Render, add this in the Environment section of your service settings.

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

- If `DEMO_ADMIN_KEY` is not set, no bypass is possible (full read-only mode)
- All bypassed operations are logged with "Demo admin key bypass used" for auditing
- Regular users without the header still see the read-only demo experience
- Keep the admin key secret and change it periodically

## Related Files

**Backend:**
- Filter: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Filters/DemoReadOnlyFilter.cs`
- Dev endpoints: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/DevController.cs`

**Frontend:**
- Admin page: `frontend/src/components/DemoAdminPage.jsx`
- Context: `frontend/src/contexts/DemoAdminContext.jsx`
- API client (header injection): `frontend/src/api/apiClient.js`
