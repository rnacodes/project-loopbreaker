using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Infrastructure.Clients
{
    /// <summary>
    /// HTTP client for interacting with DigitalOcean Gradient AI Platform.
    /// Implements OpenAI-compatible API endpoints for embeddings and chat completions.
    /// </summary>
    public class GradientAIClient : IGradientAIClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<GradientAIClient> _logger;
        private readonly string _embeddingModel;
        private readonly string _generationModel;
        private readonly JsonSerializerOptions _jsonOptions;
        private readonly bool _isConfigured;

        public string EmbeddingModelName => _embeddingModel;
        public string GenerationModelName => _generationModel;

        public GradientAIClient(HttpClient httpClient, ILogger<GradientAIClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            // Get model names from environment variables with defaults
            _embeddingModel = Environment.GetEnvironmentVariable("GRADIENT_EMBEDDING_MODEL") ?? "gte-large-v1.5";
            _generationModel = Environment.GetEnvironmentVariable("GRADIENT_GENERATION_MODEL") ?? "gpt-4-turbo";

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };

            // Check if API key is configured
            var apiKey = Environment.GetEnvironmentVariable("GRADIENT_API_KEY");
            _isConfigured = !string.IsNullOrEmpty(apiKey);

            if (!_isConfigured)
            {
                _logger.LogWarning("Gradient AI API key not configured. AI features will be disabled.");
            }
            else
            {
                _logger.LogInformation("Gradient AI client initialized with embedding model: {EmbeddingModel}, generation model: {GenerationModel}",
                    _embeddingModel, _generationModel);
            }
        }

        /// <inheritdoc />
        public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
        {
            if (!_isConfigured)
            {
                throw new InvalidOperationException("Gradient AI is not configured. Set the GRADIENT_API_KEY environment variable.");
            }

            if (string.IsNullOrWhiteSpace(text))
            {
                throw new ArgumentException("Text cannot be null or empty.", nameof(text));
            }

            try
            {
                var request = new EmbeddingRequest
                {
                    Model = _embeddingModel,
                    Input = new[] { text }
                };

                var jsonContent = JsonSerializer.Serialize(request, _jsonOptions);
                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogDebug("Generating embedding for text ({Length} chars) using model {Model}",
                    text.Length, _embeddingModel);

                var response = await _httpClient.PostAsync("embeddings", httpContent, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Gradient AI embedding request failed with status {Status}: {Error}",
                        response.StatusCode, errorContent);
                    throw new HttpRequestException($"Gradient AI embedding request failed: {response.StatusCode} - {errorContent}");
                }

                var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                var embeddingResponse = JsonSerializer.Deserialize<EmbeddingResponse>(responseJson, _jsonOptions);

                if (embeddingResponse?.Data == null || embeddingResponse.Data.Length == 0)
                {
                    throw new InvalidOperationException("No embedding data returned from Gradient AI.");
                }

                _logger.LogDebug("Successfully generated embedding with {Dimensions} dimensions",
                    embeddingResponse.Data[0].Embedding.Length);

                return embeddingResponse.Data[0].Embedding;
            }
            catch (Exception ex) when (ex is not InvalidOperationException && ex is not ArgumentException)
            {
                _logger.LogError(ex, "Error generating embedding from Gradient AI");
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<List<float[]>> GenerateEmbeddingsBatchAsync(List<string> texts, CancellationToken cancellationToken = default)
        {
            if (!_isConfigured)
            {
                throw new InvalidOperationException("Gradient AI is not configured. Set the GRADIENT_API_KEY environment variable.");
            }

            if (texts == null || texts.Count == 0)
            {
                throw new ArgumentException("Texts list cannot be null or empty.", nameof(texts));
            }

            // Filter out empty texts
            var validTexts = texts.Where(t => !string.IsNullOrWhiteSpace(t)).ToList();
            if (validTexts.Count == 0)
            {
                throw new ArgumentException("All texts in the list are empty.", nameof(texts));
            }

            try
            {
                var request = new EmbeddingRequest
                {
                    Model = _embeddingModel,
                    Input = validTexts.ToArray()
                };

                var jsonContent = JsonSerializer.Serialize(request, _jsonOptions);
                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogDebug("Generating batch embeddings for {Count} texts using model {Model}",
                    validTexts.Count, _embeddingModel);

                var response = await _httpClient.PostAsync("embeddings", httpContent, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Gradient AI batch embedding request failed with status {Status}: {Error}",
                        response.StatusCode, errorContent);
                    throw new HttpRequestException($"Gradient AI batch embedding request failed: {response.StatusCode} - {errorContent}");
                }

                var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                var embeddingResponse = JsonSerializer.Deserialize<EmbeddingResponse>(responseJson, _jsonOptions);

                if (embeddingResponse?.Data == null || embeddingResponse.Data.Length == 0)
                {
                    throw new InvalidOperationException("No embedding data returned from Gradient AI.");
                }

                // Sort by index to ensure correct order
                var sortedEmbeddings = embeddingResponse.Data
                    .OrderBy(d => d.Index)
                    .Select(d => d.Embedding)
                    .ToList();

                _logger.LogDebug("Successfully generated {Count} embeddings with {Dimensions} dimensions each",
                    sortedEmbeddings.Count, sortedEmbeddings.FirstOrDefault()?.Length ?? 0);

                return sortedEmbeddings;
            }
            catch (Exception ex) when (ex is not InvalidOperationException && ex is not ArgumentException)
            {
                _logger.LogError(ex, "Error generating batch embeddings from Gradient AI");
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<string> GenerateTextAsync(
            string prompt,
            string systemPrompt = "",
            int maxTokens = 500,
            CancellationToken cancellationToken = default)
        {
            if (!_isConfigured)
            {
                throw new InvalidOperationException("Gradient AI is not configured. Set the GRADIENT_API_KEY environment variable.");
            }

            if (string.IsNullOrWhiteSpace(prompt))
            {
                throw new ArgumentException("Prompt cannot be null or empty.", nameof(prompt));
            }

            try
            {
                var messages = new List<ChatMessage>();

                if (!string.IsNullOrWhiteSpace(systemPrompt))
                {
                    messages.Add(new ChatMessage { Role = "system", Content = systemPrompt });
                }

                messages.Add(new ChatMessage { Role = "user", Content = prompt });

                var request = new ChatCompletionRequest
                {
                    Model = _generationModel,
                    Messages = messages.ToArray(),
                    MaxTokens = maxTokens,
                    Temperature = 0.7
                };

                var jsonContent = JsonSerializer.Serialize(request, _jsonOptions);
                var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogDebug("Generating text response using model {Model} (max {MaxTokens} tokens)",
                    _generationModel, maxTokens);

                var response = await _httpClient.PostAsync("chat/completions", httpContent, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    _logger.LogError("Gradient AI chat completion request failed with status {Status}: {Error}",
                        response.StatusCode, errorContent);
                    throw new HttpRequestException($"Gradient AI chat completion request failed: {response.StatusCode} - {errorContent}");
                }

                var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
                var chatResponse = JsonSerializer.Deserialize<ChatCompletionResponse>(responseJson, _jsonOptions);

                if (chatResponse?.Choices == null || chatResponse.Choices.Length == 0)
                {
                    throw new InvalidOperationException("No response returned from Gradient AI.");
                }

                var generatedText = chatResponse.Choices[0].Message?.Content ?? string.Empty;

                _logger.LogDebug("Successfully generated text response ({Length} chars)", generatedText.Length);

                return generatedText.Trim();
            }
            catch (Exception ex) when (ex is not InvalidOperationException && ex is not ArgumentException)
            {
                _logger.LogError(ex, "Error generating text from Gradient AI");
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<bool> IsAvailableAsync()
        {
            if (!_isConfigured)
            {
                return false;
            }

            try
            {
                // Try a simple models list call to check connectivity
                var response = await _httpClient.GetAsync("models");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gradient AI availability check failed");
                return false;
            }
        }

        #region Request/Response DTOs

        private class EmbeddingRequest
        {
            [JsonPropertyName("model")]
            public string Model { get; set; } = string.Empty;

            [JsonPropertyName("input")]
            public string[] Input { get; set; } = Array.Empty<string>();
        }

        private class EmbeddingResponse
        {
            [JsonPropertyName("data")]
            public EmbeddingData[] Data { get; set; } = Array.Empty<EmbeddingData>();

            [JsonPropertyName("model")]
            public string? Model { get; set; }

            [JsonPropertyName("usage")]
            public UsageInfo? Usage { get; set; }
        }

        private class EmbeddingData
        {
            [JsonPropertyName("index")]
            public int Index { get; set; }

            [JsonPropertyName("embedding")]
            public float[] Embedding { get; set; } = Array.Empty<float>();
        }

        private class ChatCompletionRequest
        {
            [JsonPropertyName("model")]
            public string Model { get; set; } = string.Empty;

            [JsonPropertyName("messages")]
            public ChatMessage[] Messages { get; set; } = Array.Empty<ChatMessage>();

            [JsonPropertyName("max_tokens")]
            public int MaxTokens { get; set; }

            [JsonPropertyName("temperature")]
            public double Temperature { get; set; }
        }

        private class ChatMessage
        {
            [JsonPropertyName("role")]
            public string Role { get; set; } = string.Empty;

            [JsonPropertyName("content")]
            public string Content { get; set; } = string.Empty;
        }

        private class ChatCompletionResponse
        {
            [JsonPropertyName("id")]
            public string? Id { get; set; }

            [JsonPropertyName("choices")]
            public ChatChoice[] Choices { get; set; } = Array.Empty<ChatChoice>();

            [JsonPropertyName("usage")]
            public UsageInfo? Usage { get; set; }
        }

        private class ChatChoice
        {
            [JsonPropertyName("index")]
            public int Index { get; set; }

            [JsonPropertyName("message")]
            public ChatMessage? Message { get; set; }

            [JsonPropertyName("finish_reason")]
            public string? FinishReason { get; set; }
        }

        private class UsageInfo
        {
            [JsonPropertyName("prompt_tokens")]
            public int PromptTokens { get; set; }

            [JsonPropertyName("completion_tokens")]
            public int CompletionTokens { get; set; }

            [JsonPropertyName("total_tokens")]
            public int TotalTokens { get; set; }
        }

        #endregion
    }
}
