/**
 * Formats enum values by adding spaces between words
 * Examples:
 * - "TVShow" -> "TV Show"
 * - "VideoGame" -> "Video Game"
 * - "ActivelyExploring" -> "Actively Exploring"
 * - "Uncharted" -> "Uncharted" (no change needed)
 */
export const formatEnumValue = (value) => {
  if (!value) return value;
  
  // Add space before capital letters (except the first one)
  // and before sequences of capitals followed by a lowercase letter
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase: "activelyExploring" -> "actively Exploring"
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2'); // PascalCase: "TVShow" -> "TV Show"
};

/**
 * Formats media type enum values for display
 */
export const formatMediaType = (mediaType) => {
  return formatEnumValue(mediaType);
};

/**
 * Formats status enum values for display
 */
export const formatStatus = (status) => {
  return formatEnumValue(status);
};

