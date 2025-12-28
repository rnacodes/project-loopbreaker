import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Container, Box, Typography, Grid,
    Chip, Button, ButtonGroup, Divider,
    ToggleButton, ToggleButtonGroup,
    CircularProgress, Paper, Alert
} from '@mui/material';
import { SearchBarSection } from './search/SearchBarSection';
import { SearchFilterSidebar } from './search/SearchFilterSidebar';
import {
    Search as SearchIcon, ViewModule, ViewList, FilterList, Clear
} from '@mui/icons-material';
import { ResultHeader } from './search/ResultHeader';
import { MediaCard } from './search/MediaCard';
import { MediaListItem } from './search/MediaListItem';
import { typesenseAdvancedSearch, typesenseAdvancedSearchMixlists } from '../services/apiService';
import { getAllTopics, getAllGenres } from '../services/apiService';


const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'dateAdded', label: 'Recently Added' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'Title (A-Z)' }
];

const mediaTypeOptions = [
    { value: 'all', label: 'All Media Types' },
    { value: 'Article', label: 'Articles' },
    { value: 'Book', label: 'Books' },
    { value: 'Channel', label: 'Channels' },
    { value: 'Document', label: 'Documents' },
    { value: 'Movie', label: 'Movies' },
    { value: 'Music', label: 'Music' },
    { value: 'Other', label: 'Other' },
    { value: 'Playlist', label: 'Playlists' },
    { value: 'Podcast', label: 'Podcasts' },
    { value: 'TVShow', label: 'TV Shows' },
    { value: 'Video', label: 'Videos' },
    { value: 'VideoGame', label: 'Video Games' },
    { value: 'Website', label: 'Websites' }
];

// HELPER FUNCTIONS


