using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Infrastructure.Services
{
    /// <summary>
    /// Service for validating Cloudflare Access JWT tokens.
    /// Fetches public keys from Cloudflare's JWKS endpoint and validates tokens.
    /// </summary>
    public class CloudflareAccessService : ICloudflareAccessService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CloudflareAccessService> _logger;
        private readonly string? _teamDomain;
        private readonly string? _expectedAudience;

        private JsonWebKeySet? _cachedKeySet;
        private DateTime _keySetCacheExpiry = DateTime.MinValue;
        private readonly TimeSpan _keySetCacheDuration = TimeSpan.FromHours(1);
        private readonly SemaphoreSlim _keySetLock = new(1, 1);

        public CloudflareAccessService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<CloudflareAccessService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            // Get configuration from environment variables or appsettings
            _teamDomain = Environment.GetEnvironmentVariable("CLOUDFLARE_ACCESS_TEAM_DOMAIN") ??
                          configuration["CloudflareAccess:TeamDomain"];
            _expectedAudience = Environment.GetEnvironmentVariable("CLOUDFLARE_ACCESS_AUD") ??
                                configuration["CloudflareAccess:Aud"];

            if (string.IsNullOrEmpty(_teamDomain) || string.IsNullOrEmpty(_expectedAudience))
            {
                _logger.LogWarning(
                    "Cloudflare Access not fully configured. TeamDomain: {HasTeamDomain}, AUD: {HasAud}",
                    !string.IsNullOrEmpty(_teamDomain),
                    !string.IsNullOrEmpty(_expectedAudience));
            }
            else
            {
                _logger.LogInformation(
                    "Cloudflare Access configured. TeamDomain: {TeamDomain}",
                    _teamDomain);
            }
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            if (string.IsNullOrEmpty(_teamDomain) || string.IsNullOrEmpty(_expectedAudience))
            {
                _logger.LogDebug("Cloudflare Access not configured, skipping validation");
                return false;
            }

            try
            {
                var keySet = await GetKeySetAsync();
                if (keySet == null)
                {
                    _logger.LogWarning("Failed to retrieve Cloudflare JWKS");
                    return false;
                }

                var tokenHandler = new JwtSecurityTokenHandler();

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"https://{_teamDomain}",
                    ValidateAudience = true,
                    ValidAudience = _expectedAudience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKeys = keySet.GetSigningKeys(),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                if (validatedToken is JwtSecurityToken jwtToken)
                {
                    // Log the authenticated user's email if available
                    var email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
                    _logger.LogInformation("Cloudflare Access token validated. User: {Email}", email ?? "unknown");
                }

                return true;
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogWarning("Cloudflare Access token has expired");
                return false;
            }
            catch (SecurityTokenInvalidAudienceException)
            {
                _logger.LogWarning("Cloudflare Access token has invalid audience");
                return false;
            }
            catch (SecurityTokenInvalidIssuerException)
            {
                _logger.LogWarning("Cloudflare Access token has invalid issuer");
                return false;
            }
            catch (SecurityTokenValidationException ex)
            {
                _logger.LogWarning(ex, "Cloudflare Access token validation failed");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error validating Cloudflare Access token");
                return false;
            }
        }

        private async Task<JsonWebKeySet?> GetKeySetAsync()
        {
            // Check if we have a valid cached key set
            if (_cachedKeySet != null && DateTime.UtcNow < _keySetCacheExpiry)
            {
                return _cachedKeySet;
            }

            await _keySetLock.WaitAsync();
            try
            {
                // Double-check after acquiring lock
                if (_cachedKeySet != null && DateTime.UtcNow < _keySetCacheExpiry)
                {
                    return _cachedKeySet;
                }

                var certsUrl = $"https://{_teamDomain}/cdn-cgi/access/certs";
                _logger.LogDebug("Fetching Cloudflare JWKS from {Url}", certsUrl);

                var response = await _httpClient.GetAsync(certsUrl);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to fetch Cloudflare JWKS. Status: {StatusCode}", response.StatusCode);
                    return null;
                }

                var json = await response.Content.ReadAsStringAsync();
                _cachedKeySet = new JsonWebKeySet(json);
                _keySetCacheExpiry = DateTime.UtcNow.Add(_keySetCacheDuration);

                _logger.LogDebug("Cloudflare JWKS cached. Keys count: {Count}", _cachedKeySet.Keys.Count);

                return _cachedKeySet;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching Cloudflare JWKS");
                return null;
            }
            finally
            {
                _keySetLock.Release();
            }
        }
    }
}
