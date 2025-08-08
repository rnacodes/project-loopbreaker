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

// Mixlist API calls
export const getAllMixlists = () => {
    return apiClient.get('/playlist');
};

export const createMixlist = (mixlistData) => {
    return apiClient.post('/playlist', mixlistData);
};

export const addMediaToMixlist = (mixlistId, mediaItemId) => {
    return apiClient.post(`/playlist/${mixlistId}/items/${mediaItemId}`);
};

export const getMixlistById = (id) => {
    return apiClient.get(`/playlist/${id}`);
};

export const removeMediaFromMixlist = (mixlistId, mediaItemId) => {
    return apiClient.delete(`/playlist/${mixlistId}/items/${mediaItemId}`);
};

// Podcast Episode API calls
export const addPodcastEpisode = (episodeData) => {
    return apiClient.post('/podcastepisode', episodeData);
};

// Podcast Search Functions
export const searchPodcasts = async (query, useMockApi = false) => {
    // Fixed: When useMockApi is true, use MockListenNotes, otherwise use ListenNotes
    const endpoint = useMockApi ? '/MockListenNotes/search' : '/ListenNotes/search';
    try {
        const response = await apiClient.get(`${endpoint}?query=${encodeURIComponent(query)}&type=podcast`);
        return response.data;
    } catch (error) {
        console.error('Error searching podcasts:', error);
        throw error;
    }
};

export const getPodcastById = async (id, useMockApi = false) => {
    // Fixed: When useMockApi is true, use MockListenNotes, otherwise use ListenNotes
    const endpoint = useMockApi ? '/MockListenNotes/podcasts' : '/ListenNotes/podcasts';
    try {
        const response = await apiClient.get(`${endpoint}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error getting podcast:', error);
        throw error;
    }
};

export const importPodcastFromApi = async (podcastData, useMockApi = false) => {
    try {
        let response;
        
        if (podcastData.PodcastId) {
            // Import by ID
            response = await apiClient.post(`/podcastseries/from-api/${podcastData.PodcastId}?useMock=${useMockApi}`);
        } else if (podcastData.PodcastName) {
            // Import by name
            response = await apiClient.post('/podcastseries/from-api/by-name', {
                PodcastName: podcastData.PodcastName,
                UseMock: useMockApi
            });
        } else {
            throw new Error('Either PodcastId or PodcastName must be provided');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error importing podcast:', error);
        throw error;
    }
};