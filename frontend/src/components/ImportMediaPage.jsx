import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container,
    Select, MenuItem, InputLabel, FormControl,
    Card, CardContent, CircularProgress, Alert,
    Divider, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Search, Download, Podcasts, MenuBook, ExpandMore } from '@mui/icons-material';
import { searchPodcasts, getPodcastById, importPodcastFromApi, searchBooksFromOpenLibrary, importBookFromOpenLibrary } from '../services/apiService';

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
                image: podcast.image || 'https://placehold.co/300x300/695a8c/fcfafa?text=No+Image',
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
            // Use real API to import podcast
            const result = await importPodcastFromApi({ podcastId: podcastId });
            
            setPodcastSuccess(`Podcast imported successfully!`);
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
            // Use real API to import podcast by name
            const result = await importPodcastFromApi({ podcastName: podcastName });
            
            setPodcastSuccess(`Podcast imported successfully!`);
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
            // Use real API to import podcast
            const result = await importPodcastFromApi({ podcastId: podcast.id });
            
            // Show success message
            setPodcastSuccess(`"${podcast.title}" imported successfully!`);
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Podcasts />
                        <Typography variant="h6">
                            Podcasts
                        </Typography>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MenuBook />
                        <Typography variant="h6">
                            Books
                        </Typography>
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

            <Divider sx={{ my: 4 }} />
            
            <Box sx={{ textAlign: 'center' }}>
                <Button 
                    variant="outlined" 
                    onClick={() => navigate(-1)}
                    sx={{ mr: 2 }}
                >
                    Go Back
                </Button>
            </Box>
        </Container>
    );
}

export default ImportMediaPage;