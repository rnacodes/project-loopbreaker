using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    /// <summary>
    /// Represents user information from the Instapaper API.
    /// </summary>
    public class InstapaperUserDto
    {
        [JsonPropertyName("user_id")]
        public string UserId { get; set; } = string.Empty;

        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [JsonPropertyName("subscription_is_active")]
        public string SubscriptionIsActive { get; set; } = "0";

        public bool HasActiveSubscription => SubscriptionIsActive == "1";
    }
}
