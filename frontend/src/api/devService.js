import { apiClient } from './apiClient';

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

export const cleanupWebsites = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-websites');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up websites:', error);
        throw error;
    }
};

export const cleanupChannels = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-channels');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up channels:', error);
        throw error;
    }
};

export const cleanupPlaylists = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-playlists');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up playlists:', error);
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
