import axios from 'axios';

// Use environment variable or fall back to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5033/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Always send cookies with requests
});

// Store the current access token in memory (not localStorage)
let currentAccessToken = null;

// Function to set the access token (called by AuthContext)
export const setAccessToken = (token) => {
    currentAccessToken = token;
};

// Function to get the access token
export const getAccessToken = () => {
    return currentAccessToken;
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

// Request Interceptor - Attach JWT token to all requests
apiClient.interceptors.request.use(
    (config) => {
        // Get token from memory (not localStorage)
        const token = currentAccessToken;
        
        if (token) {
            // Attach the token as a Bearer token
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor - Handle token expiration with automatic refresh
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Check if we're in demo mode - skip authentication logic in demo
        const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
        
        // If the error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // In demo mode, don't try to refresh or redirect - just reject the error
            if (isDemoMode) {
                console.log('Demo mode: Skipping authentication for 401 error');
                return Promise.reject(error);
            }
            
            // Don't try to refresh on login or refresh endpoints
            const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                                  originalRequest.url?.includes('/auth/refresh');
            
            if (isAuthEndpoint) {
                return Promise.reject(error);
            }
            
            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return apiClient(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }
            
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                // Attempt to refresh the access token
                const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
                    withCredentials: true // Send HttpOnly cookie with refresh token
                });
                
                const { token: newToken } = response.data;
                currentAccessToken = newToken;
                
                // Update the authorization header
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                
                // Process any queued requests
                processQueue(null, newToken);
                
                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed - user needs to login again
                processQueue(refreshError, null);
                currentAccessToken = null;
                
                // Only redirect to login if we're not already there
                const currentPath = window.location.pathname;
                if (currentPath !== '/login') {
                    console.warn('Session expired. Please login again.');
                    window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);

// ============================================
// Authentication API calls
// ============================================

/**
 * Login with username and password
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise} Response with token
 */
export const login = async (username, password) => {
    try {
        const response = await apiClient.post('/auth/login', { username, password });
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

/**
 * Validate the current token
 * @returns {Promise} Token validation result
 */
export const validateToken = async () => {
    try {
        const response = await apiClient.get('/auth/validate');
        return response.data;
    } catch (error) {
        console.error('Token validation error:', error);
        throw error;
    }
};

/**
 * Logout (server-side notification)
 * @returns {Promise} Logout confirmation
 */
export const logout = async () => {
    try {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

// ============================================
// Media API calls
// ============================================

export const addMedia = (mediaData) => {
    return apiClient.post('/media', mediaData);
};

export const getMediaById = (id) => {
    return apiClient.get(`/media/${id}`);
};

export const getAllMedia = () => {
    return apiClient.get('/media');
};

export const searchMedia = (query) => {
    return apiClient.get(`/media/search?query=${encodeURIComponent(query)}`);
};

export const getMediaByType = (mediaType) => {
    return apiClient.get(`/media/by-type/${encodeURIComponent(mediaType)}`);
};

// Mixlist API calls
export const getAllMixlists = () => {
    return apiClient.get('/mixlist');
};

export const searchMixlists = (query) => {
    return apiClient.get(`/mixlist/search?query=${encodeURIComponent(query)}`);
};

export const createMixlist = (mixlistData) => {
    return apiClient.post('/mixlist', mixlistData);
};

export const addMediaToMixlist = (mixlistId, mediaItemId) => {
    return apiClient.post(`/mixlist/${mixlistId}/items/${mediaItemId}`);
};

export const getMixlistById = (id) => {
    return apiClient.get(`/mixlist/${id}`);
};

export const updateMixlist = (id, mixlistData) => {
    return apiClient.put(`/mixlist/${id}`, mixlistData);
};

// Mixlist deletion
export const deleteMixlist = (id) => {
    return apiClient.delete(`/mixlist/${id}`);
};

export const removeMediaFromMixlist = (mixlistId, mediaItemId) => {
    return apiClient.delete(`/mixlist/${mixlistId}/items/${mediaItemId}`);
};

export const seedMixlists = () => {
    return apiClient.post('/dev/seed-mixlists');
};

// Media update functions
export const updateMedia = (id, mediaData) => {
    return apiClient.put(`/media/${id}`, mediaData);
};

// Media deletion
export const deleteMedia = (id) => {
    return apiClient.delete(`/media/${id}`);
};

// Bulk media deletion
export const bulkDeleteMedia = (ids) => {
    return apiClient.delete('/media/bulk', {
        data: { ids }
    });
};

// Legacy - Remove after migration
// export const addPodcastEpisode = (episodeData) => {
//     return apiClient.post('/podcastepisode', episodeData);
// };

// Podcast Search Functions - Using real ListenNotes API only
export const searchPodcasts = async (query) => {
    try {
        const response = await apiClient.get(`/ListenNotes/search?query=${encodeURIComponent(query)}&type=podcast`);
        return response.data;
    } catch (error) {
        console.error('Error searching podcasts:', error);
        throw error;
    }
};

export const getPodcastFromApi = async (id) => {
    try {
        const response = await apiClient.get(`/ListenNotes/podcasts/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error getting podcast:', error);
        throw error;
    }
};

export const importPodcastFromApi = async (podcastData) => {
    try {
        let response;
        
        if (podcastData.podcastId || podcastData.PodcastId) {
            // Import by ID
            response = await apiClient.post(`/podcast/from-api/${podcastData.podcastId || podcastData.PodcastId}`);
        } else if (podcastData.podcastName || podcastData.PodcastName) {
            // Import by name
            response = await apiClient.post('/podcast/from-api/by-name', {
                podcastName: podcastData.podcastName || podcastData.PodcastName
            });
        } else {
            throw new Error('Either podcastId or podcastName must be provided');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error importing podcast:', error);
        throw error;
    }
};

// Topics API calls
export const getAllTopics = () => {
    return apiClient.get('/topics');
};

export const searchTopics = (query) => {
    return apiClient.get(`/topics/search?query=${encodeURIComponent(query)}`);
};

export const createTopic = (topicData) => {
    return apiClient.post('/topics', topicData);
};

export const deleteTopic = (topicId) => {
    return apiClient.delete(`/topics/${topicId}`);
};

// Genres API calls
export const getAllGenres = () => {
    return apiClient.get('/genres');
};

export const searchGenres = (query) => {
    return apiClient.get(`/genres/search?query=${encodeURIComponent(query)}`);
};

export const createGenre = (genreData) => {
    return apiClient.post('/genres', genreData);
};

export const deleteGenre = (genreId) => {
    return apiClient.delete(`/genres/${genreId}`);
};

export const importGenresFromJson = (genres) => {
    return apiClient.post('/genres/import/json', genres);
};

export const importGenresFromCsv = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/genres/import/csv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const importTopicsFromJson = (topics) => {
    return apiClient.post('/topics/import/json', topics);
};

export const importTopicsFromCsv = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/topics/import/csv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// Podcast Series API calls
export const getAllPodcastSeries = () => {
    return apiClient.get('/podcast/series');
};

export const getPodcastSeriesById = (id) => {
    return apiClient.get(`/podcast/series/${id}`);
};

export const searchPodcastSeries = (query) => {
    return apiClient.get(`/podcast/series/search?query=${encodeURIComponent(query)}`);
};

export const createPodcastSeries = (seriesData) => {
    return apiClient.post('/podcast/series', seriesData);
};

export const deletePodcastSeries = (id) => {
    return apiClient.delete(`/podcast/series/${id}`);
};

export const subscribeToPodcastSeries = (seriesId) => {
    return apiClient.post(`/podcast/series/${seriesId}/subscribe`);
};

export const unsubscribeFromPodcastSeries = (seriesId) => {
    return apiClient.post(`/podcast/series/${seriesId}/unsubscribe`);
};

export const getSubscribedPodcastSeries = () => {
    return apiClient.get('/podcast/series/subscriptions');
};

export const syncPodcastSeriesEpisodes = (seriesId) => {
    return apiClient.post(`/podcast/series/${seriesId}/sync`);
};

export const importPodcastSeriesFromApi = (podcastId) => {
    return apiClient.post(`/podcast/series/from-api/${podcastId}`);
};

export const importPodcastSeriesByName = (podcastName) => {
    return apiClient.post('/podcast/series/from-api/by-name', { podcastName });
};

// Podcast Episode API calls

// Import a single podcast episode from the ListenNotes API
export const importPodcastEpisodeFromApi = async (episodeId, seriesId) => {
    try {
        const response = await apiClient.post(`/podcast/episodes/from-api/${episodeId}?seriesId=${seriesId}`);
        return response.data;
    } catch (error) {
        console.error('Error importing podcast episode from API:', error);
        throw error;
    }
};
export const getEpisodesBySeriesId = (seriesId) => {
    return apiClient.get(`/podcast/series/${seriesId}/episodes`);
};

export const getPodcastEpisodeById = (id) => {
    return apiClient.get(`/podcast/episodes/${id}`);
};

export const getAllPodcastEpisodes = () => {
    return apiClient.get('/podcast/episodes');
};

export const createPodcastEpisode = (episodeData) => {
    return apiClient.post('/podcast/episodes', episodeData);
};

export const deletePodcastEpisode = (id) => {
    return apiClient.delete(`/podcast/episodes/${id}`);
};

// Media filtering API calls
export const getMediaByTopic = (topicId) => {
    return apiClient.get(`/media/by-topic/${topicId}`);
};

export const getMediaByGenre = (genreId) => {
    return apiClient.get(`/media/by-genre/${genreId}`);
};

// Book API calls
export const getAllBooks = () => {
    return apiClient.get('/book');
};

export const getBookById = (id) => {
    return apiClient.get(`/book/${id}`);
};

export const getBooksByAuthor = (author) => {
    return apiClient.get(`/book/by-author/${encodeURIComponent(author)}`);
};

export const getBookSeries = () => {
    return apiClient.get('/book/series');
};

export const createBook = (bookData) => {
    return apiClient.post('/book', bookData);
};

export const updateBook = (id, bookData) => {
    return apiClient.put(`/book/${id}`, bookData);
};

export const deleteBook = (id) => {
    return apiClient.delete(`/book/${id}`);
};

// Upload API calls
export const uploadCsv = (file, mediaType = null) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Only append mediaType if it's provided (for single-type CSVs)
    // If not provided, backend will read MediaType from each row
    if (mediaType) {
        formData.append('mediaType', mediaType);
    }
    
    return apiClient.post('/upload/csv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const uploadThumbnail = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/upload/thumbnail', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const uploadThumbnailFromUrl = (url) => {
    return apiClient.post('/upload/thumbnail-from-url', { url });
};

// Open Library / Book Import API calls
export const searchBooksFromOpenLibrary = async (searchParams) => {
    try {
        const params = new URLSearchParams({
            query: searchParams.query,
            searchType: searchParams.searchType || 'General',
            ...(searchParams.offset && { offset: searchParams.offset }),
            ...(searchParams.limit && { limit: searchParams.limit })
        });
        const response = await apiClient.get(`/book/search-openlibrary?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error searching Open Library:', error);
        throw error;
    }
};

export const importBookFromOpenLibrary = async (importData) => {
    try {
        const response = await apiClient.post('/book/import-from-openlibrary', importData);
        return response.data;
    } catch (error) {
        console.error('Error importing book from Open Library:', error);
        throw error;
    }
};

// TMDB API calls
export const searchMovies = async (query, page = 1, language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/search/movies?query=${encodeURIComponent(query)}&page=${page}&language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error searching movies:', error);
        throw error;
    }
};

export const searchTvShows = async (query, page = 1, language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/search/tv?query=${encodeURIComponent(query)}&page=${page}&language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error searching TV shows:', error);
        throw error;
    }
};

export const searchMulti = async (query, page = 1, language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error searching multi:', error);
        throw error;
    }
};

export const getMovieDetails = async (movieId, language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/movie/${movieId}?language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error getting movie details:', error);
        throw error;
    }
};

export const getTvShowDetails = async (tvShowId, language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/tv/${tvShowId}?language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error getting TV show details:', error);
        throw error;
    }
};

export const getPopularMovies = async (page = 1, language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/movies/popular?page=${page}&language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error getting popular movies:', error);
        throw error;
    }
};

export const getPopularTvShows = async (page = 1, language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/tv/popular?page=${page}&language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error getting popular TV shows:', error);
        throw error;
    }
};