// MAIN COMPONENT
export default function Search() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('card');
    const [sortBy, setSortBy] = useState('relevance');
    const [searchMode, setSearchMode] = useState('media'); // 'media' or 'mixlists'
    const [selectedMixlists, setSelectedMixlists] = useState([]);
    const [selectedMediaTypes, setSelectedMediaTypes] = useState(['all']);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedRatings, setSelectedRatings] = useState([]);
    const [showFilters, setShowFilters] = useState(true);
    const [topicSearchQuery, setTopicSearchQuery] = useState('');
    const [genreSearchQuery, setGenreSearchQuery] = useState('');
    const [showAllTopics, setShowAllTopics] = useState(false);
    const [showAllGenres, setShowAllGenres] = useState(false);
    const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);

    // Bulk actions
    const handleToggleMixlistSelect = (mixlistId) => {
        setSelectedMixlists(prev =>
            prev.includes(mixlistId) ? prev.filter(id => id !== mixlistId) : [...prev, mixlistId]
        );
    };

    const handleSelectAllMixlists = () => {
        if (selectedMixlists.length === searchResults.filter(item => item.isMixlist).length && searchResults.every(item => item.isMixlist === false || selectedMixlists.includes(item.id))) {
            setSelectedMixlists([]);
        } else {
            setSelectedMixlists(searchResults.filter(item => item.isMixlist).map(item => item.id));
        }
    };

    // Data state
    const [searchResults, setSearchResults] = useState([]);
    const [allTopics, setAllTopics] = useState([]);
    const [allGenres, setAllGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const perPage = 20;

    // Load URL parameters on mount
    useEffect(() => {
        const loadUrlParams = () => {
            const query = searchParams.get('q');
            const mediaType = searchParams.get('mediaType');
            const topics = searchParams.get('topics');
            const genres = searchParams.get('genres');
            const status = searchParams.get('status');
            
            if (query) setSearchQuery(query);
            if (mediaType) setSelectedMediaTypes([mediaType]);
            if (topics) setSelectedTopics(topics.split(',').map(t => t.trim()));
            if (genres) setSelectedGenres(genres.split(',').map(g => g.trim()));
            if (status) setSelectedStatus(status);
            
            setUrlParamsLoaded(true);
        };
        
        loadUrlParams();
    }, [searchParams]);

    // Fetch topics and genres on mount
    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                const [topicsData, genresData] = await Promise.all([
                    getAllTopics(),
                    getAllGenres()
                ]);
                setAllTopics(topicsData.map(t => t.name));
                setAllGenres(genresData.map(g => g.name));
            } catch (err) {
                console.error('Error fetching filter data:', err);
            }
        };
        fetchFiltersData();
    }, []);

    // Perform search when filters change (but wait for URL params to load first)
    useEffect(() => {
        if (urlParamsLoaded) {
            performSearch();
        }
    }, [searchQuery, searchMode, selectedMediaTypes, selectedTopics, selectedGenres, selectedStatus, selectedRatings, currentPage, urlParamsLoaded]);

    const performSearch = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let response;
            
            if (searchMode === 'mixlists') {
                // Search mixlists
                const searchOptions = {
                    query: searchQuery || '*',
                    topics: selectedTopics,
                    genres: selectedGenres,
                    page: currentPage,
                    perPage: perPage,
                    sortBy: sortBy
                };

                response = await typesenseAdvancedSearchMixlists(searchOptions);
                
                // Transform Typesense response for mixlists
                const hits = response.hits || [];
                const transformedResults = hits.map(hit => {
                    const doc = hit.document;
                    return {
                        id: doc.id,
                        title: doc.name,
                        mediaType: 'Mixlist',
                        status: null,
                        ratingType: null,
                        topics: doc.topics || [],
                        genres: doc.genres || [],
                        author: `${doc.media_item_count} items`,
                        duration: new Date(doc.date_created * 1000).toLocaleDateString(),
                        dateAdded: new Date(doc.date_created * 1000).toISOString().split('T')[0],
                        notes: doc.description || '',
                        thumbnail: doc.thumbnail,
                        isMixlist: true
                    };
                });

                setSearchResults(transformedResults);
                setTotalResults(response.found || 0);
                setTotalPages(Math.ceil((response.found || 0) / perPage));
            } else {
                // Search media items
                const searchOptions = {
                    query: searchQuery || '*',
                    mediaTypes: selectedMediaTypes.filter(type => type !== 'all'),
                    topics: selectedTopics,
                    genres: selectedGenres,
                    status: selectedStatus !== 'all' ? selectedStatus : null,
                    ratings: selectedRatings,
                    page: currentPage,
                    perPage: perPage,
                    sortBy: sortBy
                };

                response = await typesenseAdvancedSearch(searchOptions);
                
                // Transform Typesense response to match component structure
                const hits = response.hits || [];
                const transformedResults = hits.map(hit => {
                    const doc = hit.document;
                    return {
                        id: doc.id,
                        title: doc.title,
                        mediaType: doc.media_type,
                        status: doc.status,
                        ratingType: doc.rating?.toLowerCase() || null,
                        topics: doc.topics || [],
                        genres: doc.genres || [],
                        dateAdded: new Date(doc.date_added * 1000).toISOString().split('T')[0],
                        notes: doc.description || '',
                        thumbnail: doc.thumbnail,
                        isMixlist: false,
                        
                        // Media-type specific fields
                        author: doc.author || null,
                        director: doc.director || null,
                        creator: doc.creator || null,
                        publisher: doc.publisher || null,
                        channel: doc.channel_title || doc.channel || null,
                        platform: doc.platform || null,
                        
                        // Ratings and metadata
                        goodreadsRating: doc.goodreads_rating || null,
                        tmdbRating: doc.tmdb_rating || null,
                        releaseYear: doc.release_year || null,
                        runtimeMinutes: doc.runtime_minutes || null,
                        
                        // Duration fields
                        lengthInSeconds: doc.length_in_seconds || null,
                        durationInSeconds: doc.duration_in_seconds || null,
                        
                        // Type fields
                        podcastType: doc.podcast_type || null,
                        videoType: doc.video_type || null,
                        
                        // Article fields
                        publication: doc.publication || null,
                        estimatedReadingTimeMinutes: doc.estimated_reading_time_minutes || null,
                        wordCount: doc.word_count || null,
                        isStarred: doc.is_starred || false
                    };
                });

                setSearchResults(transformedResults);
                setTotalResults(response.found || 0);
                setTotalPages(Math.ceil((response.found || 0) / perPage));
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to perform search. Please try again.');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMediaTypeToggle = (value) => {
        if (value === 'all') {
            setSelectedMediaTypes(['all']);
        } else {
            const newSelection = selectedMediaTypes.includes('all') 
                ? [value]
                : selectedMediaTypes.includes(value)
                    ? selectedMediaTypes.filter(t => t !== value)
                    : [...selectedMediaTypes.filter(t => t !== 'all'), value];
            
            setSelectedMediaTypes(newSelection.length === 0 ? ['all'] : newSelection);
        }
    };

    const handleTopicToggle = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const handleGenreToggle = (genre) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const handleRatingToggle = (rating) => {
        setSelectedRatings(prev =>
            prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
        );
    };

    const handleClearFilters = () => {
        setSelectedMediaTypes(['all']);
        setSelectedTopics([]);
        setSelectedGenres([]);
        setSelectedStatus('all');
        setSelectedRatings([]);
        setSearchQuery('');
        setTopicSearchQuery('');
        setGenreSearchQuery('');
        setShowAllTopics(false);
        setShowAllGenres(false);
        setCurrentPage(1);
    };

    return (
        <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 'bold',
                            mb: 1,
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                        }}
                    >
                        Search MediaVerse
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {searchMode === 'media' 
                            ? 'Search across all your media with powerful filters and instant results'
                            : 'Search and discover curated mixlists by name, topics, or genres'}
                    </Typography>
                    
                    {/* Search Mode Toggle */}
                    <Box sx={{ mt: 2 }}>
                        <ToggleButtonGroup
                            value={searchMode}
                            exclusive
                            onChange={(e, newMode) => {
                                if (newMode !== null) {
                                    setSearchMode(newMode);
                                    setCurrentPage(1); // Reset to first page when switching modes
                                }
                            }}
                            size="small"
                            sx={{
                                backgroundColor: 'background.paper',
                                '& .MuiToggleButton-root': {
                                    px: 3,
                                    py: 1,
                                    textTransform: 'none',
                                    fontWeight: 'bold'
                                }
                            }}
                        >
                            <ToggleButton value="media">
                                Media Items
                            </ToggleButton>
                            <ToggleButton value="mixlists">
                                Mixlists
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Box>

                {/* Search Bar */}
                <SearchBarSection
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    allTopics={allTopics}
                    selectedTopics={selectedTopics}
                    handleTopicToggle={handleTopicToggle}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    setCurrentPage={setCurrentPage}
                />

                <Grid container spacing={3}>
                    {showFilters && (
                        <SearchFilterSidebar
                            searchMode={searchMode}
                            selectedMediaTypes={selectedMediaTypes}
                            setSelectedMediaTypes={setSelectedMediaTypes}
                            selectedTopics={selectedTopics}
                            setSelectedTopics={setSelectedTopics}
                            selectedGenres={selectedGenres}
                            setSelectedGenres={setSelectedGenres}
                            selectedStatus={selectedStatus}
                            setSelectedStatus={setSelectedStatus}
                            selectedRatings={selectedRatings}
                            setSelectedRatings={setSelectedRatings}
                            handleClearFilters={handleClearFilters}
                            topicSearchQuery={topicSearchQuery}
                            setTopicSearchQuery={setTopicSearchQuery}
                            genreSearchQuery={genreSearchQuery}
                            setGenreSearchQuery={setGenreSearchQuery}
                            showAllTopics={showAllTopics}
                            setShowAllTopics={setShowAllTopics}
                            showAllGenres={showAllGenres}
                            setShowAllGenres={setShowAllGenres}
                            allTopics={allTopics}
                            allGenres={allGenres}
                            mediaTypeOptions={mediaTypeOptions}
                        />
                    )}

                    <Grid item xs={12} md={showFilters ? 9 : 12}>
                        {/* Results Header */}
                        <ResultHeader
                            totalResults={totalResults}
                            searchQuery={searchQuery}
                            searchMode={searchMode}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                            selectedTopics={selectedTopics}
                            selectedGenres={selectedGenres}
                            selectedMediaTypes={selectedMediaTypes}
                            handleTopicToggle={handleTopicToggle}
                            handleGenreToggle={handleGenreToggle}
                            handleMediaTypeToggle={handleMediaTypeToggle}
                            mediaTypeOptions={mediaTypeOptions}
                        />

                        {/* Results Display */}
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <CircularProgress />
                            </Box>
                        ) : error ? (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        ) : searchResults.length === 0 ? (
                            <Paper sx={{ p: 8, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">
                                    No results found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Try adjusting your filters or search query
                                </Typography>
                            </Paper>
                        ) : viewMode === 'card' ? (
                            <Grid container spacing={3}>
                                {searchResults.map((item) => (
                                    <Grid item xs={12} sm={6} lg={4} key={item.id}>
                                        <MediaCard item={item} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box>
                                {searchResults.map((item) => (
                                    <MediaListItem 
                                        key={item.id} 
                                        item={item} 
                                        isSelected={selectedMixlists.includes(item.id)}
                                        onToggleSelect={handleToggleMixlistSelect}
                                    />
                                ))}
                            </Box>
                        )}

                        {/* Pagination */}
                        {!loading && searchResults.length > 0 && totalPages > 1 && (
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <ButtonGroup variant="outlined" sx={{ '& .MuiButton-outlined': { color: 'white', borderColor: 'white' } }}>
                                    <Button 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        Previous
                                    </Button>
                                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                                        const pageNum = index + 1;
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? 'contained' : 'outlined'}
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    {totalPages > 5 && <Button disabled>...</Button>}
                                    <Button 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Next
                                    </Button>
                                </ButtonGroup>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

