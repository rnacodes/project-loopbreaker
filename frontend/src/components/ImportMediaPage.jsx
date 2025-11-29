//TODO: Update to reflect latest changes to the API and frontend.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container,
    Select, MenuItem, InputLabel, FormControl,
    Card, CardContent, CircularProgress, Alert,
    Divider, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Search, Download, Podcasts, MenuBook, ExpandMore, OpenInNew, MovieFilter, VideoLibrary, Article } from '@mui/icons-material';
import { searchPodcasts, getPodcastSeriesById, importPodcastSeriesFromApi, importPodcastSeriesByName, searchBooksFromOpenLibrary, importBookFromOpenLibrary, searchMovies, searchTvShows, searchMulti, getMovieDetails, getTvShowDetails, importMovieFromTmdb, importTvShowFromTmdb, searchYouTube, getYouTubeVideoDetails, getYouTubePlaylistDetails, getYouTubeChannelDetails, importYouTubeVideo, importYouTubePlaylist, importYouTubeChannel, importFromYouTubeUrl, importYouTubeChannelEntity, checkYouTubeChannelExists } from '../services/apiService';
import WhiteOutlineButton from './shared/WhiteOutlineButton';

function ImportMediaPage() {
    const [expanded, setExpanded] = useState(false);
    
    // Podcast states
    const [podcastImportMethod, setPodcastImportMethod] = useState('search');
    const [podcastSearchQuery, setPodcastSearchQuery] = useState('');
    const [podcastId, setPodcastId] = useState('');
    const [podcastName, setPodcastName] = useState('');
    const [podcastSearchResults, setPodcastSearchResults] = useState([]);
    const [podcastIsLoading, setPodcastIsLoading] = useState(false);
    const [podcastError, setPodcastError] = useState('');
    const [podcastSuccess, setPodcastSuccess] = useState('');

    // Book states
    const [bookImportMethod, setBookImportMethod] = useState('search');
    const [bookSearchQuery, setBookSearchQuery] = useState('');
    const [bookSearchType, setBookSearchType] = useState('General');
    const [bookIsbn, setBookIsbn] = useState('');
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');
    const [bookSearchResults, setBookSearchResults] = useState([]);
    const [bookIsLoading, setBookIsLoading] = useState(false);
    const [bookError, setBookError] = useState('');
    const [bookSuccess, setBookSuccess] = useState('');

    // TMDB states
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
    const [tmdbSearchType, setTmdbSearchType] = useState('multi');
    const [tmdbSearchResults, setTmdbSearchResults] = useState([]);
    const [tmdbIsLoading, setTmdbIsLoading] = useState(false);
    const [tmdbError, setTmdbError] = useState('');
    const [tmdbSuccess, setTmdbSuccess] = useState('');
    const [selectedTmdbItem, setSelectedTmdbItem] = useState(null);
    const [showTmdbDetails, setShowTmdbDetails] = useState(false);

    // YouTube states
    const [youtubeImportMethod, setYoutubeImportMethod] = useState('search');
    const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
    const [youtubeSearchType, setYoutubeSearchType] = useState('video');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeSearchResults, setYoutubeSearchResults] = useState([]);
    const [youtubeIsLoading, setYoutubeIsLoading] = useState(false);
    const [youtubeError, setYoutubeError] = useState('');
    const [youtubeSuccess, setYoutubeSuccess] = useState('');
    const [selectedYoutubeItem, setSelectedYoutubeItem] = useState(null);
    const [showYoutubeDetails, setShowYoutubeDetails] = useState(false);
    
    const navigate = useNavigate();

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    // Podcast handlers
    const handlePodcastSearch = async () => {
        if (!podcastSearchQuery.trim()) {
            setPodcastError('Please enter a search term');
            return;
        }
        
        setPodcastIsLoading(true);
        setPodcastError('');
        setPodcastSearchResults([]);
        
        try {
            // Use real ListenNotes API for search
            const data = await searchPodcasts(podcastSearchQuery);
            
            // Transform the Listen Notes API response to match your component's expected format
            const transformedResults = data.results?.map(podcast => ({
                id: podcast.id,
                title: podcast.title_original || podcast.title_highlighted || 'Unknown Title',
                publisher: podcast.publisher_original || podcast.publisher_highlighted || 'Unknown Publisher',
                description: podcast.description_original || podcast.description_highlighted || 'No description available',
                image: podcast.image || 'https://placehold.co/300x300/362759/fcfafa?text=No+Image',
                total_episodes: podcast.total_episodes || 0
            })) || [];
            
            setPodcastSearchResults(transformedResults);
            setPodcastIsLoading(false);
            
        } catch (err) {
            console.error('Search error:', err);
            setPodcastError('Failed to search podcasts. Please try again.');
            setPodcastIsLoading(false);
        }
    };

    const handlePodcastImportById = async () => {
        if (!podcastId.trim()) {
            setPodcastError('Please enter a podcast ID');
            return;
        }
        
        setPodcastIsLoading(true);
        setPodcastError('');
        
        try {
            // Use real API to import podcast series
            const result = await importPodcastSeriesFromApi(podcastId);
            
            setPodcastSuccess(`Podcast series imported successfully!`);
            setPodcastIsLoading(false);
            setPodcastId('');
            
            console.log('Podcast imported successfully:', result);
            
            // Navigate to the media detail page (same as manual import flow)
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500); // Give user time to see success message
            }
            
        } catch (err) {
            console.error('Import by ID error:', err);
            setPodcastError('Failed to import podcast. Please check the ID and try again.');
            setPodcastIsLoading(false);
        }
    };

    const handlePodcastImportByName = async () => {
        if (!podcastName.trim()) {
            setPodcastError('Please enter a podcast name');
            return;
        }
        
        setPodcastIsLoading(true);
        setPodcastError('');
        
        try {
            // Use real API to import podcast series by name
            const result = await importPodcastSeriesByName(podcastName);
            
            setPodcastSuccess(`Podcast series imported successfully!`);
            setPodcastIsLoading(false);
            setPodcastName('');
            
            console.log('Podcast imported successfully:', result);
            
            // Navigate to the media detail page (same as manual import flow)
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500); // Give user time to see success message
            }
            
        } catch (err) {
            console.error('Import by name error:', err);
            setPodcastError('Failed to import podcast. Please check the name and try again.');
            setPodcastIsLoading(false);
        }
    };

    const handleImportPodcast = async (podcast) => {
        setPodcastIsLoading(true);
        setPodcastError('');
        
        try {
            // Use real API to import podcast series
            const result = await importPodcastSeriesFromApi(podcast.id);
            
            // Show success message
            setPodcastSuccess(`"${podcast.title}" imported successfully as a podcast series!`);
            setPodcastIsLoading(false);
            
            console.log('Podcast imported successfully:', result);
            
            // Navigate to the media detail page (same as manual import flow)
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500); // Give user time to see success message
            }
            
        } catch (err) {
            console.error('Import podcast error:', err);
            setPodcastError('Failed to import podcast. Please try again.');
            setPodcastIsLoading(false);
        }
    };

    // Book handlers
    const handleBookSearch = async () => {
        if (!bookSearchQuery.trim()) {
            setBookError('Please enter a search term');
            return;
        }
        
        setBookIsLoading(true);
        setBookError('');
        setBookSearchResults([]);
        
        try {
            const searchParams = {
                query: bookSearchQuery,
                searchType: bookSearchType,
                limit: 20
            };
            
            const results = await searchBooksFromOpenLibrary(searchParams);
            setBookSearchResults(results || []);
            setBookIsLoading(false);
            
        } catch (err) {
            console.error('Book search error:', err);
            setBookError('Failed to search books. Please try again.');
            setBookIsLoading(false);
        }
    };

    const handleBookImportByIsbn = async () => {
        if (!bookIsbn.trim()) {
            setBookError('Please enter an ISBN');
            return;
        }
        
        setBookIsLoading(true);
        setBookError('');
        
        try {
            const result = await importBookFromOpenLibrary({ isbn: bookIsbn });
            
            setBookSuccess(`Book imported successfully!`);
            setBookIsLoading(false);
            setBookIsbn('');
            
            console.log('Book imported successfully:', result);
            
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500);
            }
            
        } catch (err) {
            console.error('Import by ISBN error:', err);
            setBookError('Failed to import book. Please check the ISBN and try again.');
            setBookIsLoading(false);
        }
    };

    const handleBookImportByTitleAuthor = async () => {
        if (!bookTitle.trim()) {
            setBookError('Please enter a book title');
            return;
        }
        
        setBookIsLoading(true);
        setBookError('');
        
        try {
            const importData = {
                title: bookTitle,
                ...(bookAuthor.trim() && { author: bookAuthor })
            };
            
            const result = await importBookFromOpenLibrary(importData);
            
            setBookSuccess(`Book imported successfully!`);
            setBookIsLoading(false);
            setBookTitle('');
            setBookAuthor('');
            
            console.log('Book imported successfully:', result);
            
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500);
            }
            
        } catch (err) {
            console.error('Import by title/author error:', err);
            setBookError('Failed to import book. Please check the title and try again.');
            setBookIsLoading(false);
        }
    };

    const handleImportBook = async (book) => {
        setBookIsLoading(true);
        setBookError('');
        
        try {
            const importData = {
                openLibraryKey: book.key,
                title: book.title,
                author: book.authors?.[0]
            };
            
            const result = await importBookFromOpenLibrary(importData);
            
            setBookSuccess(`"${book.title}" imported successfully!`);
            setBookIsLoading(false);
            
            console.log('Book imported successfully:', result);
            
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500);
            }
            
        } catch (err) {
            console.error('Import book error:', err);
            setBookError('Failed to import book. Please try again.');
            setBookIsLoading(false);
        }
    };

    // TMDB handlers
    const handleTmdbSearch = async () => {
        if (!tmdbSearchQuery.trim()) {
            setTmdbError('Please enter a search term');
            return;
        }
        
        setTmdbIsLoading(true);
        setTmdbError('');
        setTmdbSearchResults([]);
        
        try {
            let results;
            switch (tmdbSearchType) {
                case 'movies':
                    results = await searchMovies(tmdbSearchQuery);
                    break;
                case 'tv':
                    results = await searchTvShows(tmdbSearchQuery);
                    break;
                case 'multi':
                default:
                    results = await searchMulti(tmdbSearchQuery);
                    break;
            }

            setTmdbSearchResults(results.results || []);
            setTmdbIsLoading(false);
            
        } catch (err) {
            console.error('TMDB search error:', err);
            setTmdbError('Failed to search. Please try again.');
            setTmdbIsLoading(false);
        }
    };

    const handleTmdbItemClick = async (item) => {
        setTmdbIsLoading(true);
        try {
            let details;
            if (item.media_type === 'movie' || tmdbSearchType === 'movies') {
                details = await getMovieDetails(item.id);
            } else if (item.media_type === 'tv' || tmdbSearchType === 'tv') {
                details = await getTvShowDetails(item.id);
            } else {
                // For multi search, determine type from media_type
                if (item.media_type === 'movie') {
                    details = await getMovieDetails(item.id);
                } else if (item.media_type === 'tv') {
                    details = await getTvShowDetails(item.id);
                }
            }
            setSelectedTmdbItem(details);
            setShowTmdbDetails(true);
        } catch (err) {
            setTmdbError('Failed to load details. Please try again.');
            console.error('TMDB details error:', err);
        } finally {
            setTmdbIsLoading(false);
        }
    };

    const handleTmdbImport = async (item) => {
        setTmdbIsLoading(true);
        setTmdbError('');
        
        try {
            let result;
            
            // Determine if it's a movie or TV show and call the appropriate import function
            if (item.media_type === 'movie' || tmdbSearchType === 'movies') {
                // Import movie using the API service
                result = await importMovieFromTmdb(item.id);
            } else if (item.media_type === 'tv' || tmdbSearchType === 'tv') {
                // Import TV show using the API service
                result = await importTvShowFromTmdb(item.id);
            } else {
                throw new Error('Unknown media type');
            }
            
            setTmdbSuccess(`"${item.title || item.name}" imported successfully!`);
            setTmdbIsLoading(false);
            
            console.log('TMDB import successful:', result);
            
            // Navigate to the media detail page after import
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500);
            } else {
                setTimeout(() => {
                    navigate('/all-media');
                }, 1500);
            }
            
        } catch (err) {
            console.error('TMDB import error:', err);
            setTmdbError(`Failed to import: ${err.message}`);
            setTmdbIsLoading(false);
        }
    };

    const getTmdbImageUrl = (item) => {
        if (item.poster_path) {
            return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        }
        return '/placeholder-movie.png';
    };

    const getTmdbItemTitle = (item) => {
        return item.title || item.name || 'Unknown Title';
    };

    const getTmdbItemYear = (item) => {
        const date = item.release_date || item.first_air_date;
        return date ? new Date(date).getFullYear() : '';
    };

    const getTmdbItemType = (item) => {
        if (item.media_type) {
            return item.media_type === 'movie' ? 'Movie' : 'TV Show';
        }
        return tmdbSearchType === 'movies' ? 'Movie' : 'TV Show';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    // YouTube handlers
    const handleYoutubeSearch = async () => {
        if (!youtubeSearchQuery.trim()) {
            setYoutubeError('Please enter a search term');
            return;
        }
        
        setYoutubeIsLoading(true);
        setYoutubeError('');
        setYoutubeSearchResults([]);
        
        try {
            const data = await searchYouTube(youtubeSearchQuery, youtubeSearchType, 25);
            
            const transformedResults = data.items?.map(item => ({
                id: item.id?.videoId || item.id?.playlistId || item.id?.channelId,
                kind: item.id?.kind,
                title: item.snippet?.title || 'Unknown Title',
                description: item.snippet?.description || 'No description available',
                channelTitle: item.snippet?.channelTitle || 'Unknown Channel',
                thumbnail: getYoutubeThumbnailUrl(item.snippet?.thumbnails),
                publishedAt: item.snippet?.publishedAt,
                publishTime: item.snippet?.publishTime
            })) || [];
            
            setYoutubeSearchResults(transformedResults);
            setYoutubeIsLoading(false);
            
        } catch (err) {
            console.error('YouTube search error:', err);
            setYoutubeError('Failed to search YouTube. Please try again.');
            setYoutubeIsLoading(false);
        }
    };

    const handleYoutubeImportFromUrl = async () => {
        if (!youtubeUrl.trim()) {
            setYoutubeError('Please enter a YouTube URL');
            return;
        }
        
        setYoutubeIsLoading(true);
        setYoutubeError('');
        
        try {
            const result = await importFromYouTubeUrl(youtubeUrl);
            
            setYoutubeSuccess(`YouTube content imported successfully!`);
            setYoutubeIsLoading(false);
            setYoutubeUrl('');
            
            console.log('YouTube import successful:', result);
            
            const mediaId = result.id || result.Id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500);
            }
            
        } catch (err) {
            console.error('YouTube URL import error:', err);
            setYoutubeError('Failed to import from URL. Please check the URL and try again.');
            setYoutubeIsLoading(false);
        }
    };

    const handleImportYoutubeItem = async (item) => {
        setYoutubeIsLoading(true);
        setYoutubeError('');
        
        try {
            let result;
            
            if (item.kind === 'youtube#video') {
                result = await importYouTubeVideo(item.id);
            } else if (item.kind === 'youtube#playlist') {
                result = await importYouTubePlaylist(item.id, true); // Import as channel/series
            } else if (item.kind === 'youtube#channel') {
                // Check if channel already exists
                const exists = await checkYouTubeChannelExists(item.id);
                if (exists) {
                    setYoutubeError('This channel has already been imported. Redirecting to channel page...');
                    setYoutubeIsLoading(false);
                    // You could redirect to the existing channel here if needed
                    return;
                }
                
                // Import as YouTubeChannel entity (first-class media type)
                result = await importYouTubeChannelEntity(item.id);
                
                setYoutubeSuccess(`Channel "${item.title}" imported successfully!`);
                setYoutubeIsLoading(false);
                
                // Navigate to the channel profile page
                if (result.id) {
                    setTimeout(() => {
                        navigate(`/youtube-channel/${result.id}`);
                    }, 1500);
                }
                return;
            } else {
                throw new Error('Unknown YouTube content type');
            }
            
            setYoutubeSuccess(`"${item.title}" imported successfully!`);
            setYoutubeIsLoading(false);
            
            console.log('YouTube import successful:', result);
            
            const mediaId = Array.isArray(result) ? result[0]?.id : result.id;
            if (mediaId) {
                setTimeout(() => {
                    navigate(`/media/${mediaId}`);
                }, 1500);
            }
            
        } catch (err) {
            console.error('YouTube import error:', err);
            setYoutubeError(`Failed to import: ${err.message}`);
            setYoutubeIsLoading(false);
        }
    };

    const getYoutubeThumbnailUrl = (thumbnails) => {
        if (!thumbnails) return '/placeholder-video.png';
        
        return thumbnails.high?.url || 
               thumbnails.medium?.url || 
               thumbnails.default?.url || 
               '/placeholder-video.png';
    };

    const getYoutubeItemType = (item) => {
        if (item.kind === 'youtube#video') return 'Video';
        if (item.kind === 'youtube#playlist') return 'Playlist';
        if (item.kind === 'youtube#channel') return 'Channel';
        return 'Unknown';
    };

    const formatYoutubeDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };

    const renderPodcastImportSection = (
        importMethod, setImportMethod,
        searchQuery, setSearchQuery, handleSearch,
        idValue, setIdValue, handleImportById,
        nameValue, setNameValue, handleImportByName,
        searchResults, handleImport,
        isLoading, error, success
    ) => (
        <Box sx={{ padding: 2 }}>
            <FormControl fullWidth margin="normal">
                <InputLabel>Import Method</InputLabel>
                <Select
                    value={importMethod}
                    label="Import Method"
                    onChange={(e) => setImportMethod(e.target.value)}
                >
                    <MenuItem value="search">Search and Select</MenuItem>
                    <MenuItem value="id">By Podcast ID</MenuItem>
                    <MenuItem value="name">By Podcast Name</MenuItem>
                </Select>
            </FormControl>

            {importMethod === 'search' && (
                <Box>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <TextField
                                        label="Search Podcasts"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        InputLabelProps={{
                                            sx: { color: 'white' }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleSearch}
                                        disabled={isLoading}
                                        startIcon={<Search />}
                                    >
                                        Search
                                    </Button>
                                </Box>

                    {searchResults.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Search Results ({searchResults.length})
                            </Typography>
                            {searchResults.map((podcast) => (
                                <Card key={podcast.id} sx={{ mb: 2 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <img
                                                src={podcast.image}
                                                alt={podcast.title}
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    objectFit: 'cover',
                                                    borderRadius: 4
                                                }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom>
                                                    {podcast.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    {podcast.publisher}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    {podcast.description.length > 200
                                                        ? `${podcast.description.substring(0, 200)}...`
                                                        : podcast.description}
                                                </Typography>
                                                <Chip 
                                                    label={`${podcast.total_episodes} episodes`} 
                                                    size="small" 
                                                    sx={{ mb: 1 }}
                                                />
                                                <Box>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => handleImport(podcast)}
                                                        disabled={isLoading}
                                                        startIcon={<Download />}
                                                    >
                                                        Import
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Box>
            )}

            {importMethod === 'id' && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                        label="Podcast ID"
                        value={idValue}
                        onChange={(e) => setIdValue(e.target.value)}
                        variant="outlined"
                        fullWidth
                        onKeyPress={(e) => e.key === 'Enter' && handleImportById()}
                    />
                    <Button
                        variant="contained"
                        onClick={handleImportById}
                        disabled={isLoading}
                        startIcon={<Download />}
                    >
                        Import
                    </Button>
                </Box>
            )}

            {importMethod === 'name' && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                        label="Podcast Name"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        variant="outlined"
                        fullWidth
                        onKeyPress={(e) => e.key === 'Enter' && handleImportByName()}
                    />
                    <Button
                        variant="contained"
                        onClick={handleImportByName}
                        disabled={isLoading}
                        startIcon={<Download />}
                    >
                        Import
                    </Button>
                </Box>
            )}

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                </Alert>
            )}
        </Box>
    );

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 3 }}>
                Import Media
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4 }}>
                Import media from external sources into your library.
            </Typography>

            {/* Podcast Import Section */}
            <Accordion 
                expanded={expanded === 'podcasts'} 
                onChange={handleAccordionChange('podcasts')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="podcasts-content"
                    id="podcasts-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Podcasts />
                        <Typography variant="h6">
                            Podcasts
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Powered by
                            </Typography>
                            <Button
                                variant="text"
                                size="small"
                                href="https://www.listennotes.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNew fontSize="small" />}
                                sx={{ 
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                ListenNotes
                            </Button>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {renderPodcastImportSection(
                        podcastImportMethod, setPodcastImportMethod,
                        podcastSearchQuery, setPodcastSearchQuery, handlePodcastSearch,
                        podcastId, setPodcastId, handlePodcastImportById,
                        podcastName, setPodcastName, handlePodcastImportByName,
                        podcastSearchResults, handleImportPodcast,
                        podcastIsLoading, podcastError, podcastSuccess
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Book Import Section */}
            <Accordion 
                expanded={expanded === 'books'} 
                onChange={handleAccordionChange('books')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="books-content"
                    id="books-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <MenuBook />
                        <Typography variant="h6">
                            Books
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Powered by
                            </Typography>
                            <Button
                                variant="text"
                                size="small"
                                href="https://openlibrary.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNew fontSize="small" />}
                                sx={{ 
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                Open Library
                            </Button>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ padding: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Import Method</InputLabel>
                            <Select
                                value={bookImportMethod}
                                label="Import Method"
                                onChange={(e) => setBookImportMethod(e.target.value)}
                            >
                                <MenuItem value="search">Search and Select</MenuItem>
                                <MenuItem value="isbn">By ISBN</MenuItem>
                                <MenuItem value="title">By Title/Author</MenuItem>
                            </Select>
                        </FormControl>

                        {bookImportMethod === 'search' && (
                            <Box>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Search Type</InputLabel>
                                    <Select
                                        value={bookSearchType}
                                        label="Search Type"
                                        onChange={(e) => setBookSearchType(e.target.value)}
                                    >
                                        <MenuItem value="General">General Search</MenuItem>
                                        <MenuItem value="Title">Title</MenuItem>
                                        <MenuItem value="Author">Author</MenuItem>
                                        <MenuItem value="ISBN">ISBN</MenuItem>
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <TextField
                                        label="Search Books"
                                        value={bookSearchQuery}
                                        onChange={(e) => setBookSearchQuery(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        onKeyPress={(e) => e.key === 'Enter' && handleBookSearch()}
                                        InputLabelProps={{
                                            sx: { color: 'white' }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleBookSearch}
                                        disabled={bookIsLoading}
                                        startIcon={<Search />}
                                    >
                                        Search
                                    </Button>
                                </Box>

                                {bookSearchResults.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Search Results ({bookSearchResults.length})
                                        </Typography>
                                        {bookSearchResults.map((book, index) => (
                                            <Card key={book.key || index} sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        {book.coverUrl && (
                                                            <img
                                                                src={book.coverUrl}
                                                                alt={book.title}
                                                                style={{
                                                                    width: 80,
                                                                    height: 120,
                                                                    objectFit: 'cover',
                                                                    borderRadius: 4
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="h6" gutterBottom>
                                                                {book.title || 'Unknown Title'}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                                by {book.authors?.join(', ') || 'Unknown Author'}
                                                            </Typography>
                                                            {book.firstPublishYear && (
                                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                                    First published: {book.firstPublishYear}
                                                                </Typography>
                                                            )}
                                                            {book.subjects && book.subjects.length > 0 && (
                                                                <Box sx={{ mb: 1 }}>
                                                                    {book.subjects.slice(0, 3).map((subject, idx) => (
                                                                        <Chip 
                                                                            key={idx}
                                                                            label={subject} 
                                                                            size="small" 
                                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                            )}
                                                            {book.editionCount && (
                                                                <Chip 
                                                                    label={`${book.editionCount} editions`} 
                                                                    size="small" 
                                                                    sx={{ mb: 1 }}
                                                                />
                                                            )}
                                                            <Box>
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => handleImportBook(book)}
                                                                    disabled={bookIsLoading}
                                                                    startIcon={<Download />}
                                                                >
                                                                    Import
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {bookImportMethod === 'isbn' && (
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <TextField
                                    label="ISBN"
                                    value={bookIsbn}
                                    onChange={(e) => setBookIsbn(e.target.value)}
                                    variant="outlined"
                                    fullWidth
                                    placeholder="978-0-123456-78-9"
                                    onKeyPress={(e) => e.key === 'Enter' && handleBookImportByIsbn()}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleBookImportByIsbn}
                                    disabled={bookIsLoading}
                                    startIcon={<Download />}
                                >
                                    Import
                                </Button>
                            </Box>
                        )}

                        {bookImportMethod === 'title' && (
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    label="Book Title"
                                    value={bookTitle}
                                    onChange={(e) => setBookTitle(e.target.value)}
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Author (Optional)"
                                    value={bookAuthor}
                                    onChange={(e) => setBookAuthor(e.target.value)}
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleBookImportByTitleAuthor}
                                    disabled={bookIsLoading}
                                    startIcon={<Download />}
                                    sx={{ mt: 1 }}
                                >
                                    Import
                                </Button>
                            </Box>
                        )}

                        {bookIsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {bookError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {bookError}
                            </Alert>
                        )}

                        {bookSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                {bookSuccess}
                            </Alert>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* TMDB Movies & TV Shows Import Section */}
            <Accordion 
                expanded={expanded === 'tmdb'} 
                onChange={handleAccordionChange('tmdb')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="tmdb-content"
                    id="tmdb-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <MovieFilter />
                        <Typography variant="h6">
                            Movies & TV Shows
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Powered by
                            </Typography>
                            <Button
                                variant="text"
                                size="small"
                                href="https://www.themoviedb.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNew fontSize="small" />}
                                sx={{ 
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                TMDB
                            </Button>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ padding: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Search Type</InputLabel>
                            <Select
                                value={tmdbSearchType}
                                label="Search Type"
                                onChange={(e) => setTmdbSearchType(e.target.value)}
                            >
                                <MenuItem value="multi">All (Movies & TV Shows)</MenuItem>
                                <MenuItem value="movies">Movies Only</MenuItem>
                                <MenuItem value="tv">TV Shows Only</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                label="Search Movies & TV Shows"
                                value={tmdbSearchQuery}
                                onChange={(e) => setTmdbSearchQuery(e.target.value)}
                                variant="outlined"
                                fullWidth
                                onKeyPress={(e) => e.key === 'Enter' && handleTmdbSearch()}
                                InputLabelProps={{
                                    sx: { color: 'white' }
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleTmdbSearch}
                                disabled={tmdbIsLoading}
                                startIcon={<Search />}
                            >
                                Search
                            </Button>
                        </Box>

                        {/* TMDB Credit */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 2,
                            justifyContent: 'center',
                            py: 1
                        }}>
                            <img 
                                src="/tmdb-primary-short-logo.svg" 
                                alt="TMDB" 
                                style={{ 
                                    height: '20px',
                                    width: 'auto'
                                }}
                            />
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '0.75rem'
                                }}
                            >
                                This product uses the TMDB API but is not endorsed or certified by TMDB
                            </Typography>
                        </Box>

                        {tmdbSearchResults.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Search Results ({tmdbSearchResults.length})
                                </Typography>
                                {tmdbSearchResults.map((item, index) => (
                                    <Card key={`${item.id}-${index}`} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 80,
                                                        height: 120,
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                                    }}
                                                >
                                                    <img
                                                        src={getTmdbImageUrl(item)}
                                                        alt=""
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            display: 'block',
                                                            fontSize: '12px'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = '/placeholder-movie.png';
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography 
                                                        variant="h6" 
                                                        gutterBottom
                                                        sx={{ 
                                                            fontSize: '1.25rem',
                                                            fontWeight: 600,
                                                            minHeight: '1.5rem',
                                                            lineHeight: 1.2
                                                        }}
                                                    >
                                                        {getTmdbItemTitle(item)}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <Chip 
                                                            label={getTmdbItemType(item)}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                        {getTmdbItemYear(item) && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                ({getTmdbItemYear(item)})
                                                            </Typography>
                                                        )}
                                                        {item.vote_average && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                ⭐ {item.vote_average.toFixed(1)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            mb: 2,
                                                            fontSize: '0.875rem',
                                                            lineHeight: 1.4,
                                                            minHeight: '2.8rem',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 3,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {item.overview ? 
                                                            (item.overview.length > 200 
                                                                ? `${item.overview.substring(0, 200)}...` 
                                                                : item.overview
                                                            ) : 'No description available.'
                                                        }
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <WhiteOutlineButton
                                                            size="small"
                                                            onClick={() => handleTmdbItemClick(item)}
                                                            disabled={tmdbIsLoading}
                                                        >
                                                            View Details
                                                        </WhiteOutlineButton>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => handleTmdbImport(item)}
                                                            disabled={tmdbIsLoading}
                                                            startIcon={<Download />}
                                                        >
                                                            Import
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {tmdbIsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {tmdbError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {tmdbError}
                            </Alert>
                        )}

                        {tmdbSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                {tmdbSuccess}
                            </Alert>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* YouTube Import Section */}
            <Accordion 
                expanded={expanded === 'youtube'} 
                onChange={handleAccordionChange('youtube')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="youtube-content"
                    id="youtube-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <VideoLibrary />
                        <Typography variant="h6">
                            YouTube Videos
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Powered by
                            </Typography>
                            <Button
                                variant="text"
                                size="small"
                                href="https://www.youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNew fontSize="small" />}
                                sx={{ 
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                YouTube
                            </Button>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ padding: 2 }}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Import Method</InputLabel>
                            <Select
                                value={youtubeImportMethod}
                                label="Import Method"
                                onChange={(e) => setYoutubeImportMethod(e.target.value)}
                            >
                                <MenuItem value="search">Search and Select</MenuItem>
                                <MenuItem value="url">By YouTube URL</MenuItem>
                            </Select>
                        </FormControl>

                        {youtubeImportMethod === 'search' && (
                            <Box>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Content Type</InputLabel>
                                    <Select
                                        value={youtubeSearchType}
                                        label="Content Type"
                                        onChange={(e) => setYoutubeSearchType(e.target.value)}
                                    >
                                        <MenuItem value="video">Videos</MenuItem>
                                        <MenuItem value="playlist">Playlists</MenuItem>
                                        <MenuItem value="channel">Channels</MenuItem>
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <TextField
                                        label="Search YouTube"
                                        value={youtubeSearchQuery}
                                        onChange={(e) => setYoutubeSearchQuery(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        onKeyPress={(e) => e.key === 'Enter' && handleYoutubeSearch()}
                                        InputLabelProps={{
                                            sx: { color: 'white' }
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleYoutubeSearch}
                                        disabled={youtubeIsLoading}
                                        startIcon={<Search />}
                                    >
                                        Search
                                    </Button>
                                </Box>

                                {youtubeSearchResults.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Search Results ({youtubeSearchResults.length})
                                        </Typography>
                                        {youtubeSearchResults.map((item, index) => (
                                            <Card key={`${item.id}-${index}`} sx={{ mb: 2 }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Box
                                                            sx={{
                                                                width: 120,
                                                                height: 90,
                                                                borderRadius: 1,
                                                                overflow: 'hidden',
                                                                flexShrink: 0,
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                                            }}
                                                        >
                                                            <img
                                                                src={item.thumbnail}
                                                                alt=""
                                                                crossOrigin="anonymous"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover',
                                                                    display: 'block'
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.src = '/placeholder-video.png';
                                                                }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography 
                                                                variant="h6" 
                                                                gutterBottom
                                                                sx={{ 
                                                                    fontSize: '1.1rem',
                                                                    fontWeight: 600,
                                                                    lineHeight: 1.2
                                                                }}
                                                            >
                                                                {item.title}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                <Chip 
                                                                    label={getYoutubeItemType(item)}
                                                                    size="small"
                                                                    color="primary"
                                                                />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    by {item.channelTitle}
                                                                </Typography>
                                                                {item.publishedAt && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        • {formatYoutubeDate(item.publishedAt)}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    mb: 2,
                                                                    fontSize: '0.875rem',
                                                                    lineHeight: 1.4,
                                                                    display: '-webkit-box',
                                                                    WebkitLineClamp: 2,
                                                                    WebkitBoxOrient: 'vertical',
                                                                    overflow: 'hidden'
                                                                }}
                                                            >
                                                                {item.description ? 
                                                                    (item.description.length > 150 
                                                                        ? `${item.description.substring(0, 150)}...` 
                                                                        : item.description
                                                                    ) : 'No description available.'
                                                                }
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                <WhiteOutlineButton
                                                                    variant="contained"
                                                                    size="small"
                                                                    onClick={() => handleImportYoutubeItem(item)}
                                                                    disabled={youtubeIsLoading}
                                                                    startIcon={<Download />}
                                                                >
                                                                    Import
                                                                </WhiteOutlineButton>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {youtubeImportMethod === 'url' && (
                            <Box>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <TextField
                                        label="YouTube URL"
                                        value={youtubeUrl}
                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                        variant="outlined"
                                        fullWidth
                                        placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=..."
                                        onKeyPress={(e) => e.key === 'Enter' && handleYoutubeImportFromUrl()}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleYoutubeImportFromUrl}
                                        disabled={youtubeIsLoading}
                                        startIcon={<Download />}
                                    >
                                        Import
                                    </Button>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Supports YouTube video URLs, playlist URLs, and channel URLs. The system will automatically detect the type and import accordingly.
                                </Typography>
                            </Box>
                        )}

                        {youtubeIsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {youtubeError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {youtubeError}
                            </Alert>
                        )}

                        {youtubeSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                {youtubeSuccess}
                            </Alert>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Instapaper Import Section */}
            <Accordion 
                expanded={expanded === 'instapaper'} 
                onChange={handleAccordionChange('instapaper')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="instapaper-content"
                    id="instapaper-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Article />
                        <Typography variant="h6">
                            Articles from Instapaper
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Powered by
                            </Typography>
                            <Button
                                variant="text"
                                size="small"
                                href="https://www.instapaper.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNew fontSize="small" />}
                                sx={{ 
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                    color: '#ffffff',
                                    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                Instapaper
                            </Button>
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ padding: 2 }}>
                        <Typography variant="body1" paragraph>
                            Import articles from your Instapaper account. Connect your account to:
                        </Typography>
                        <Box component="ul" sx={{ mb: 2, pl: 3 }}>
                            <li>
                                <Typography variant="body2">
                                    Import articles from Unread, Starred, or Archive folders
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Preserve reading progress and metadata
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Automatically detect and skip duplicates
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    Sync existing articles with latest progress
                                </Typography>
                            </li>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<Article />}
                            onClick={() => navigate('/instapaper/auth')}
                            sx={{ mt: 2 }}
                        >
                            Connect to Instapaper
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>

            <Divider sx={{ my: 4 }} />
            
            <Box sx={{ textAlign: 'center' }}>
                <WhiteOutlineButton 
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2 }}
                >
                    Go Back
                </WhiteOutlineButton>
            </Box>

            {/* TMDB Details Modal */}
            {showTmdbDetails && selectedTmdbItem && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1300,
                        p: 2
                    }}
                    onClick={() => setShowTmdbDetails(false)}
                >
                    <Box
                        sx={{
                            backgroundColor: '#474350',
                            borderRadius: 2,
                            maxWidth: '800px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            p: 3
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                            <Typography variant="h4" sx={{ flex: 1, mr: 2, color: '#ffffff' }}>
                                {selectedTmdbItem.title || selectedTmdbItem.name}
                            </Typography>
                            <Button
                                onClick={() => setShowTmdbDetails(false)}
                                sx={{ minWidth: 'auto', p: 1 }}
                            >
                                ×
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                            <img
                                src={getTmdbImageUrl(selectedTmdbItem)}
                                alt={selectedTmdbItem.title || selectedTmdbItem.name}
                                style={{
                                    width: 200,
                                    height: 300,
                                    objectFit: 'cover',
                                    borderRadius: 8
                                }}
                                onError={(e) => {
                                    e.target.src = '/placeholder-movie.png';
                                }}
                            />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
                                    Overview
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 3, color: '#ffffff' }}>
                                    {selectedTmdbItem.overview || 'No description available.'}
                                </Typography>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: '#fcfafa' }}>
                                            Release Date
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                            {formatDate(selectedTmdbItem.release_date || selectedTmdbItem.first_air_date)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: '#fcfafa' }}>
                                            Rating
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                            {selectedTmdbItem.vote_average ? `⭐ ${selectedTmdbItem.vote_average.toFixed(1)}` : 'N/A'}
                                        </Typography>
                                    </Box>
                                    {selectedTmdbItem.runtime && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: '#fcfafa' }}>
                                                Runtime
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                {selectedTmdbItem.runtime} minutes
                                            </Typography>
                                        </Box>
                                    )}
                                    {selectedTmdbItem.number_of_seasons && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: '#fcfafa' }}>
                                                Seasons
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#ffffff' }}>
                                                {selectedTmdbItem.number_of_seasons}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {selectedTmdbItem.genres && selectedTmdbItem.genres.length > 0 && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#fcfafa' }} gutterBottom>
                                            Genres
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selectedTmdbItem.genres.map((genre, index) => (
                                                <Chip
                                                    key={index}
                                                    label={genre.name}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            handleTmdbImport(selectedTmdbItem);
                                            setShowTmdbDetails(false);
                                        }}
                                        disabled={tmdbIsLoading}
                                        startIcon={<Download />}
                                    >
                                        Import to Library
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setShowTmdbDetails(false)}
                                    >
                                        Close
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            )}
        </Container>
    );
}

export default ImportMediaPage;