export const getMovieGenres = async (language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/genres/movies?language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error getting movie genres:', error);
        throw error;
    }
};

export const getTvGenres = async (language = 'en-US') => {
    try {
        const response = await apiClient.get(`/tmdb/genres/tv?language=${language}`);
        return response.data;
    } catch (error) {
        console.error('Error getting TV genres:', error);
        throw error;
    }
};

export const getTmdbImageUrl = async (imagePath, size = 'w500') => {
    try {
        const response = await apiClient.get(`/tmdb/image?imagePath=${encodeURIComponent(imagePath)}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error('Error getting TMDB image URL:', error);
        throw error;
    }
};

// Movie API calls
export const getAllMovies = () => {
    return apiClient.get('/movie');
};

export const getMovieById = (id) => {
    return apiClient.get(`/movie/${id}`);
};

export const getMoviesByDirector = (director) => {
    return apiClient.get(`/movie/by-director/${encodeURIComponent(director)}`);
};

export const getMoviesByYear = (year) => {
    return apiClient.get(`/movie/by-year/${year}`);
};

export const createMovie = (movieData) => {
    return apiClient.post('/movie', movieData);
};

export const updateMovie = (id, movieData) => {
    return apiClient.put(`/movie/${id}`, movieData);
};

export const deleteMovie = (id) => {
    return apiClient.delete(`/movie/${id}`);
};

export const importMovieFromTmdb = async (movieId) => {
    try {
        const response = await apiClient.post(`/movie/from-tmdb/${movieId}`);
        return response.data;
    } catch (error) {
        console.error('Error importing movie from TMDB:', error);
        throw error;
    }
};

export const searchMoviesFromTmdb = async (query, page = 1) => {
    try {
        const response = await apiClient.get(`/movie/search-tmdb?query=${encodeURIComponent(query)}&page=${page}`);
        return response.data;
    } catch (error) {
        console.error('Error searching movies from TMDB:', error);
        throw error;
    }
};

// TV Show API calls
export const getAllTvShows = () => {
    return apiClient.get('/tvshow');
};

export const getTvShowById = (id) => {
    return apiClient.get(`/tvshow/${id}`);
};

// Video API calls
export const getAllVideos = () => {
    return apiClient.get('/video');
};

export const getVideoById = (id) => {
    return apiClient.get(`/video/${id}`);
};

export const getVideosByChannel = (channelName) => {
    return apiClient.get(`/video/channel/${encodeURIComponent(channelName)}`);
};

export const getVideoSeries = () => {
    return apiClient.get('/video/series');
};

export const createVideo = (videoData) => {
    return apiClient.post('/video', videoData);
};

export const updateVideo = (id, videoData) => {
    return apiClient.put(`/video/${id}`, videoData);
};

export const deleteVideo = (id) => {
    return apiClient.delete(`/video/${id}`);
};

export const getPlaylistsForVideo = async (videoId) => {
    try {
        const response = await apiClient.get(`/video/${videoId}/playlists`);
        return response.data;
    } catch (error) {
        console.error('Error getting playlists for video:', error);
        throw error;
    }
};

export const getTvShowsByCreator = (creator) => {
    return apiClient.get(`/tvshow/by-creator/${encodeURIComponent(creator)}`);
};

export const getTvShowsByYear = (year) => {
    return apiClient.get(`/tvshow/by-year/${year}`);
};

export const createTvShow = (tvShowData) => {
    return apiClient.post('/tvshow', tvShowData);
};

export const updateTvShow = (id, tvShowData) => {
    return apiClient.put(`/tvshow/${id}`, tvShowData);
};

export const deleteTvShow = (id) => {
    return apiClient.delete(`/tvshow/${id}`);
};

export const importTvShowFromTmdb = async (tvShowId) => {
    try {
        const response = await apiClient.post(`/tvshow/from-tmdb/${tvShowId}`);
        return response.data;
    } catch (error) {
        console.error('Error importing TV show from TMDB:', error);
        throw error;
    }
};

export const searchTvShowsFromTmdb = async (query, page = 1) => {
    try {
        const response = await apiClient.get(`/tvshow/search-tmdb?query=${encodeURIComponent(query)}&page=${page}`);
        return response.data;
    } catch (error) {
        console.error('Error searching TV shows from TMDB:', error);
        throw error;
    }
};

// YouTube API calls
export const searchYouTube = async (query, type = 'video', maxResults = 25, pageToken = null, channelId = null) => {
    try {
        const params = new URLSearchParams({
            query,
            type,
            maxResults: maxResults.toString()
        });
        
        if (pageToken) params.append('pageToken', pageToken);
        if (channelId) params.append('channelId', channelId);
        
        const response = await apiClient.get(`/youtube/search?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error searching YouTube:', error);
        throw error;
    }
};

export const getYouTubeVideoDetails = async (videoId) => {
    try {
        const response = await apiClient.get(`/youtube/videos/${videoId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube video details:', error);
        throw error;
    }
};

export const getYouTubeVideos = async (videoIds) => {
    try {
        const idsString = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
        const response = await apiClient.get(`/youtube/videos?videoIds=${encodeURIComponent(idsString)}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube videos:', error);
        throw error;
    }
};

export const getYouTubePlaylistDetails = async (playlistId) => {
    try {
        const response = await apiClient.get(`/youtube/playlists/${playlistId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube playlist details:', error);
        throw error;
    }
};

export const getYouTubePlaylistItems = async (playlistId, maxResults = 50, pageToken = null) => {
    try {
        const params = new URLSearchParams({
            maxResults: maxResults.toString()
        });
        
        if (pageToken) params.append('pageToken', pageToken);
        
        const response = await apiClient.get(`/youtube/playlists/${playlistId}/items?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube playlist items:', error);
        throw error;
    }
};

export const getAllYouTubePlaylistItems = async (playlistId) => {
    try {
        const response = await apiClient.get(`/youtube/playlists/${playlistId}/all-items`);
        return response.data;
    } catch (error) {
        console.error('Error getting all YouTube playlist items:', error);
        throw error;
    }
};

export const getYouTubeChannelDetails = async (channelId) => {
    try {
        const response = await apiClient.get(`/youtube/channels/${channelId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube channel details:', error);
        throw error;
    }
};

export const getYouTubeChannelByUsername = async (username) => {
    try {
        const response = await apiClient.get(`/youtube/channels/by-username/${username}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube channel by username:', error);
        throw error;
    }
};

export const getYouTubeChannelUploads = async (channelId, maxResults = 25, pageToken = null) => {
    try {
        const params = new URLSearchParams({
            maxResults: maxResults.toString()
        });
        
        if (pageToken) params.append('pageToken', pageToken);
        
        const response = await apiClient.get(`/youtube/channels/${channelId}/uploads?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube channel uploads:', error);
        throw error;
    }
};

export const importYouTubeVideo = async (videoId) => {
    try {
        const response = await apiClient.post(`/youtube/import/video/${videoId}`);
        return response.data;
    } catch (error) {
        console.error('Error importing YouTube video:', error);
        throw error;
    }
};

export const importYouTubePlaylist = async (playlistId, importAsChannel = false) => {
    try {
        const params = new URLSearchParams({
            importAsChannel: importAsChannel.toString()
        });
        
        const response = await apiClient.post(`/youtube/import/playlist/${playlistId}?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error importing YouTube playlist:', error);
        throw error;
    }
};

export const importYouTubeChannel = async (channelId) => {
    try {
        const response = await apiClient.post(`/youtube/import/channel/${channelId}`);
        return response.data;
    } catch (error) {
        console.error('Error importing YouTube channel:', error);
        throw error;
    }
};

// YouTube Channel Management API calls (new channel entity endpoints)
export const getAllYouTubeChannels = async () => {
    try {
        const response = await apiClient.get('/youtubechannel');
        return response.data;
    } catch (error) {
        console.error('Error getting all YouTube channels:', error);
        throw error;
    }
};

export const getYouTubeChannelById = async (id) => {
    try {
        const response = await apiClient.get(`/youtubechannel/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube channel by ID:', error);
        throw error;
    }
};

export const getYouTubeChannelByExternalId = async (externalId) => {
    try {
        const response = await apiClient.get(`/youtubechannel/by-external/${externalId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube channel by external ID:', error);
        throw error;
    }
};

export const getYouTubeChannelVideos = async (channelId) => {
    try {
        const response = await apiClient.get(`/youtubechannel/${channelId}/videos`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube channel videos:', error);
        throw error;
    }
};

export const createYouTubeChannel = async (channelData) => {
    try {
        const response = await apiClient.post('/youtubechannel', channelData);
        return response.data;
    } catch (error) {
        console.error('Error creating YouTube channel:', error);
        throw error;
    }
};

export const updateYouTubeChannel = async (id, channelData) => {
    try {
        const response = await apiClient.put(`/youtubechannel/${id}`, channelData);
        return response.data;
    } catch (error) {
        console.error('Error updating YouTube channel:', error);
        throw error;
    }
};

export const deleteYouTubeChannel = async (id) => {
    try {
        await apiClient.delete(`/youtubechannel/${id}`);
    } catch (error) {
        console.error('Error deleting YouTube channel:', error);
        throw error;
    }
};

export const importYouTubeChannelEntity = async (channelId) => {
    try {
        const response = await apiClient.post(`/youtubechannel/import/${channelId}`);
        return response.data;
    } catch (error) {
        console.error('Error importing YouTube channel entity:', error);
        throw error;
    }
};

export const syncYouTubeChannelMetadata = async (id) => {
    try {
        const response = await apiClient.post(`/youtubechannel/${id}/sync`);
        return response.data;
    } catch (error) {
        console.error('Error syncing YouTube channel metadata:', error);
        throw error;
    }
};

export const checkYouTubeChannelExists = async (externalId) => {
    try {
        const response = await apiClient.get(`/youtubechannel/exists/${externalId}`);
        return response.data.exists;
    } catch (error) {
        console.error('Error checking if YouTube channel exists:', error);
        throw error;
    }
};

export const importFromYouTubeUrl = async (url) => {
    try {
        const response = await apiClient.post('/youtube/import/url', { url });
        return response.data;
    } catch (error) {
        console.error('Error importing from YouTube URL:', error);
        throw error;
    }
};

// YouTube Playlist Management API calls
export const getAllYouTubePlaylists = async () => {
    try {
        const response = await apiClient.get('/youtubeplaylist');
        return response.data;
    } catch (error) {
        console.error('Error getting all YouTube playlists:', error);
        throw error;
    }
};

export const getYouTubePlaylistById = async (id, includeVideos = false) => {
    try {
        const params = new URLSearchParams({
            includeVideos: includeVideos.toString()
        });
        const response = await apiClient.get(`/youtubeplaylist/${id}?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube playlist by ID:', error);
        throw error;
    }
};

export const getYouTubePlaylistByExternalId = async (externalId, includeVideos = false) => {
    try {
        const params = new URLSearchParams({
            includeVideos: includeVideos.toString()
        });
        const response = await apiClient.get(`/youtubeplaylist/by-external/${externalId}?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube playlist by external ID:', error);
        throw error;
    }
};

export const getYouTubePlaylistVideos = async (id) => {
    try {
        const response = await apiClient.get(`/youtubeplaylist/${id}/videos`);
        return response.data;
    } catch (error) {
        console.error('Error getting YouTube playlist videos:', error);
        throw error;
    }
};

export const importYouTubePlaylistEntity = async (playlistExternalId) => {
    try {
        const response = await apiClient.post(`/youtubeplaylist/import/${playlistExternalId}`);
        return response.data;
    } catch (error) {
        console.error('Error importing YouTube playlist:', error);
        throw error;
    }
};

export const syncYouTubePlaylist = async (id) => {
    try {
        const response = await apiClient.post(`/youtubeplaylist/${id}/sync`);
        return response.data;
    } catch (error) {
        console.error('Error syncing YouTube playlist:', error);
        throw error;
    }
};

export const addVideoToYouTubePlaylist = async (playlistId, videoId, position = null) => {
    try {
        const params = position !== null ? `?position=${position}` : '';
        const response = await apiClient.post(`/youtubeplaylist/${playlistId}/videos/${videoId}${params}`);
        return response.data;
    } catch (error) {
        console.error('Error adding video to YouTube playlist:', error);
        throw error;
    }
};

export const removeVideoFromYouTubePlaylist = async (playlistId, videoId) => {
    try {
        const response = await apiClient.delete(`/youtubeplaylist/${playlistId}/videos/${videoId}`);
        return response.data;
    } catch (error) {
        console.error('Error removing video from YouTube playlist:', error);
        throw error;
    }
};

export const deleteYouTubePlaylist = async (id) => {
    try {
        const response = await apiClient.delete(`/youtubeplaylist/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting YouTube playlist:', error);
        throw error;
    }
};

// Article API calls
export const getAllArticles = async () => {
    try {
        const response = await apiClient.get('/article');
        return response.data;
    } catch (error) {
        console.error('Error getting all articles:', error);
        throw error;
    }
};

export const getArticleById = async (id) => {
    try {
        const response = await apiClient.get(`/article/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error getting article:', error);
        throw error;
    }
};

export const createArticle = async (articleData) => {
    try {
        const response = await apiClient.post('/article', articleData);
        return response.data;
    } catch (error) {
        console.error('Error creating article:', error);
        throw error;
    }
};

export const updateArticle = async (id, articleData) => {
    try {
        const response = await apiClient.put(`/article/${id}`, articleData);
        return response.data;
    } catch (error) {
        console.error('Error updating article:', error);
        throw error;
    }
};

export const deleteArticle = async (id) => {
    try {
        const response = await apiClient.delete(`/article/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting article:', error);
        throw error;
    }
};

// Instapaper API calls
export const authenticateInstapaper = async (username, password = '') => {
    try {
        const response = await apiClient.post('/article/instapaper/authenticate', {
            username,
            password
        });
        return response.data;
    } catch (error) {
        console.error('Error authenticating with Instapaper:', error);
        throw error;
    }
};

export const importFromInstapaper = async (accessToken, accessTokenSecret, limit = 50, folderId = 'unread') => {
    try {
        const response = await apiClient.post('/article/instapaper/import', {
            accessToken,
            accessTokenSecret,
            limit,
            folderId
        });
        return response.data;
    } catch (error) {
        console.error('Error importing from Instapaper:', error);
        throw error;
    }
};

export const syncWithInstapaper = async (accessToken, accessTokenSecret) => {
    try {
        const response = await apiClient.post('/article/instapaper/sync', {
            accessToken,
            accessTokenSecret
        });
        return response.data;
    } catch (error) {
        console.error('Error syncing with Instapaper:', error);
        throw error;
    }
};

export const saveToInstapaper = async (accessToken, accessTokenSecret, url, title = null, selection = null) => {
    try {
        const response = await apiClient.post('/article/instapaper/save', {
            accessToken,
            accessTokenSecret,
            url,
            title,
            selection
        });
        return response.data;
    } catch (error) {
        console.error('Error saving to Instapaper:', error);
        throw error;
    }
};

// ========== Article Deduplication API Methods ==========

/**
 * Finds duplicate articles based on normalized URLs
 */
export const findDuplicateArticles = async () => {
    try {
        const response = await apiClient.get('/article/duplicates');
        return response;
    } catch (error) {
        console.error('Error finding duplicate articles:', error);
        throw error;
    }
};

/**
 * Deduplicates articles by merging articles with the same normalized URL
 */
export const deduplicateArticles = async () => {
    try {
        const response = await apiClient.post('/article/deduplicate');
        return response;
    } catch (error) {
        console.error('Error deduplicating articles:', error);
        throw error;
    }
};

// ========== Readwise & Reader API Methods ==========

/**
 * Validates the Readwise API connection
 */
export const validateReadwiseConnection = async () => {
    try {
        const response = await apiClient.get('/highlight/validate-connection');
        return response;
    } catch (error) {
        console.error('Error validating Readwise connection:', error);
        throw error;
    }
};

/**
 * Syncs highlights from Readwise API
 * @param {Date|null} lastSync - Optional date for incremental sync
 */
export const syncHighlightsFromReadwise = async (lastSync = null) => {
    try {
        const params = lastSync ? { lastSync: lastSync.toISOString() } : {};
        const response = await apiClient.post('/highlight/sync', null, { params });
        return response;
    } catch (error) {
        console.error('Error syncing highlights from Readwise:', error);
        throw error;
    }
};

/**
 * Gets all highlights
 */
export const getAllHighlights = async () => {
    try {
        const response = await apiClient.get('/highlight');
        return response.data;
    } catch (error) {
        console.error('Error fetching highlights:', error);
        throw error;
    }
};

/**
 * Gets highlights for a specific article
 * @param {string} articleId - The article ID
 */
export const getHighlightsByArticle = async (articleId) => {
    try {
        const response = await apiClient.get(`/highlight/article/${articleId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching highlights for article:', error);
        throw error;
    }
};

/**
 * Gets highlights for a specific book
 * @param {string} bookId - The book ID
 */
export const getHighlightsByBook = async (bookId) => {
    try {
        const response = await apiClient.get(`/highlight/book/${bookId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching highlights for book:', error);
        throw error;
    }
};

/**
 * Gets highlights by tag
 * @param {string} tag - The tag to filter by
 */
export const getHighlightsByTag = async (tag) => {
    try {
        const response = await apiClient.get(`/highlight/tag/${encodeURIComponent(tag)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching highlights by tag:', error);
        throw error;
    }
};

/**
 * Creates a new highlight
 * @param {Object} highlightData - The highlight data
 */
export const createHighlight = async (highlightData) => {
    try {
        const response = await apiClient.post('/highlight', highlightData);
        return response.data;
    } catch (error) {
        console.error('Error creating highlight:', error);
        throw error;
    }
};

/**
 * Updates a highlight
 * @param {string} id - The highlight ID
 * @param {Object} highlightData - The updated highlight data
 */
export const updateHighlight = async (id, highlightData) => {
    try {
        const response = await apiClient.put(`/highlight/${id}`, highlightData);
        return response.data;
    } catch (error) {
        console.error('Error updating highlight:', error);
        throw error;
    }
};

/**
 * Deletes a highlight
 * @param {string} id - The highlight ID
 */
export const deleteHighlight = async (id) => {
    try {
        await apiClient.delete(`/highlight/${id}`);
    } catch (error) {
        console.error('Error deleting highlight:', error);
        throw error;
    }
};

/**
 * Links highlights to media items
 */
export const linkHighlightsToMedia = async () => {
    try {
        const response = await apiClient.post('/highlight/link');
        return response;
    } catch (error) {
        console.error('Error linking highlights to media:', error);
        throw error;
    }
};

/**
 * Exports a highlight to Readwise
 * @param {string} id - The highlight ID
 */
export const exportHighlightToReadwise = async (id) => {
    try {
        const response = await apiClient.post(`/highlight/${id}/export`);
        return response.data;
    } catch (error) {
        console.error('Error exporting highlight to Readwise:', error);
        throw error;
    }
};

/**
 * Syncs documents from Readwise Reader
 * @param {string|null} location - Optional location filter (new, later, archive, feed)
 */
export const syncDocumentsFromReader = async (location = null) => {
    try {
        const params = location ? { location } : {};
        const response = await apiClient.post('/article/sync-reader', null, { params });
        return response;
    } catch (error) {
        console.error('Error syncing documents from Reader:', error);
        throw error;
    }
};

/**
 * Fetches content for a specific article
 * @param {string} articleId - The article ID
 */
export const fetchArticleContent = async (articleId) => {
    try {
        const response = await apiClient.post(`/article/${articleId}/fetch-content`);
        return response.data;
    } catch (error) {
        console.error('Error fetching article content:', error);
        throw error;
    }
};

/**
 * Bulk fetches article contents
 * @param {number} batchSize - Number of articles to fetch (default 50)
 */
export const bulkFetchArticleContents = async (batchSize = 50) => {
    try {
        const response = await apiClient.post('/article/bulk-fetch-content', null, {
            params: { batchSize }
        });
        return response;
    } catch (error) {
        console.error('Error bulk fetching article contents:', error);
        throw error;
    }
};

// ============================================
// Website API calls
// ============================================

/**
 * Scrapes a website URL for preview without saving
 * @param {string} url - The URL to scrape
 */
export const scrapeWebsitePreview = async (url) => {
    try {
        const response = await apiClient.post('/website/scrape-preview', JSON.stringify(url));
        return response.data;
    } catch (error) {
        console.error('Error scraping website:', error);
        throw error;
    }
};

/**
 * Imports a website from a URL
 * @param {object} websiteData - { url, titleOverride?, notes?, topics?, genres? }
 */
export const importWebsite = async (websiteData) => {
    try {
        const response = await apiClient.post('/website/import', websiteData);
        return response.data;
    } catch (error) {
        console.error('Error importing website:', error);
        throw error;
    }
};

/**
 * Gets all websites
 */
export const getAllWebsites = async () => {
    try {
        const response = await apiClient.get('/website');
        return response.data;
    } catch (error) {
        console.error('Error fetching websites:', error);
        throw error;
    }
};

/**
 * Gets a website by ID
 * @param {string} id - The website ID
 */
export const getWebsiteById = async (id) => {
    try {
        const response = await apiClient.get(`/website/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching website:', error);
        throw error;
    }
};

/**
 * Gets websites by domain
 * @param {string} domain - The domain name
 */
export const getWebsitesByDomain = async (domain) => {
    try {
        const response = await apiClient.get(`/website/by-domain/${encodeURIComponent(domain)}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching websites by domain:', error);
        throw error;
    }
};

/**
 * Gets websites with RSS feeds
 */
export const getWebsitesWithRss = async () => {
    try {
        const response = await apiClient.get('/website/with-rss');
        return response.data;
    } catch (error) {
        console.error('Error fetching websites with RSS:', error);
        throw error;
    }
};

/**
 * Creates a website manually
 * @param {object} websiteData - The website data
 */
export const createWebsite = async (websiteData) => {
    try {
        const response = await apiClient.post('/website', websiteData);
        return response.data;
    } catch (error) {
        console.error('Error creating website:', error);
        throw error;
    }
};

/**
 * Updates a website
 * @param {string} id - The website ID
 * @param {object} websiteData - The updated website data
 */
export const updateWebsite = async (id, websiteData) => {
    try {
        const response = await apiClient.put(`/website/${id}`, websiteData);
        return response.data;
    } catch (error) {
        console.error('Error updating website:', error);
        throw error;
    }
};

/**
 * Deletes a website
 * @param {string} id - The website ID
 */
export const deleteWebsite = async (id) => {
    try {
        await apiClient.delete(`/website/${id}`);
    } catch (error) {
        console.error('Error deleting website:', error);
        throw error;
    }
};

// ============================================
// Database Cleanup API calls
// ============================================

export const cleanupYouTubeData = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-youtube-data');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up YouTube data:', error);
        throw error;
    }
};

export const cleanupPodcasts = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-podcasts');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up podcasts:', error);
        throw error;
    }
};

export const cleanupBooks = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-books');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up books:', error);
        throw error;
    }
};

export const cleanupMovies = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-movies');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up movies:', error);
        throw error;
    }
};

export const cleanupTvShows = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-tvshows');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up TV shows:', error);
        throw error;
    }
};

