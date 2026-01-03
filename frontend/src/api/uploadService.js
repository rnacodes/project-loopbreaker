import { apiClient } from './apiClient';

// ============================================
// Upload API calls
// ============================================

export const uploadCsv = (file, mediaType = null) => {
    const formData = new FormData();
    formData.append('file', file);

    // Only append mediaType if it's provided (for single-type CSVs)
    // If not provided, backend will read MediaType from each row
    if (mediaType) {
        formData.append('mediaType', mediaType);
    }

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
