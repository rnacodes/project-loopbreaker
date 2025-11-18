using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    /// <summary>
    /// DTO for returning the result of an article sync operation.
    /// Used when syncing articles from Instapaper API.
    /// </summary>
    public class ArticleSyncResultDto
    {
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
        
        [JsonPropertyName("newArticlesCount")]
        public int NewArticlesCount { get; set; }
        
        [JsonPropertyName("updatedArticlesCount")]
        public int UpdatedArticlesCount { get; set; }
        
        [JsonPropertyName("totalArticlesCount")]
        public int TotalArticlesCount { get; set; }
        
        [JsonPropertyName("lastSyncDate")]
        public DateTime LastSyncDate { get; set; }
        
        [JsonPropertyName("errors")]
        public List<string> Errors { get; set; } = new List<string>();
    }
}

