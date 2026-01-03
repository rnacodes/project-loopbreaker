import { apiClient } from './apiClient';

// ============================================
// Article API calls
// ============================================

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

// ============================================
// Instapaper API calls
// ============================================

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

// ============================================
// Article Deduplication API Methods
// ============================================

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

// ============================================
// Article Content Fetching
// ============================================

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
