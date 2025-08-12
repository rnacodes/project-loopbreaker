import axios from 'axios';

const API_URL = 'http://localhost:5033/api';

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

// Mixlist API calls
export const getAllMixlists = () => {
    return apiClient.get('/mixlist');
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

export const removeMediaFromMixlist = (mixlistId, mediaItemId) => {
    return apiClient.delete(`/mixlist/${mixlistId}/items/${mediaItemId}`);
};

// Media update functions
export const updateMedia = (id, mediaData) => {
    return apiClient.put(`/media/${id}`, mediaData);
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
export const uploadCsv = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
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