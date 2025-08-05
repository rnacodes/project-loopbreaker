import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container,
    Select, MenuItem, InputLabel, FormControl,
    Card, CardContent, CircularProgress, Alert,
    Divider, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Search, Download, Podcasts, ExpandMore } from '@mui/icons-material';

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
    
    // Mock Podcast states
    const [mockPodcastImportMethod, setMockPodcastImportMethod] = useState('search');
    const [mockPodcastSearchQuery, setMockPodcastSearchQuery] = useState('');
    const [mockPodcastId, setMockPodcastId] = useState('');
    const [mockPodcastName, setMockPodcastName] = useState('');
    const [mockPodcastSearchResults, setMockPodcastSearchResults] = useState([]);
    const [mockPodcastIsLoading, setMockPodcastIsLoading] = useState(false);
    const [mockPodcastError, setMockPodcastError] = useState('');
    const [mockPodcastSuccess, setMockPodcastSuccess] = useState('');
    
    const navigate = useNavigate();

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    // Regular Podcast handlers
    const handlePodcastSearch = async () => {
        if (!podcastSearchQuery.trim()) {
            setPodcastError('Please enter a search term');
            return;
        }
        
        setPodcastIsLoading(true);
        setPodcastError('');
        setPodcastSearchResults([]);
        
        try {
            // TODO: Replace with actual ListenNotes API call (production)
            
            // Mock data for now
            setTimeout(() => {
                const mockResults = [
                    {
                        id: 'prod1',
                        title: 'The Joe Rogan Experience',
                        publisher: 'Joe Rogan',
                        description: 'The official podcast of comedian Joe Rogan.',
                        image: 'https://placehold.co/300x300/695a8c/fcfafa?text=JRE',
                        total_episodes: 2000
                    },
                    {
                        id: 'prod2',
                        title: 'Serial',
                        publisher: 'Serial Productions',
                        description: 'Serial is a podcast where we unfold one nonfiction story.',
                        image: 'https://placehold.co/300x300/474350/fcfafa?text=Serial',
                        total_episodes: 45
                    }
                ];
                setPodcastSearchResults(mockResults);
                setPodcastIsLoading(false);
            }, 1500);
            
        } catch (err) {
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
            // TODO: Implement actual import by ID (production API)
            console.log('Importing podcast by ID (production):', podcastId);
            
            setTimeout(() => {
                setPodcastSuccess('Podcast imported successfully from production API!');
                setPodcastIsLoading(false);
                setPodcastId('');
            }, 1500);
            
        } catch (err) {
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
            // TODO: Implement actual import by exact name (production API)
            console.log('Importing podcast by name (production):', podcastName);
            
            setTimeout(() => {
                setPodcastSuccess('Podcast imported successfully from production API!');
                setPodcastIsLoading(false);
                setPodcastName('');
            }, 1500);
            
        } catch (err) {
            setPodcastError('Failed to import podcast. Please check the name and try again.');
            setPodcastIsLoading(false);
        }
    };

    const handleImportPodcast = async (podcast) => {
        setPodcastIsLoading(true);
        setPodcastError('');
        
        try {
            // TODO: Implement actual import functionality (production API)
            console.log('Importing podcast (production):', podcast);
            
            setTimeout(() => {
                setPodcastSuccess(`"${podcast.title}" imported successfully from production API!`);
                setPodcastIsLoading(false);
            }, 1500);
            
        } catch (err) {
            setPodcastError('Failed to import podcast. Please try again.');
            setPodcastIsLoading(false);
        }
    };

    // Mock Podcast handlers
    const handleMockPodcastSearch = async () => {
        if (!mockPodcastSearchQuery.trim()) {
            setMockPodcastError('Please enter a search term');
            return;
        }
        
        setMockPodcastIsLoading(true);
        setMockPodcastError('');
        setMockPodcastSearchResults([]);
        
        try {
            // Call your backend API which uses the Listen Notes mock API
            const response = await fetch(`/api/MockListenNotes/search?query=${encodeURIComponent(mockPodcastSearchQuery)}&type=podcast`);
            
            if (!response.ok) {
                throw new Error('Failed to search podcasts');
            }
            
            const data = await response.json();
            
            // Transform the Listen Notes API response to match your component's expected format
            const transformedResults = data.results?.map(podcast => ({
                id: podcast.id,
                title: podcast.title_original || podcast.title_highlighted || 'Unknown Title',
                publisher: podcast.publisher_original || podcast.publisher_highlighted || 'Unknown Publisher',
                description: podcast.description_original || podcast.description_highlighted || 'No description available',
                image: podcast.image || 'https://placehold.co/300x300/695a8c/fcfafa?text=No+Image',
                total_episodes: podcast.total_episodes || 0
            })) || [];
            
            setMockPodcastSearchResults(transformedResults);
            setMockPodcastIsLoading(false);
            
        } catch (err) {
            setMockPodcastError('Failed to search mock podcasts. Please try again.');
            setMockPodcastIsLoading(false);
        }
    };

    const handleMockPodcastImportById = async () => {
        if (!mockPodcastId.trim()) {
            setMockPodcastError('Please enter a podcast ID');
            return;
        }
        
        setMockPodcastIsLoading(true);
        setMockPodcastError('');
        
        try {
            // Call your backend API to get podcast by ID
            const response = await fetch(`/api/MockListenNotes/podcasts/${encodeURIComponent(mockPodcastId)}`);
            
            if (!response.ok) {
                throw new Error('Failed to import podcast');
            }
            
            const data = await response.json();
            
            // TODO: Process the podcast data and save to your database
            console.log('Importing podcast by ID (mock):', data);
            
            setMockPodcastSuccess(`Podcast "${data.title_original || data.title}" imported successfully from mock API!`);
            setMockPodcastIsLoading(false);
            setMockPodcastId('');
            
        } catch (err) {
            setMockPodcastError('Failed to import mock podcast. Please check the ID and try again.');
            setMockPodcastIsLoading(false);
        }
    };

    const handleMockPodcastImportByName = async () => {
        if (!mockPodcastName.trim()) {
            setMockPodcastError('Please enter a podcast name');
            return;
        }
        
        setMockPodcastIsLoading(true);
        setMockPodcastError('');
        
        try {
            // Search for podcast by exact name first
            const response = await fetch(`/api/MockListenNotes/search?query=${encodeURIComponent(mockPodcastName)}&type=podcast`);
            
            if (!response.ok) {
                throw new Error('Failed to search for podcast');
            }
            
            const data = await response.json();
            
            // Find exact match by name
            const exactMatch = data.results?.find(podcast => 
                (podcast.title_original || podcast.title_highlighted || '').toLowerCase() === mockPodcastName.toLowerCase()
            );
            
            if (!exactMatch) {
                throw new Error('No exact match found for the podcast name');
            }
            
            // TODO: Process the podcast data and save to your database
            console.log('Importing podcast by name (mock):', exactMatch);
            
            setMockPodcastSuccess(`Podcast "${exactMatch.title_original || exactMatch.title}" imported successfully from mock API!`);
            setMockPodcastIsLoading(false);
            setMockPodcastName('');
            
        } catch (err) {
            setMockPodcastError('Failed to import mock podcast. Please check the name and try again.');
            setMockPodcastIsLoading(false);
        }
    };

    const handleImportMockPodcast = async (podcast) => {
        setMockPodcastIsLoading(true);
        setMockPodcastError('');
        
        try {
            // TODO: Implement actual import functionality to save to your database
            console.log('Importing mock podcast:', podcast);
            
            // You might want to call another API endpoint to save this to your database
            // For now, just simulate success
            setMockPodcastSuccess(`"${podcast.title}" imported successfully from mock API!`);
            setMockPodcastIsLoading(false);
            
        } catch (err) {
            setMockPodcastError('Failed to import mock podcast. Please try again.');
            setMockPodcastIsLoading(false);
        }
    };

    const renderPodcastSection = (
        importMethod, setImportMethod,
        searchQuery, setSearchQuery, handleSearch,
        podcastIdValue, setPodcastIdValue, handleImportById,
        podcastNameValue, setPodcastNameValue, handleImportByName,
        searchResults, handleImportPodcast,
        isLoading, error, success
    ) => (
        <Box>
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="import-method-label" sx={{ color: '#ffffff' }}>
                    Choose Import Method
                </InputLabel>
                <Select
                    labelId="import-method-label"
                    value={importMethod}
                    label="Choose Import Method"
                    onChange={(e) => setImportMethod(e.target.value)}
                    sx={{
                        '& .MuiSelect-select': {
                            color: '#ffffff'
                        }
                    }}
                >
                    <MenuItem value="search">Search and Select</MenuItem>
                    <MenuItem value="id">Import by Podcast ID</MenuItem>
                    <MenuItem value="name">Import by Exact Name</MenuItem>
                </Select>
            </FormControl>

            {/* Search Method */}
            {importMethod === 'search' && (
                <Box>
                    <Typography variant="body1" sx={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        mb: 1,
                        color: '#ffffff'
                    }}>
                        Search Podcasts
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            placeholder="Enter podcast name or keywords..."
                            variant="outlined"
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '16px'
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#ffffff',
                                    opacity: 1
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            disabled={isLoading}
                            startIcon={<Search />}
                            sx={{ minWidth: '120px' }}
                        >
                            Search
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Import by ID Method */}
            {importMethod === 'id' && (
                <Box>
                    <Typography variant="body1" sx={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        mb: 1,
                        color: '#ffffff'
                    }}>
                        Podcast ID
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            placeholder="Enter ListenNotes podcast ID..."
                            variant="outlined"
                            fullWidth
                            value={podcastIdValue}
                            onChange={(e) => setPodcastIdValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleImportById()}
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '16px'
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#ffffff',
                                    opacity: 1
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleImportById}
                            disabled={isLoading}
                            startIcon={<Download />}
                            sx={{ minWidth: '120px' }}
                        >
                            Import
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Import by Name Method */}
            {importMethod === 'name' && (
                <Box>
                    <Typography variant="body1" sx={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        mb: 1,
                        color: '#ffffff'
                    }}>
                        Exact Podcast Name
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            placeholder="Enter exact podcast name..."
                            variant="outlined"
                            fullWidth
                            value={podcastNameValue}
                            onChange={(e) => setPodcastNameValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleImportByName()}
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '16px'
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#ffffff',
                                    opacity: 1
                                }
                            }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleImportByName}
                            disabled={isLoading}
                            startIcon={<Download />}
                            sx={{ minWidth: '120px' }}
                        >
                            Import
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error Message */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Success Message */}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                </Alert>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
                <Box>
                    <Typography variant="h6" sx={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        mb: 2,
                        color: '#ffffff'
                    }}>
                        Search Results
                    </Typography>
                    
                    {searchResults.map((podcast) => (
                        <Card key={podcast.id} sx={{ mb: 2, p: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flexShrink: 0 }}>
                                    <img 
                                        src={podcast.image} 
                                        alt={podcast.title}
                                        style={{ 
                                            width: '80px', 
                                            height: '80px', 
                                            borderRadius: '8px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" sx={{ 
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        mb: 0.5,
                                        color: '#ffffff'
                                    }}>
                                        {podcast.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                        color: '#ffffff',
                                        opacity: 0.7,
                                        mb: 0.5,
                                        fontSize: '12px'
                                    }}>
                                        by {podcast.publisher}
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                        color: '#ffffff',
                                        opacity: 0.8,
                                        mb: 1,
                                        lineHeight: 1.3,
                                        fontSize: '12px'
                                    }}>
                                        {podcast.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip 
                                            icon={<Podcasts />}
                                            label={`${podcast.total_episodes} episodes`}
                                            size="small"
                                            sx={{ fontSize: '10px' }}
                                        />
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => handleImportPodcast(podcast)}
                                            disabled={isLoading}
                                            startIcon={<Download />}
                                            sx={{ fontSize: '11px' }}
                                        >
                                            Import
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 3, sm: 4, md: 6 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ 
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    mb: 2
                }}>
                    Import Media
                </Typography>
                <Typography variant="body1" sx={{ 
                    textAlign: 'center',
                    color: '#ffffff',
                    opacity: 0.8,
                    mb: 4
                }}>
                    Import content from various sources and APIs
                </Typography>
            </Box>

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Podcasts />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Import Podcasts
                        </Typography>
                        <Chip label="Production API" size="small" color="primary" />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {renderPodcastSection(
                        podcastImportMethod, setPodcastImportMethod,
                        podcastSearchQuery, setPodcastSearchQuery, handlePodcastSearch,
                        podcastId, setPodcastId, handlePodcastImportById,
                        podcastName, setPodcastName, handlePodcastImportByName,
                        podcastSearchResults, handleImportPodcast,
                        podcastIsLoading, podcastError, podcastSuccess
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Mock Podcast Import Section */}
            <Accordion 
                expanded={expanded === 'mockPodcasts'} 
                onChange={handleAccordionChange('mockPodcasts')}
                sx={{ mb: 2 }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="mock-podcasts-content"
                    id="mock-podcasts-header"
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Podcasts />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Mock Podcasts
                        </Typography>
                        <Chip label="Test API" size="small" color="secondary" />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {renderPodcastSection(
                        mockPodcastImportMethod, setMockPodcastImportMethod,
                        mockPodcastSearchQuery, setMockPodcastSearchQuery, handleMockPodcastSearch,
                        mockPodcastId, setMockPodcastId, handleMockPodcastImportById,
                        mockPodcastName, setMockPodcastName, handleMockPodcastImportByName,
                        mockPodcastSearchResults, handleImportMockPodcast,
                        mockPodcastIsLoading, mockPodcastError, mockPodcastSuccess
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Placeholder for future media types */}
            <Box sx={{ mt: 4, p: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="body1" sx={{ 
                    color: '#ffffff',
                    opacity: 0.6,
                    fontStyle: 'italic'
                }}>
                    Additional media import sections (Books, Videos, etc.) will be added here
                </Typography>
            </Box>

            {/* Back Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button 
                    variant="outlined" 
                    onClick={() => navigate(-1)}
                    sx={{ 
                        fontSize: '16px',
                        fontWeight: 'bold',
                        px: 4,
                        py: 1.5
                    }}
                >
                    Back
                </Button>
            </Box>
        </Container>
    );
}

export default ImportMediaPage;