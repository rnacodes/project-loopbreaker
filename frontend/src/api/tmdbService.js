import { apiClient } from './apiClient';

// ============================================
// TMDB API calls
// ============================================

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
