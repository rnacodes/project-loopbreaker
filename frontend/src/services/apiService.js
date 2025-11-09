import axios from 'axios';

// Use environment variable or fall back to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5033/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

// Podcast API calls (unified for series and episodes)
export const getAllPodcasts = () => {
    return apiClient.get('/podcast');
};

export const getPodcastSeries = () => {
    return apiClient.get('/podcast/series');
};

export const searchPodcastSeries = (query) => {
    return apiClient.get(`/podcast/series/search?query=${encodeURIComponent(query)}`);
};

export const getPodcastById = (id) => {
    return apiClient.get(`/podcast/${id}`);
};

export const createPodcastEpisode = (episodeData) => {
    return apiClient.post('/podcast/episode', episodeData);
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
export const uploadCsv = (file, mediaType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);
    
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

export const importFromYouTubeUrl = async (url) => {
    try {
        const response = await apiClient.post('/youtube/import/url', { url });
        return response.data;
    } catch (error) {
        console.error('Error importing from YouTube URL:', error);
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