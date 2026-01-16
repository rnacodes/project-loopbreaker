using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ProjectLoopbreaker.Web.API.Filters
{
    /// <summary>
    /// Filter that blocks write operations (POST, PUT, DELETE, PATCH) in Demo environment.
    /// Allows browsing and GET requests only for demo users.
    /// Can be bypassed with X-Demo-Admin-Key header matching DEMO_ADMIN_KEY environment variable.
    /// </summary>
    public class DemoReadOnlyFilter : IActionFilter
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<DemoReadOnlyFilter> _logger;
        private readonly IConfiguration _configuration;
        private const string AdminKeyHeader = "X-Demo-Admin-Key";

        public DemoReadOnlyFilter(
            IWebHostEnvironment environment,
            ILogger<DemoReadOnlyFilter> logger,
            IConfiguration configuration)
        {
            _environment = environment;
            _logger = logger;
            _configuration = configuration;
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            // Only restrict in Demo environment
            if (!_environment.EnvironmentName.Equals("Demo", StringComparison.OrdinalIgnoreCase))
            {
                return; // Allow all operations in non-demo environments
            }

            var httpMethod = context.HttpContext.Request.Method;
            var isWriteOperation = httpMethod == HttpMethod.Post.Method ||
                                   httpMethod == HttpMethod.Put.Method ||
                                   httpMethod == HttpMethod.Delete.Method ||
                                   httpMethod == HttpMethod.Patch.Method;

            if (isWriteOperation)
            {
                // Check for simple write-enabled toggle (highest priority)
                var writeEnabled = Environment.GetEnvironmentVariable("DEMO_WRITE_ENABLED");
                if (!string.IsNullOrEmpty(writeEnabled) &&
                    writeEnabled.Equals("true", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogInformation(
                        "Demo write mode globally enabled via DEMO_WRITE_ENABLED. Method: {Method}, Path: {Path}",
                        httpMethod,
                        context.HttpContext.Request.Path.Value);
                    return;
                }

                // Check for admin key header bypass (check env var directly first, then config)
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
                            context.HttpContext.Request.Path.Value);
                        return; // Allow operation with valid admin key
                    }
                }

                // Allow /dev/seed-demo-data endpoint specifically
                var path = context.HttpContext.Request.Path.Value ?? "";
                if (path.Contains("/dev/seed-demo-data", StringComparison.OrdinalIgnoreCase))
                {
                    return; // Allow seeding demo data
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
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // Nothing to do after action execution
        }
    }
}

