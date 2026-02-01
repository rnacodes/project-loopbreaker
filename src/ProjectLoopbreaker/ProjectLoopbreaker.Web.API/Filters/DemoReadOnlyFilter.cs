using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Web.API.Filters
{
    /// <summary>
    /// Filter that blocks write operations (POST, PUT, DELETE, PATCH) in Demo environment.
    /// Allows browsing and GET requests only for demo users.
    /// Can be bypassed with:
    /// - Cloudflare Access JWT (CF-Access-JWT-Assertion header) for SSO authentication
    /// - X-Demo-Admin-Key header matching DEMO_ADMIN_KEY environment variable
    /// - Database feature flag "demo_write_enabled" set to true (no restart required)
    /// - DEMO_WRITE_ENABLED environment variable set to "true" (requires restart)
    /// </summary>
    public class DemoReadOnlyFilter : IAsyncActionFilter
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<DemoReadOnlyFilter> _logger;
        private readonly IConfiguration _configuration;
        private readonly IFeatureFlagService _featureFlagService;
        private const string AdminKeyHeader = "X-Demo-Admin-Key";
        private const string DemoWriteEnabledFlag = "demo_write_enabled";

        public DemoReadOnlyFilter(
            IWebHostEnvironment environment,
            ILogger<DemoReadOnlyFilter> logger,
            IConfiguration configuration,
            IFeatureFlagService featureFlagService)
        {
            _environment = environment;
            _logger = logger;
            _configuration = configuration;
            _featureFlagService = featureFlagService;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Only restrict in Demo environment
            if (!_environment.EnvironmentName.Equals("Demo", StringComparison.OrdinalIgnoreCase))
            {
                await next(); // Allow all operations in non-demo environments
                return;
            }

            var httpMethod = context.HttpContext.Request.Method;
            var isWriteOperation = httpMethod == HttpMethod.Post.Method ||
                                   httpMethod == HttpMethod.Put.Method ||
                                   httpMethod == HttpMethod.Delete.Method ||
                                   httpMethod == HttpMethod.Patch.Method;

            if (isWriteOperation)
            {
                // Allow feature flag management endpoints to always work
                var path = context.HttpContext.Request.Path.Value ?? "";
                if (path.Contains("/dev/feature-flags", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogDebug("Allowing feature flag management endpoint: {Path}", path);
                    await next();
                    return;
                }

                // Check for Cloudflare Access JWT bypass (highest priority - secure SSO bypass)
                var cfAccessJwt = context.HttpContext.Request.Headers["CF-Access-JWT-Assertion"].FirstOrDefault();
                if (!string.IsNullOrEmpty(cfAccessJwt))
                {
                    try
                    {
                        var cloudflareService = context.HttpContext.RequestServices.GetService<ICloudflareAccessService>();
                        if (cloudflareService != null && await cloudflareService.ValidateTokenAsync(cfAccessJwt))
                        {
                            _logger.LogInformation(
                                "Cloudflare Access bypass used. Method: {Method}, Path: {Path}",
                                httpMethod, path);
                            await next();
                            return;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Cloudflare Access token validation failed");
                    }
                }

                // Check database feature flag first (highest priority - instant effect without restart)
                try
                {
                    _logger.LogDebug("Checking database feature flag '{FlagKey}' for demo write access", DemoWriteEnabledFlag);
                    var dbFlagEnabled = await _featureFlagService.IsEnabledAsync(DemoWriteEnabledFlag);
                    _logger.LogDebug("Database feature flag '{FlagKey}' returned: {IsEnabled}", DemoWriteEnabledFlag, dbFlagEnabled);

                    if (dbFlagEnabled)
                    {
                        _logger.LogInformation(
                            "Demo write mode globally enabled via database feature flag. Method: {Method}, Path: {Path}",
                            httpMethod,
                            path);
                        await next();
                        return;
                    }
                    else
                    {
                        _logger.LogDebug("Database feature flag '{FlagKey}' is disabled or not found", DemoWriteEnabledFlag);
                    }
                }
                catch (Exception ex)
                {
                    // If we can't check the database, log and continue to fallback checks
                    _logger.LogError(ex, "Failed to check database feature flag '{FlagKey}'. Exception type: {ExceptionType}. This could indicate a database connectivity issue or missing table.",
                        DemoWriteEnabledFlag, ex.GetType().Name);
                }

                // Fallback: Check for environment variable (requires restart)
                var writeEnabled = Environment.GetEnvironmentVariable("DEMO_WRITE_ENABLED");
                if (!string.IsNullOrEmpty(writeEnabled) &&
                    writeEnabled.Equals("true", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation(
                        "Demo write mode globally enabled via DEMO_WRITE_ENABLED env var. Method: {Method}, Path: {Path}",
                        httpMethod,
                        path);
                    await next();
                    return;
                }

                // Check for admin key header bypass
                var adminKey = Environment.GetEnvironmentVariable("DEMO_ADMIN_KEY")
                               ?? _configuration["DEMO_ADMIN_KEY"];
                if (!string.IsNullOrEmpty(adminKey))
                {
                    var providedKey = context.HttpContext.Request.Headers[AdminKeyHeader].FirstOrDefault();

                    _logger.LogDebug(
                        "Demo admin key check - Key configured: {Configured}, Header present: {HeaderPresent}",
                        !string.IsNullOrEmpty(adminKey),
                        !string.IsNullOrEmpty(providedKey));

                    if (!string.IsNullOrEmpty(providedKey) && providedKey == adminKey)
                    {
                        _logger.LogInformation(
                            "Demo admin key bypass used. Method: {Method}, Path: {Path}",
                            httpMethod,
                            path);
                        await next();
                        return;
                    }
                }

                // Allow /dev/seed-demo-data endpoint specifically
                if (path.Contains("/dev/seed-demo-data", StringComparison.OrdinalIgnoreCase))
                {
                    await next();
                    return;
                }

                _logger.LogWarning(
                    "Write operation blocked in Demo environment. Method: {Method}, Path: {Path}",
                    httpMethod,
                    path);

                context.Result = new ObjectResult(new
                {
                    error = "Write operations are disabled in demo mode",
                    message = "This demo environment is read-only. You can browse all content, but cannot create, update, or delete data.",
                    allowedOperations = new[] { "GET" },
                    blockedOperation = httpMethod
                })
                {
                    StatusCode = 403 // Forbidden
                };
                return;
            }

            await next();
        }
    }
}
