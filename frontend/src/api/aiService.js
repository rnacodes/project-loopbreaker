import { apiClient } from './apiClient';

// ============================================
// AI Service Status
// ============================================

/**
 * Gets the AI service status including availability and pending counts
 */
export const getAiStatus = async () => {
    try {
        const response = await apiClient.get('/ai/status');
        return response.data;
    } catch (error) {
        console.error('Error getting AI status:', error);
        throw error;
    }
};

// ============================================
// Note Description Generation
// ============================================

/**
 * Generates an AI description for a single note
 * @param {string} id - The note ID
 */
export const generateNoteDescription = async (id) => {
    try {
        const response = await apiClient.post(`/ai/notes/${id}/generate-description`);
        return response.data;
    } catch (error) {
        console.error('Error generating note description:', error);
        throw error;
    }
};

/**
 * Generates AI descriptions for a batch of notes
 * @param {number} batchSize - Optional batch size (default handled by server)
 */
export const generateNoteDescriptionsBatch = async (batchSize = null) => {
    try {
        const data = batchSize ? { batchSize } : {};
        const response = await apiClient.post('/ai/notes/generate-descriptions-batch', data);
        return response.data;
    } catch (error) {
        console.error('Error generating note descriptions batch:', error);
        throw error;
    }
};

/**
 * Gets the count of notes pending AI description generation
 */
export const getPendingNoteDescriptions = async () => {
    try {
        const response = await apiClient.get('/ai/notes/pending-descriptions');
        return response.data;
    } catch (error) {
        console.error('Error getting pending note descriptions count:', error);
        throw error;
    }
};

// ============================================
// Embedding Generation - Media Items
// ============================================

/**
 * Generates an embedding for a single media item
 * @param {string} id - The media item ID
 */
export const generateMediaEmbedding = async (id) => {
    try {
        const response = await apiClient.post(`/ai/media/${id}/generate-embedding`);
        return response.data;
    } catch (error) {
        console.error('Error generating media embedding:', error);
        throw error;
    }
};

/**
 * Generates embeddings for a batch of media items
 * @param {number} batchSize - Optional batch size (default handled by server)
 */
export const generateMediaEmbeddingsBatch = async (batchSize = null) => {
    try {
        const data = batchSize ? { batchSize } : {};
        const response = await apiClient.post('/ai/media/generate-embeddings-batch', data);
        return response.data;
    } catch (error) {
        console.error('Error generating media embeddings batch:', error);
        throw error;
    }
};

/**
 * Gets the count of media items pending embedding generation
 */
export const getPendingMediaEmbeddings = async () => {
    try {
        const response = await apiClient.get('/ai/media/pending-embeddings');
        return response.data;
    } catch (error) {
        console.error('Error getting pending media embeddings count:', error);
        throw error;
    }
};

// ============================================
// Embedding Generation - Notes
// ============================================

/**
 * Generates an embedding for a single note
 * @param {string} id - The note ID
 */
export const generateNoteEmbedding = async (id) => {
    try {
        const response = await apiClient.post(`/ai/notes/${id}/generate-embedding`);
        return response.data;
    } catch (error) {
        console.error('Error generating note embedding:', error);
        throw error;
    }
};

/**
 * Generates embeddings for a batch of notes
 * @param {number} batchSize - Optional batch size (default handled by server)
 */
export const generateNoteEmbeddingsBatch = async (batchSize = null) => {
    try {
        const data = batchSize ? { batchSize } : {};
        const response = await apiClient.post('/ai/notes/generate-embeddings-batch', data);
        return response.data;
    } catch (error) {
        console.error('Error generating note embeddings batch:', error);
        throw error;
    }
};

/**
 * Gets the count of notes pending embedding generation
 */
export const getPendingNoteEmbeddings = async () => {
    try {
        const response = await apiClient.get('/ai/notes/pending-embeddings');
        return response.data;
    } catch (error) {
        console.error('Error getting pending note embeddings count:', error);
        throw error;
    }
};