export const cleanupArticles = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-articles');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up articles:', error);
        throw error;
    }
};

export const cleanupHighlights = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-highlights');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up highlights:', error);
        throw error;
    }
};

export const cleanupMixlists = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-mixlists');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up mixlists:', error);
        throw error;
    }
};

export const cleanupAllTopics = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-all-topics');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up all topics:', error);
        throw error;
    }
};

export const cleanupAllGenres = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-all-genres');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up all genres:', error);
        throw error;
    }
};

export const cleanupOrphanedTopics = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-orphaned-topics');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up orphaned topics:', error);
        throw error;
    }
};

export const cleanupOrphanedGenres = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-orphaned-genres');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up orphaned genres:', error);
        throw error;
    }
};

export const cleanupAllMedia = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-all-media');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up all media:', error);
        throw error;
    }
};

export const cleanupRefreshTokens = async () => {
    try {
        const response = await apiClient.post('/auth/cleanup-tokens');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up refresh tokens:', error);
        throw error;
    }
};

// ===========================
// Typesense Admin API calls
// ===========================

/**
 * Trigger a bulk reindex of all media items in Typesense
 * @returns {Promise<Object>} Reindex result with statistics
 */
export const typesenseReindex = async () => {
    try {
        const response = await apiClient.post('/search/reindex');
        return response.data;
    } catch (error) {
        console.error('Error reindexing Typesense:', error);
        throw error;
    }
};

