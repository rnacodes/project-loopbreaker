import { apiClient } from './apiClient';

// ============================================
// Topics API calls
// ============================================

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

export const updateTopic = (topicId, topicData) => {
    return apiClient.put(`/topics/${topicId}`, topicData);
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

// ============================================
// Genres API calls
// ============================================

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

export const updateGenre = (genreId, genreData) => {
    return apiClient.put(`/genres/${genreId}`, genreData);
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
