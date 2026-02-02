import { apiClient } from './apiClient';

// ============================================
// Saved Related Media
// ============================================

/**
 * Gets saved related media items for a media item
 * @param {string} mediaItemId - The source media item ID
 * @param {boolean} includeBidirectional - Include items that link to this item (default true)
 */
export const getRelatedMedia = async (mediaItemId, includeBidirectional = true) => {
    try {
        const params = { includeBidirectional };
        const response = await apiClient.get(`/relatedmedia/${mediaItemId}`, { params });
        return response.data || [];
    } catch (error) {
        console.error('Error getting related media:', error);
        throw error;
    }
};

/**
 * Saves a related media item
 * @param {string} sourceMediaItemId - The source media item ID
 * @param {string} relatedMediaItemId - The related media item ID
 * @param {string} source - "AiRecommended" or "ManuallyAdded"
 * @param {number} similarityScore - Optional similarity score (for AI recommendations)
 * @param {string} note - Optional note about the relationship
 */
export const saveRelatedMedia = async (sourceMediaItemId, relatedMediaItemId, source = 'ManuallyAdded', similarityScore = null, note = null) => {
    try {
        const data = {
            relatedMediaItemId,
            source,
            similarityScore,
            note
        };
        const response = await apiClient.post(`/relatedmedia/${sourceMediaItemId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error saving related media:', error);
        throw error;
    }
};

/**
 * Removes a related media item
 * @param {string} sourceMediaItemId - The source media item ID
 * @param {string} relatedMediaItemId - The related media item ID
 */
export const removeRelatedMedia = async (sourceMediaItemId, relatedMediaItemId) => {
    try {
        await apiClient.delete(`/relatedmedia/${sourceMediaItemId}/${relatedMediaItemId}`);
    } catch (error) {
        console.error('Error removing related media:', error);
        throw error;
    }
};

/**
 * Saves multiple related media items at once
 * @param {string} sourceMediaItemId - The source media item ID
 * @param {Array} relatedItems - Array of { relatedMediaItemId, source, similarityScore, note }
 */
export const saveRelatedMediaBatch = async (sourceMediaItemId, relatedItems) => {
    try {
        const response = await apiClient.post(`/relatedmedia/${sourceMediaItemId}/batch`, relatedItems);
        return response.data;
    } catch (error) {
        console.error('Error batch saving related media:', error);
        throw error;
    }
};