/**
 * Check Typesense health status
 * @returns {Promise<Object>} Health status information
 */
export const typesenseHealth = async () => {
    try {
        const response = await apiClient.get('/search/health');
        return response.data;
    } catch (error) {
        console.error('Error checking Typesense health:', error);
        throw error;
    }
};

/**
 * Reset the media_items collection in Typesense (deletes and recreates)
 * WARNING: This will delete all indexed media items!
 * @returns {Promise<Object>} Reset result
 */
export const typesenseResetMediaItems = async () => {
    try {
        const response = await apiClient.post('/search/reset');
        return response.data;
    } catch (error) {
        console.error('Error resetting media items collection:', error);
        throw error;
    }
};

/**
 * Reset the mixlists collection in Typesense (deletes and recreates)
 * WARNING: This will delete all indexed mixlists!
 * @returns {Promise<Object>} Reset result
 */
export const typesenseResetMixlists = async () => {
    try {
        const response = await apiClient.post('/search/reset-mixlists');
        return response.data;
    } catch (error) {
        console.error('Error resetting mixlists collection:', error);
        throw error;
    }
};

/**
 * Search media items using Typesense
 * @param {string} query - Search query
 * @param {string} mediaType - Media type filter ('all' or specific type)
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Results per page (default: 20)
 * @returns {Promise<Object>} Search results
 */
