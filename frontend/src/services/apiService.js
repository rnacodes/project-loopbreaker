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

// Playlist API calls
export const getAllPlaylists = () => {
    return apiClient.get('/playlist');
};

export const createPlaylist = (playlistData) => {
    return apiClient.post('/playlist', playlistData);
};

export const addMediaToPlaylist = (playlistId, mediaItemId) => {
    return apiClient.post(`/playlist/${playlistId}/items/${mediaItemId}`);
};