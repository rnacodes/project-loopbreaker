using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ProjectLoopbreaker.Web.API.Filters
{
    /// <summary>
    /// Filter that blocks write operations (POST, PUT, DELETE, PATCH) in Demo environment.
    /// Allows browsing and GET requests only for demo users.
    /// </summary>
    public class DemoReadOnlyFilter : IActionFilter
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<DemoReadOnlyFilter> _logger;

        public DemoReadOnlyFilter(IWebHostEnvironment environment, ILogger<DemoReadOnlyFilter> logger)
        {
            _environment = environment;
            _logger = logger;
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

