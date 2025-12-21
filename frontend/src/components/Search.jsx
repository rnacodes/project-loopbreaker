// TODO: Change the following to white: Clear All, checkmarks under media type, and browse all topics/genres, as well as pagination at bottom of page
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, InputAdornment, Grid, Card, CardContent,
    Chip, Button, ButtonGroup, Divider, Accordion, AccordionSummary, AccordionDetails,
    FormGroup, FormControlLabel, Checkbox, Select, MenuItem, FormControl, InputLabel,
    Paper, IconButton, ToggleButton, ToggleButtonGroup, Slider, Stack, Badge,
    CircularProgress, Alert
} from '@mui/material';
import {
    Search as SearchIcon, ViewModule, ViewList, FilterList, Clear, TuneRounded,
    ExpandMore, Star, StarBorder, OpenInNew, AccessTime, Update,
    ThumbUp, ThumbDown, Remove, Favorite
} from '@mui/icons-material';
import { typesenseAdvancedSearch, typesenseAdvancedSearchMixlists } from '../services/apiService';
import { getAllTopics, getAllGenres } from '../services/apiService';

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

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Uncharted', label: 'Uncharted' },
    { value: 'ActivelyExploring', label: 'Actively Exploring' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Abandoned', label: 'Abandoned' }
];

const ratingOptions = [
    { value: 'SuperLike', label: 'Super Like', icon: 'superlike' },
    { value: 'Like', label: 'Like', icon: 'like' },
    { value: 'Neutral', label: 'Neutral', icon: 'neutral' },
    { value: 'Dislike', label: 'Dislike', icon: 'dislike' }
];

const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'dateAdded', label: 'Recently Added' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'Title (A-Z)' }
];

// HELPER FUNCTIONS
const getRatingIcon = (ratingType) => {
    switch (ratingType) {
        case 'superlike':
            return <Favorite sx={{ fontSize: 18, color: '#e91e63' }} />;
        case 'like':
            return <ThumbUp sx={{ fontSize: 18, color: '#4caf50' }} />;
        case 'neutral':
            return <Remove sx={{ fontSize: 18, color: '#9e9e9e' }} />;
        case 'dislike':
            return <ThumbDown sx={{ fontSize: 18, color: '#f44336' }} />;
        default:
            return null;
    }
};

// COMPONENTS
const MediaCard = ({ item }) => {
    const navigate = useNavigate();
    
    // Determine navigation path based on item type
    const handleClick = () => {
        if (item.isMixlist) {
            navigate(`/mixlist/${item.id}`);
        } else {
            navigate(`/media/${item.id}`);
        }
    };
    
    return (
        <Card 
            onClick={handleClick}
            sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8,
                    '& .card-title': {
                        color: 'primary.main'
                    }
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography 
                    variant="h6" 
                    className="card-title"
                    sx={{ 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        transition: 'color 0.2s'
                    }}
                >
                    {item.title}
                </Typography>
                {item.ratingType && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                        {getRatingIcon(item.ratingType)}
                    </Box>
                )}
            </Box>

            <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip 
                    label={item.mediaType} 
                    size="small" 
                    sx={{ 
                        backgroundColor: 'rgba(105, 90, 140, 0.2)',
                        color: '#b39ddb',
                        fontWeight: 'bold'
                    }}
                />
                <Chip 
                    label={item.status === 'ActivelyExploring' ? 'Actively Exploring' : item.status} 
                    size="small" 
                    color={
                        item.status === 'ActivelyExploring' ? 'success' :
                        item.status === 'Uncharted' ? 'info' :
                        item.status === 'Completed' ? 'default' :
                        'warning'
                    }
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {item.author} • {item.duration}
            </Typography>

            {item.notes && (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        mb: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: 'text.secondary'
                    }}
                >
                    {item.notes}
                </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {item.topics.slice(0, 3).map((topic, index) => (
                    <Chip
                        key={`topic-${index}`}
                        label={topic}
                        size="small"
                        sx={{ 
                            fontSize: '0.75rem', 
                            height: '24px',
                            backgroundColor: 'rgba(54, 39, 89, 0.3)',
                            color: '#ce93d8'
                        }}
                    />
                ))}
                {item.topics.length > 3 && (
                    <Chip
                        label={`+${item.topics.length - 3}`}
                        size="small"
                        sx={{ fontSize: '0.75rem', height: '24px' }}
                    />
                )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                <AccessTime sx={{ fontSize: 12 }} />
                Added {new Date(item.dateAdded).toLocaleDateString()}
            </Typography>
        </CardContent>
    </Card>
    );
};

