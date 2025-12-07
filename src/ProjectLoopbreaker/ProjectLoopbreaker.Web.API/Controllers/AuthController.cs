using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Login endpoint that validates credentials and returns a JWT token
        /// </summary>
        /// <param name="model">Login credentials (username and password)</param>
        /// <returns>JWT token if credentials are valid</returns>
        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequestDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            // Validate User Credentials
            // TODO: Replace this with actual user validation against your database
            // For now, using environment variables or configuration for simple auth
            var validUsername = Environment.GetEnvironmentVariable("AUTH_USERNAME") ?? 
                               _configuration["Auth:Username"] ?? 
                               "admin";
            
            var validPassword = Environment.GetEnvironmentVariable("AUTH_PASSWORD") ?? 
                               _configuration["Auth:Password"] ?? 
                               "password123";

            if (model.Username != validUsername || model.Password != validPassword)
            {
                _logger.LogWarning("Failed login attempt for username: {Username}", model.Username);
                return Unauthorized(new { message = "Invalid username or password" });
            }

            // Generate Token
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwtSettings["Secret"];
                
                if (string.IsNullOrEmpty(jwtSecret))
                {
                    _logger.LogError("JWT Secret is not configured");
                    return StatusCode(500, new { message = "Authentication is not properly configured" });
                }

                var key = Encoding.ASCII.GetBytes(jwtSecret);
                var expiryMinutes = double.Parse(jwtSettings["ExpiryMinutes"] ?? "60");
                var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

                var tokenHandler = new JwtSecurityTokenHandler();
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.Name, model.Username),
                        new Claim("userId", Guid.NewGuid().ToString()), // Generate a user ID
                        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                    }),
                    Expires = expiresAt,
                    Issuer = jwtSettings["Issuer"],
                    Audience = jwtSettings["Audience"],
                    SigningCredentials = new SigningCredentials(
                        new SymmetricSecurityKey(key), 
                        SecurityAlgorithms.HmacSha256Signature)
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                _logger.LogInformation("User {Username} logged in successfully", model.Username);

                return Ok(new LoginResponseDto
                {
                    Token = tokenString,
                    Username = model.Username,
                    ExpiresAt = expiresAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating JWT token");
                return StatusCode(500, new { message = "An error occurred while generating authentication token" });
            }
        }

        /// <summary>
        /// Validates if the current token is still valid
        /// </summary>
        /// <returns>Token validation result</returns>
        [HttpGet("validate")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            return Ok(new { 
                valid = true, 
                username = username,
                message = "Token is valid" 
            });
        }

        /// <summary>
        /// Logout endpoint (client-side should remove token)
        /// </summary>
        /// <returns>Success message</returns>
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            _logger.LogInformation("User {Username} logged out", username);
            
            // With JWT, logout is primarily handled client-side by removing the token
            // However, you could implement token blacklisting here if needed
            return Ok(new { message = "Logged out successfully" });
        }
    }
}
