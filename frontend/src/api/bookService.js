import { apiClient } from './apiClient';

// ============================================
// Book API calls
// ============================================

export const getAllBooks = () => {
    return apiClient.get('/book');
};

export const getBookById = (id) => {
    return apiClient.get(`/book/${id}`);
};

export const getBooksByAuthor = (author) => {
    return apiClient.get(`/book/by-author/${encodeURIComponent(author)}`);
};

export const getBookSeries = () => {
    return apiClient.get('/book/series');
};

export const createBook = (bookData) => {
    return apiClient.post('/book', bookData);
};

export const updateBook = (id, bookData) => {
    return apiClient.put(`/book/${id}`, bookData);
};

export const deleteBook = (id) => {
    return apiClient.delete(`/book/${id}`);
};

// ============================================
// Open Library / Book Import API calls
// ============================================

export const searchBooksFromOpenLibrary = async (searchParams) => {
    try {
        const params = new URLSearchParams({
            query: searchParams.query,
            searchType: searchParams.searchType || 'General',
            ...(searchParams.offset && { offset: searchParams.offset }),
            ...(searchParams.limit && { limit: searchParams.limit })
        });
        const response = await apiClient.get(`/book/search-openlibrary?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error searching Open Library:', error);
        throw error;
    }
};

export const importBookFromOpenLibrary = async (importData) => {
    try {
        const response = await apiClient.post('/book/import-from-openlibrary', importData);
        return response.data;
    } catch (error) {
        console.error('Error importing book from Open Library:', error);
        throw error;
    }
};
