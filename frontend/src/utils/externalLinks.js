/**
 * Utility functions for generating external service URLs for media items
 */

/**
 * Generate a JustWatch search URL for "Where to Watch" functionality
 * @param {string} title - The title of the movie or TV show
 * @returns {string} JustWatch search URL
 */
export const getJustWatchUrl = (title) => {
  if (!title) return null;
  return `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;
};

/**
 * Generate an IMDb URL from an IMDb ID
 * @param {string} imdbId - The IMDb ID (e.g., "tt1234567")
 * @returns {string|null} IMDb URL or null if no ID provided
 */
export const getImdbUrl = (imdbId) => {
  if (!imdbId) return null;
  return `https://www.imdb.com/title/${imdbId}/`;
};

/**
 * Generate a TMDb movie URL
 * @param {string} tmdbId - The TMDb movie ID
 * @returns {string|null} TMDb movie URL or null if no ID provided
 */
export const getTmdbMovieUrl = (tmdbId) => {
  if (!tmdbId) return null;
  return `https://www.themoviedb.org/movie/${tmdbId}`;
};

/**
 * Generate a TMDb TV show URL
 * @param {string} tmdbId - The TMDb TV show ID
 * @returns {string|null} TMDb TV show URL or null if no ID provided
 */
export const getTmdbTvShowUrl = (tmdbId) => {
  if (!tmdbId) return null;
  return `https://www.themoviedb.org/tv/${tmdbId}`;
};

/**
 * Generate a full TMDb image URL from a path
 * @param {string} imagePath - The image path from TMDb (e.g., "/abc123.jpg")
 * @param {string} size - The image size (default: "w500"). Options: w92, w154, w185, w342, w500, w780, original
 * @returns {string|null} Full TMDb image URL or null if no path provided
 */
export const getTmdbImageUrl = (imagePath, size = 'w500') => {
  if (!imagePath) return null;
  return `https://image.tmdb.org/t/p/${size}${imagePath}`;
};

