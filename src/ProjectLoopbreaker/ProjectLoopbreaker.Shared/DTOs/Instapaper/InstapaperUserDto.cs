using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    public class InstapaperUserDto
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;
        
        [JsonPropertyName("user_id")]
        public int UserId { get; set; }
        
        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;
        
        [JsonPropertyName("subscription_is_active")]
        public string? SubscriptionIsActive { get; set; }
        
        /// <summary>
        /// Gets whether the user has an active subscription
        /// </summary>
        public bool HasActiveSubscription => SubscriptionIsActive == "1";
    }
}