const MediaListItem = ({ item }) => {
    const navigate = useNavigate();
    
    // Determine navigation path based on item type
    const handleClick = () => {
        if (item.isMixlist) {
            navigate(`/mixlist/${item.id}`);
        } else {
            navigate(`/media/${item.id}`);
        }
    };
    
    return (
    <Paper
        onClick={handleClick}
            sx={{ 
                p: 2.5,
                mb: 2,
                cursor: 'pointer',
                '&:hover': {
                    boxShadow: 6,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                },
                transition: 'all 0.2s'
            }}
        >
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {item.title}
                    </Typography>
                    {item.ratingType && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getRatingIcon(item.ratingType)}
                        </Box>
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.author} • {item.duration}
                </Typography>
                {item.notes && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            color: 'text.secondary'
                        }}
                    >
                        {item.notes}
                    </Typography>
                )}
            </Grid>
            <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {item.topics.slice(0, 4).map((topic, index) => (
                        <Chip
                            key={`topic-${index}`}
                            label={topic}
                            size="small"
                            sx={{ 
                                fontSize: '0.75rem', 
                                height: '24px',
                                backgroundColor: 'rgba(54, 39, 89, 0.3)',
                                color: '#ce93d8'
                            }}
                        />
                    ))}
                    {item.topics.length > 4 && (
                        <Chip
                            label={`+${item.topics.length - 4}`}
                            size="small"
                            sx={{ fontSize: '0.75rem', height: '24px' }}
                        />
                    )}
                </Box>
            </Grid>
            <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Chip 
                        label={item.mediaType} 
                        size="small" 
                        sx={{ 
                            backgroundColor: 'rgba(105, 90, 140, 0.2)',
                            color: '#b39ddb',
                            fontWeight: 'bold'
                        }}
                    />
                    <Chip 
                        label={item.status === 'ActivelyExploring' ? 'Actively Exploring' : item.status} 
                        size="small" 
                        color={
                            item.status === 'ActivelyExploring' ? 'success' :
                            item.status === 'Uncharted' ? 'info' :
                            item.status === 'Completed' ? 'default' :
                            'warning'
                        }
                        variant="outlined"
                    />
                </Box>
            </Grid>
        </Grid>
    </Paper>
    );
};