export const typesenseSearch = async (query, mediaType = 'all', page = 1, perPage = 20) => {
    try {
        const params = {
            q: query,
            page: page,
            per_page: perPage,
        };

        let endpoint = '/search';
        if (mediaType !== 'all') {
            endpoint = `/search/by-type/${mediaType}`;
        }

        const response = await apiClient.get(endpoint, { params });
        return response.data;
    } catch (error) {
        console.error('Error searching Typesense:', error);
        throw error;
    }
};

/**
 * Advanced search with multiple filters
 * @param {Object} options - Search options
 * @param {string} options.query - Search query (default: '*' for all)
 * @param {Array<string>} options.mediaTypes - Array of media types to filter by
 * @param {Array<string>} options.topics - Array of topics to filter by
 * @param {Array<string>} options.genres - Array of genres to filter by
 * @param {string} options.status - Status filter (Uncharted, ActivelyExploring, Completed, Abandoned)
 * @param {Array<string>} options.ratings - Array of ratings to filter by (SuperLike, Like, Neutral, Dislike)
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.perPage - Results per page (default: 20)
 * @param {string} options.sortBy - Sort field (default: relevance)
 * @returns {Promise<Object>} Search results
 */
export const typesenseAdvancedSearch = async (options) => {
    try {
        const {
            query = '*',
            mediaTypes = [],
            topics = [],
            genres = [],
            status = null,
            ratings = [],
            page = 1,
            perPage = 20,
            sortBy = 'relevance'
        } = options;

        // Build filter string
        const filters = [];
        
        // Media type filter
        if (mediaTypes.length > 0 && !mediaTypes.includes('all')) {
            const mediaTypeFilter = mediaTypes.map(type => `media_type:=${type}`).join(' || ');
            filters.push(`(${mediaTypeFilter})`);
        }
        
        // Topics filter
        if (topics.length > 0) {
            const topicFilter = topics.map(topic => `topics:=${topic}`).join(' || ');
            filters.push(`(${topicFilter})`);
        }
        
        // Genres filter
        if (genres.length > 0) {
            const genreFilter = genres.map(genre => `genres:=${genre}`).join(' || ');
            filters.push(`(${genreFilter})`);
        }
        
        // Status filter
        if (status && status !== 'all') {
            filters.push(`status:=${status}`);
        }
        
        // Ratings filter
        if (ratings.length > 0) {
            const ratingFilter = ratings.map(rating => `rating:=${rating}`).join(' || ');
            filters.push(`(${ratingFilter})`);
        }

        const params = {
            q: query || '*',
            page: page,
            per_page: perPage,
        };

        if (filters.length > 0) {
            params.filter = filters.join(' && ');
        }

        const response = await apiClient.get('/search', { params });
        return response.data;
    } catch (error) {
        console.error('Error performing advanced search:', error);
        throw error;
    }
};

