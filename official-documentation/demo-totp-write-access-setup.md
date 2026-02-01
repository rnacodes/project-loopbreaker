# Demo TOTP Write Access Setup Guide

This document describes the TOTP-based temporary write access feature for the demo site, using Google Authenticator.

## Implementation Complete

**Files created/modified:**
1. **`src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/DemoController.cs`** (new) - Endpoints for TOTP unlock
2. **`src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Filters/DemoReadOnlyFilter.cs`** (modified) - Added TOTP cookie bypass check
3. **`src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/ProjectLoopbreaker.Web.API.csproj`** (modified) - Added Otp.NET package

## New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/demo/unlock?code=123456` | GET | Validates TOTP code, sets 20-min write cookie |
| `/api/demo/lock` | POST | Manually revokes write access |
| `/api/demo/status` | GET | Checks if write access is active |
| `/api/demo/generate-secret` | GET | Generates a new TOTP secret (Development only) |

## How It Works

1. The `DemoReadOnlyFilter` blocks all write operations (POST, PUT, DELETE, PATCH) in the Demo environment
2. When you call `/api/demo/unlock` with a valid TOTP code, it sets an HTTP-only cookie named `Demo_Write_Access`
3. The cookie is valid for 20 minutes, Secure, SameSite=Strict
4. The filter checks for this cookie and allows write operations if present
5. The cookie can be manually revoked via `/api/demo/lock`

---

## Setting Up Google Authenticator

### Step 1: Generate a Secret (Development)
Run your API locally in Development mode and call:
```
GET http://localhost:5033/api/demo/generate-secret
```

This returns:
- `base32Secret` - The secret to save as `DEMO_TOTP_SECRET` env var
- `otpauthUri` - Can be used to generate a QR code

### Step 2: Add to Google Authenticator
1. Open **Google Authenticator** on your phone
2. Tap the **+** button
3. Select **"Enter a setup key"**
4. Enter:
   - **Account name**: `MyMediaVerse Demo` (or whatever you prefer)
   - **Your key**: Paste the `base32Secret` from Step 1
   - **Type of key**: `Time based` (default)
5. Tap **Add**

### Step 3: Set Environment Variable on Server
On your DigitalOcean droplet (or wherever you deploy), set:
```bash
export DEMO_TOTP_SECRET="YOUR_BASE32_SECRET_HERE"
```

Or add it to your systemd service file / docker-compose / etc.

### Step 4: Unlock Write Access
When you need write access on the demo site:
1. Open Google Authenticator
2. Copy the 6-digit code
3. Visit: `https://demo.yourdomain.com/api/demo/unlock?code=123456`
4. You now have 20 minutes of write access

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEMO_TOTP_SECRET` | Yes (for TOTP) | Base32-encoded secret for TOTP validation |

## Security Notes

- The cookie is HTTP-only (not accessible via JavaScript)
- The cookie is Secure (only sent over HTTPS)
- The cookie is SameSite=Strict (prevents CSRF)
- The secret generation endpoint only works in Development environment
- TOTP codes have a ±1 step window to account for time drift

## Optional: Frontend Feedback (Not Yet Implemented)

The plan document mentioned optional frontend feedback to show a banner when write access is active. This would require:
1. A secondary non-HTTP-only cookie or checking `/api/demo/status`
2. A toast/banner component in the React frontend

This can be implemented later if desired.
