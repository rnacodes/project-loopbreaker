import { searchMedia, searchMixlists } from './apiService';

export const searchAll = async (query) => {
    if (!query || !query.trim()) {
        return { media: [], mixlists: [] };
    }

    try {
        // Search both media and mixlists in parallel
        const [mediaResponse, mixlistsResponse] = await Promise.all([
            searchMedia(query.trim()),
            searchMixlists(query.trim())
        ]);

        return {
            media: mediaResponse.data || [],
            mixlists: mixlistsResponse.data || []
        };
    } catch (error) {
        console.error('Error searching:', error);
        return { media: [], mixlists: [] };
    }
};

export const searchMediaOnly = async (query) => {
    if (!query || !query.trim()) {
        return [];
    }

    try {
        const response = await searchMedia(query.trim());
        return response.data || [];
    } catch (error) {
        console.error('Error searching media:', error);
        return [];
    }
};

export const searchMixlistsOnly = async (query) => {
    if (!query || !query.trim()) {
        return [];
    }

    try {
        const response = await searchMixlists(query.trim());
        return response.data || [];
    } catch (error) {
        console.error('Error searching mixlists:', error);
        return [];
    }
};
