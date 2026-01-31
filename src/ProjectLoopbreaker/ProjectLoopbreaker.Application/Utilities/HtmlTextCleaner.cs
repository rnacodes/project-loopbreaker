using System.Text.RegularExpressions;

namespace ProjectLoopbreaker.Application.Utilities
{
    /// <summary>
    /// Utility class for cleaning HTML, CSS, and other formatting from text content.
    /// Used to clean highlight text from Readwise that may contain embedded styles.
    /// </summary>
    public static class HtmlTextCleaner
    {
        /// <summary>
        /// Cleans HTML and CSS from text, preserving only the readable content.
        /// </summary>
        /// <param name="text">The text to clean</param>
        /// <returns>Cleaned text with HTML/CSS removed</returns>
        public static string Clean(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            var result = text;

            // Remove inline CSS styles (e.g., "color:#FFD700;margin-right:0.5rem;")
            // Pattern matches CSS property:value pairs with optional semicolons
            result = Regex.Replace(result, @"[a-z\-]+:\s*[^;}]+[;}]", " ", RegexOptions.IgnoreCase);

            // Remove CSS selectors and blocks (e.g., "@media (min-width:600px){font-size:1.5rem;}")
            result = Regex.Replace(result, @"@[a-z\-]+\s*\([^)]*\)\s*\{[^}]*\}", " ", RegexOptions.IgnoreCase);

            // Remove pseudo-elements (e.g., "&::after{...}" or "::before{...}")
            result = Regex.Replace(result, @"&?::[a-z\-]+\s*\{[^}]*\}", " ", RegexOptions.IgnoreCase);

            // Remove remaining CSS-like patterns (e.g., "{font-size:1.2rem;}")
            result = Regex.Replace(result, @"\{[^}]*\}", " ", RegexOptions.IgnoreCase);

            // Remove HTML tags
            result = Regex.Replace(result, @"<[^>]+>", " ", RegexOptions.IgnoreCase);

            // Remove HTML entities
            result = Regex.Replace(result, @"&[a-zA-Z]+;", " ");
            result = Regex.Replace(result, @"&#\d+;", " ");

            // Remove "content:" CSS property remnants
            result = Regex.Replace(result, @"content\s*:", " ", RegexOptions.IgnoreCase);

            // Clean up multiple spaces and trim
            result = Regex.Replace(result, @"\s+", " ");
            result = result.Trim();

            return result;
        }

        /// <summary>
        /// Checks if text appears to contain HTML or CSS that should be cleaned.
        /// </summary>
        /// <param name="text">The text to check</param>
        /// <returns>True if text contains HTML/CSS patterns</returns>
        public static bool ContainsHtmlOrCss(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return false;

            // Check for common HTML/CSS patterns
            return Regex.IsMatch(text, @"<[a-z]+|</[a-z]+>|[a-z\-]+:\s*[^;]+;|@media|::after|::before", RegexOptions.IgnoreCase);
        }
    }
}
