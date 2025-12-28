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

export const getMediaTypeColor = (mediaType) => {
  switch (mediaType) {
    case 'Book': return 'purple.500';
    case 'Podcast': return 'green.500';
    case 'Movie': return 'red.500';
    case 'TVShow': return 'blue.500';
    case 'Video': return 'orange.500';
    case 'Article': return 'teal.500';
    case 'Website': return 'cyan.500';
    case 'VideoGame': return 'pink.500';
    default: return 'gray.500';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return 'green.500';
    case 'InProgress': return 'blue.500';
    case 'Planned': return 'yellow.500';
    case 'Dropped': return 'red.500';
    case 'OnHold': return 'orange.500';
    default: return 'gray.500';
  }
};

export const getRatingIcon = (rating) => {
  // Assuming a rating out of 5, you can map it to a star icon or similar
  // For simplicity, let's return a string representation
  if (rating === undefined || rating === null) return 'No Rating';
  return '⭐'.repeat(rating);
};

export const getRatingText = (rating) => {
  if (rating === undefined || rating === null) return 'Not Rated';
  return `${rating}/5 Stars`;
};
