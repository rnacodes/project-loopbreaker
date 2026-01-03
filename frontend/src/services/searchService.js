import { searchMedia, searchMixlists } from '../api';

export const searchAll = async (query) => {
    if (!query || !query.trim()) {
        console.log('🔍 searchService: Empty query, returning empty results');
        return { media: [], mixlists: [] };
    }

    try {
        console.log('🔍 searchService: Starting search for:', query.trim());
        
        // Search both media and mixlists in parallel
        const [mediaResponse, mixlistsResponse] = await Promise.all([
            searchMedia(query.trim()),
            searchMixlists(query.trim())
        ]);

        console.log('🔍 searchService: Media response:', mediaResponse);
        console.log('🔍 searchService: Mixlists response:', mixlistsResponse);

        const result = {
            media: mediaResponse.data || [],
            mixlists: mixlistsResponse.data || []
        };

        console.log('🔍 searchService: Final result:', result);
        return result;
    } catch (error) {
        console.error('❌ searchService: Error searching:', error);
        console.error('❌ searchService: Error details:', error.response?.data || error.message);
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
