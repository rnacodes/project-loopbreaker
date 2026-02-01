namespace ProjectLoopbreaker.Shared.Interfaces
{
    /// <summary>
    /// Service for validating Cloudflare Access JWT tokens.
    /// Used to bypass demo read-only mode for authenticated admin users.
    /// </summary>
    public interface ICloudflareAccessService
    {
        /// <summary>
        /// Validates a Cloudflare Access JWT token.
        /// </summary>
        /// <param name="token">The JWT token from CF-Access-JWT-Assertion header</param>
        /// <returns>True if the token is valid and from an authorized user</returns>
        Task<bool> ValidateTokenAsync(string token);
    }
}