/**
 * Search mixlists using Typesense
 * @param {string} query - Search query
 * @param {string} filter - Optional filter string (e.g., "topics:=productivity")
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Results per page (default: 20)
 * @returns {Promise<Object>} Search results
 */
export const typesenseSearchMixlists = async (query, filter = null, page = 1, perPage = 20) => {
    try {
        const params = {
            q: query,
            page: page,
            per_page: perPage,
        };

        if (filter) {
            params.filter = filter;
        }

        const response = await apiClient.get('/search/mixlists', { params });
        return response.data;
    } catch (error) {
        console.error('Error searching mixlists:', error);
        throw error;
    }
};

/**
 * Advanced mixlist search with multiple filters
 * @param {Object} options - Search options
 * @param {string} options.query - Search query (default: '*' for all)
 * @param {Array<string>} options.topics - Array of topics to filter by
 * @param {Array<string>} options.genres - Array of genres to filter by
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.perPage - Results per page (default: 20)
 * @param {string} options.sortBy - Sort field (default: relevance)
 * @returns {Promise<Object>} Search results
 */
export const typesenseAdvancedSearchMixlists = async (options) => {
    try {
        const {
            query = '*',
            topics = [],
            genres = [],
            page = 1,
            perPage = 20,
            sortBy = 'relevance'
        } = options;

        // Build filter string
        const filters = [];
        
        // Topics filter
        if (topics.length > 0) {
            const topicFilter = topics.map(topic => `topics:=${topic}`).join(' || ');
            filters.push(`(${topicFilter})`);
        }
        
        // Genres filter
        if (genres.length > 0) {
            const genreFilter = genres.map(genre => `genres:=${genre}`).join(' || ');
            filters.push(`(${genreFilter})`);
        }

        const params = {
            q: query || '*',
            page: page,
            per_page: perPage,
        };

        if (filters.length > 0) {
            params.filter = filters.join(' && ');
        }

        const response = await apiClient.get('/search/mixlists', { params });
        return response.data;
    } catch (error) {
        console.error('Error performing advanced mixlist search:', error);
        throw error;
    }
};

/**
 * Reindex all mixlists in Typesense
 * @returns {Promise<Object>} Reindex results
 */
export const reindexMixlists = async () => {
    try {
        const response = await apiClient.post('/search/reindex-mixlists');
        return response.data;
    } catch (error) {
        console.error('Error reindexing mixlists:', error);
        throw error;
    }
};