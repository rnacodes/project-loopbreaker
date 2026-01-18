# API Key Authentication for N8N Background Jobs

## Overview

Add API key authentication alongside existing JWT authentication so N8N can authenticate to background job endpoints without managing token refresh logic.

## Approach

Use a simple environment variable-based API key with a custom authentication handler. This avoids database complexity while providing secure authentication for automation systems.

**How it works:**
- N8N sends requests with header: `X-API-Key: your-api-key`
- A custom authentication handler validates the key against an environment variable
- Existing `[Authorize]` attributes accept either JWT Bearer tokens OR valid API keys
- No changes needed to existing controllers

## Files to Create

### 1. `ApiKeyAuthenticationHandler.cs`
**Path:** `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Authentication/ApiKeyAuthenticationHandler.cs`

Custom authentication handler that:
- Checks for `X-API-Key` header
- Validates against `N8N_API_KEY` environment variable
- Returns success with a claims principal for "N8N-Service" identity
- Returns no result (not failure) if header missing, allowing JWT to be tried

## Files to Modify

### 2. `Program.cs`
**Path:** `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Program.cs`

Changes:
- Register the API key authentication scheme
- Configure a policy scheme that tries API key first, falls back to JWT
- Set the default scheme to use the policy scheme

## Environment Variable

Add to your server environment:
```
N8N_API_KEY=<generate-a-secure-random-key>
```

Generate with: `openssl rand -hex 32`

## Implementation Details

### Authentication Flow

```
Request arrives
    │
    ├─> Has X-API-Key header?
    │       │
    │       ├─> Yes: Validate against N8N_API_KEY env var
    │       │         │
    │       │         ├─> Valid: Authenticate as "N8N-Service"
    │       │         └─> Invalid: Return 401
    │       │
    │       └─> No: Fall through to JWT Bearer
    │               │
    │               ├─> Valid JWT: Authenticate as user
    │               └─> No/Invalid JWT: Return 401
```

### Claims for API Key Auth

When authenticated via API key, the principal will have:
- Name: "N8N-Service"
- AuthenticationType: "ApiKey"

This allows logging/auditing to distinguish API key requests from user requests.

## N8N Configuration

After implementation, configure N8N credentials:

1. Go to **Credentials** > **Add Credential** > **Header Auth**
2. Configure:
   - **Name:** `ProjectLoopbreaker API Key`
   - **Name:** `X-API-Key`
   - **Value:** `<your-n8n-api-key>`

3. Use this credential in all HTTP Request nodes instead of Bearer token

## Verification

1. **Generate API key:** `openssl rand -hex 32`
2. **Set environment variable** on server: `N8N_API_KEY=<generated-key>`
3. **Restart the API** to pick up the new env var
4. **Test with curl:**
   ```bash
   curl -H "X-API-Key: <your-key>" https://www.api.mymediaverseuniverse.com/api/auth/validate
   ```
5. **Verify 200 response** (authenticated successfully)
6. **Test invalid key** returns 401
7. **Test no header** with valid JWT still works (backward compatible)

---

## Code Implementation Reference

### ApiKeyAuthenticationHandler.cs

```csharp
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace ProjectLoopbreaker.Web.API.Authentication;

public class ApiKeyAuthenticationOptions : AuthenticationSchemeOptions
{
    public const string DefaultScheme = "ApiKey";
    public const string HeaderName = "X-API-Key";
}

public class ApiKeyAuthenticationHandler : AuthenticationHandler<ApiKeyAuthenticationOptions>
{
    private readonly IConfiguration _configuration;

    public ApiKeyAuthenticationHandler(
        IOptionsMonitor<ApiKeyAuthenticationOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IConfiguration configuration)
        : base(options, logger, encoder)
    {
        _configuration = configuration;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if X-API-Key header exists
        if (!Request.Headers.TryGetValue(ApiKeyAuthenticationOptions.HeaderName, out var apiKeyHeader))
        {
            // No API key header - let other schemes handle it
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var providedApiKey = apiKeyHeader.ToString();
        var validApiKey = _configuration["N8N_API_KEY"]
            ?? Environment.GetEnvironmentVariable("N8N_API_KEY");

        if (string.IsNullOrEmpty(validApiKey))
        {
            Logger.LogWarning("N8N_API_KEY is not configured");
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        // Use constant-time comparison to prevent timing attacks
        if (!CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.UTF8.GetBytes(providedApiKey),
            System.Text.Encoding.UTF8.GetBytes(validApiKey)))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key"));
        }

        // Create claims principal for authenticated service
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "N8N-Service"),
            new Claim(ClaimTypes.AuthenticationMethod, "ApiKey"),
            new Claim("service", "n8n")
        };

        var identity = new ClaimsIdentity(claims, ApiKeyAuthenticationOptions.DefaultScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, ApiKeyAuthenticationOptions.DefaultScheme);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
```

### Program.cs Changes

Add after existing JWT authentication configuration (around line 139):

```csharp
// Add API Key authentication scheme
builder.Services.AddAuthentication()
    .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthenticationHandler>(
        ApiKeyAuthenticationOptions.DefaultScheme,
        options => { });

// Configure policy scheme to try API key first, then JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "MultiAuth";
    options.DefaultChallengeScheme = "MultiAuth";
})
.AddPolicyScheme("MultiAuth", "API Key or JWT", options =>
{
    options.ForwardDefaultSelector = context =>
    {
        // If X-API-Key header present, use API key auth
        if (context.Request.Headers.ContainsKey("X-API-Key"))
        {
            return ApiKeyAuthenticationOptions.DefaultScheme;
        }
        // Otherwise use JWT Bearer
        return JwtBearerDefaults.AuthenticationScheme;
    };
});
```

Also add the using statement at the top:
```csharp
using ProjectLoopbreaker.Web.API.Authentication;
```