// MAIN COMPONENT
export default function Search() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('card');
    const [sortBy, setSortBy] = useState('relevance');
    const [searchMode, setSearchMode] = useState('media'); // 'media' or 'mixlists'
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
                        author: doc.author || doc.director || doc.creator || doc.publisher || 'Unknown',
                        duration: getDuration(doc),
                        dateAdded: new Date(doc.date_added * 1000).toISOString().split('T')[0],
                        notes: doc.description || '',
                        thumbnail: doc.thumbnail,
                        isMixlist: false
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

    const getDuration = (doc) => {
        // Helper function to extract duration from different media types
        if (doc.runtime_minutes) return `${doc.runtime_minutes} min`;
        if (doc.release_year) return `${doc.release_year}`;
        if (doc.season_count) return `${doc.season_count} seasons`;
        return 'Various';
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
                <Paper 
                    elevation={3}
                    sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        mb: 4,
                        backgroundColor: 'background.paper',
                        borderRadius: 3
                    }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by title, author, topic, or any keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setSearchQuery('')} size="small">
                                        <Clear />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { 
                                fontSize: '1.1rem',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)'
                                }
                            }
                        }}
                    />
                    
                    {/* Quick Filters */}
                    {allTopics.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                                Quick filters:
                            </Typography>
                            {allTopics.slice(0, 4).map((topic) => (
                                <Chip
                                    key={topic}
                                    label={topic}
                                    onClick={() => handleTopicToggle(topic)}
                                    color={selectedTopics.includes(topic) ? 'primary' : 'default'}
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Box>
                    )}
                </Paper>

                <Grid container spacing={3}>
                    {/* Filters Sidebar */}
                    {showFilters && (
                        <Grid item xs={12} md={3}>
                            <Paper 
                                elevation={2}
                                sx={{ 
                                    p: 2.5, 
                                    position: 'sticky',
                                    top: 16,
                                    backgroundColor: 'background.paper',
                                    borderRadius: 2
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TuneRounded /> Filters
                                    </Typography>
                                    <Button 
                                        size="small" 
                                        onClick={handleClearFilters}
                                        startIcon={<Clear />}
                                    >
                                        Clear All
                                    </Button>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                {/* Media Type Filter - Only show for media search */}
                                {searchMode === 'media' && (
                                    <>
                                        <Accordion defaultExpanded disableGutters elevation={0}>
                                            <AccordionSummary expandIcon={<ExpandMore />}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                    Media Type
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 0 }}>
                                                <FormGroup>
                                                    {mediaTypeOptions.map((option) => (
                                                        <FormControlLabel
                                                            key={option.value}
                                                            control={
                                                                <Checkbox
                                                                    checked={selectedMediaTypes.includes(option.value)}
                                                                    onChange={() => handleMediaTypeToggle(option.value)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={<Typography variant="body2">{option.label}</Typography>}
                                                            sx={{ mb: 0.5 }}
                                                        />
                                                    ))}
                                                </FormGroup>
                                            </AccordionDetails>
                                        </Accordion>

                                        <Divider sx={{ my: 1 }} />
                                    </>
                                )}

                                {/* Topics Filter */}
                                <Accordion disableGutters elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Topics {selectedTopics.length > 0 && `(${selectedTopics.length})`}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search topics..."
                                            value={topicSearchQuery}
                                            onChange={(e) => setTopicSearchQuery(e.target.value)}
                                            sx={{ mb: 1.5 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon sx={{ fontSize: 18 }} />
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                        <FormGroup>
                                            {allTopics
                                                .filter(topic => topic.toLowerCase().includes(topicSearchQuery.toLowerCase()))
                                                .slice(0, showAllTopics ? undefined : 10)
                                                .map((topic) => (
                                                    <FormControlLabel
                                                        key={topic}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedTopics.includes(topic)}
                                                                onChange={() => handleTopicToggle(topic)}
                                                                size="small"
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{topic}</Typography>}
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                        </FormGroup>
                                        {allTopics.filter(topic => topic.toLowerCase().includes(topicSearchQuery.toLowerCase())).length > 10 && !showAllTopics && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllTopics(true)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show More
                                            </Button>
                                        )}
                                        {showAllTopics && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllTopics(false)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show Less
                                            </Button>
                                        )}
                                        <Divider sx={{ my: 1.5 }} />
                                        <Button
                                            size="small"
                                            fullWidth
                                            variant="text"
                                            onClick={() => navigate('/search-by-topic-genre')}
                                            sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                                        >
                                            Browse all topics →
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>

                                <Divider sx={{ my: 1 }} />

                                {/* Genres Filter */}
                                <Accordion disableGutters elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search genres..."
                                            value={genreSearchQuery}
                                            onChange={(e) => setGenreSearchQuery(e.target.value)}
                                            sx={{ mb: 1.5 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <SearchIcon sx={{ fontSize: 18 }} />
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                        <FormGroup>
                                            {allGenres
                                                .filter(genre => genre.toLowerCase().includes(genreSearchQuery.toLowerCase()))
                                                .slice(0, showAllGenres ? undefined : 10)
                                                .map((genre) => (
                                                    <FormControlLabel
                                                        key={genre}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedGenres.includes(genre)}
                                                                onChange={() => handleGenreToggle(genre)}
                                                                size="small"
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{genre}</Typography>}
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                        </FormGroup>
                                        {allGenres.filter(genre => genre.toLowerCase().includes(genreSearchQuery.toLowerCase())).length > 10 && !showAllGenres && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllGenres(true)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show More
                                            </Button>
                                        )}
                                        {showAllGenres && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllGenres(false)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show Less
                                            </Button>
                                        )}
                                        <Divider sx={{ my: 1.5 }} />
                                        <Button
                                            size="small"
                                            fullWidth
                                            variant="text"
                                            onClick={() => navigate('/search-by-topic-genre')}
                                            sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                                        >
                                            Browse all genres →
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>

                                {/* Status and Rating Filters - Only show for media search */}
                                {searchMode === 'media' && (
                                    <>
                                        <Divider sx={{ my: 1 }} />

                                        {/* Status Filter */}
                                        <Accordion disableGutters elevation={0}>
                                            <AccordionSummary expandIcon={<ExpandMore />}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                    Status
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 0 }}>
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={selectedStatus}
                                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                                    >
                                                        {statusOptions.map((option) => (
                                                            <MenuItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </AccordionDetails>
                                        </Accordion>

                                        <Divider sx={{ my: 1 }} />

                                        {/* Rating Filter */}
                                        <Accordion disableGutters elevation={0}>
                                            <AccordionSummary expandIcon={<ExpandMore />}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                    Rating {selectedRatings.length > 0 && `(${selectedRatings.length})`}
                                                </Typography>
                                            </AccordionSummary>
                                            <AccordionDetails sx={{ pt: 0 }}>
                                                <FormGroup>
                                                    {ratingOptions.map((rating) => (
                                                        <FormControlLabel
                                                            key={rating.value}
                                                            control={
                                                                <Checkbox
                                                                    checked={selectedRatings.includes(rating.value)}
                                                                    onChange={() => handleRatingToggle(rating.value)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    {getRatingIcon(rating.icon)}
                                                                    <Typography variant="body2">{rating.label}</Typography>
                                                                </Box>
                                                            }
                                                            sx={{ mb: 0.5 }}
                                                        />
                                                    ))}
                                                </FormGroup>
                                            </AccordionDetails>
                                        </Accordion>
                                    </>
                                )}
                            </Paper>
                        </Grid>
                    )}

                    {/* Results Section */}
                    <Grid item xs={12} md={showFilters ? 9 : 12}>
                        {/* Results Header */}
                        <Box sx={{ 
                            mb: 3, 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between', 
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 2
                        }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {totalResults} Results
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {searchQuery && `Showing results for "${searchQuery}"`}
                                    {!searchQuery && searchMode === 'media' && 'Showing all media items'}
                                    {!searchQuery && searchMode === 'mixlists' && 'Showing all mixlists'}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Sort */}
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <InputLabel>Sort by</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label="Sort by"
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        {sortOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* View Mode Toggle */}
                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                                    size="small"
                                >
                                    <ToggleButton value="card">
                                        <ViewModule />
                                    </ToggleButton>
                                    <ToggleButton value="list">
                                        <ViewList />
                                    </ToggleButton>
                                </ToggleButtonGroup>

                                {/* Toggle Filters Button (mobile) */}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowFilters(!showFilters)}
                                    startIcon={<FilterList />}
                                    sx={{ display: { xs: 'flex', md: 'none' } }}
                                >
                                    {showFilters ? 'Hide' : 'Show'} Filters
                                </Button>
                            </Box>
                        </Box>

                        {/* Active Filters Display */}
                        {(selectedTopics.length > 0 || selectedGenres.length > 0 || !selectedMediaTypes.includes('all')) && (
                            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Active filters:
                                </Typography>
                                {selectedTopics.map((topic) => (
                                    <Chip
                                        key={`filter-topic-${topic}`}
                                        label={topic}
                                        size="small"
                                        onDelete={() => handleTopicToggle(topic)}
                                        color="primary"
                                    />
                                ))}
                                {selectedGenres.map((genre) => (
                                    <Chip
                                        key={`filter-genre-${genre}`}
                                        label={genre}
                                        size="small"
                                        onDelete={() => handleGenreToggle(genre)}
                                        color="secondary"
                                    />
                                ))}
                                {!selectedMediaTypes.includes('all') && selectedMediaTypes.map((type) => (
                                    <Chip
                                        key={`filter-type-${type}`}
                                        label={mediaTypeOptions.find(o => o.value === type)?.label || type}
                                        size="small"
                                        onDelete={() => handleMediaTypeToggle(type)}
                                    />
                                ))}
                            </Box>
                        )}

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
                                    <MediaListItem key={item.id} item={item} />
                                ))}
                            </Box>
                        )}

                        {/* Pagination */}
                        {!loading && searchResults.length > 0 && totalPages > 1 && (
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <ButtonGroup variant="outlined">
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

