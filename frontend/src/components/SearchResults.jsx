import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    Container, Typography, Box, Card, CardContent, Grid, CircularProgress,
    Alert, Chip, Button, ButtonGroup, List, ListItem, ListItemText,
    ListItemSecondaryAction, IconButton, Divider
} from '@mui/material';
import { ViewModule, ViewList, OpenInNew } from '@mui/icons-material';
import { getAllMedia, getMediaByTopic, getMediaByGenre } from '../services/apiService';

function SearchResults() {
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
    
    const location = useLocation();
    const navigate = useNavigate();
    
    // Parse URL parameters
    const searchParams = new URLSearchParams(location.search);
    const searchType = searchParams.get('type'); // 'topic' or 'genre'
    const searchValue = searchParams.get('value');
    const searchId = searchParams.get('id');

    useEffect(() => {
        const loadMediaByFilter = async () => {
            try {
                setLoading(true);
                let response;
                
                if (searchType === 'topic' && searchId) {
                    response = await getMediaByTopic(searchId);
                } else if (searchType === 'genre' && searchId) {
                    response = await getMediaByGenre(searchId);
                } else {
                    // Fallback to client-side filtering if no ID provided
                    response = await getAllMedia();
                    
                    if (searchType === 'topic' && searchValue) {
                        response.data = response.data.filter(item => 
                            item.topics && item.topics.some(topic => 
                                topic.toLowerCase() === searchValue.toLowerCase()
                            )
                        );
                    } else if (searchType === 'genre' && searchValue) {
                        response.data = response.data.filter(item => 
                            item.genres && item.genres.some(genre => 
                                genre.toLowerCase() === searchValue.toLowerCase()
                            )
                        );
                    }
                }
                
                setMediaItems(response.data);
            } catch (err) {
                console.error('Error loading media items:', err);
                setError('Failed to load media items');
            } finally {
                setLoading(false);
            }
        };

        if (searchType && (searchValue || searchId)) {
            loadMediaByFilter();
        } else {
            setError('Invalid search parameters');
            setLoading(false);
        }
    }, [searchType, searchValue, searchId]);

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const renderCardView = () => (
        <Grid container spacing={3} sx={{ mt: 2 }}>
            {mediaItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card 
                        component={Link} 
                        to={`/media/${item.id}`}
                        sx={{ 
                            textDecoration: 'none',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 4
                            },
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div" gutterBottom>
                                {item.title}
                            </Typography>
                            <Chip 
                                label={item.mediaType} 
                                size="small" 
                                sx={{ mb: 1 }}
                            />
                            {item.rating && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Rating: {item.rating}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {item.status || 'No status set'}
                            </Typography>
                            
                            {/* Topics and Genres */}
                            {(item.topics?.length > 0 || item.genres?.length > 0) && (
                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {item.topics?.map((topic, index) => (
                                        <Chip
                                            key={`topic-${index}`}
                                            label={topic}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                    ))}
                                    {item.genres?.map((genre, index) => (
                                        <Chip
                                            key={`genre-${index}`}
                                            label={genre}
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                    ))}
                                </Box>
                            )}
                            
                            {item.notes && (
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        mt: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    {item.notes}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    const renderListView = () => (
        <List sx={{ mt: 2 }}>
            {mediaItems.map((item, index) => (
                <React.Fragment key={item.id}>
                    <ListItem
                        component={Link}
                        to={`/media/${item.id}`}
                        sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': {
                                backgroundColor: 'action.hover'
                            }
                        }}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6" component="span">
                                        {item.title}
                                    </Typography>
                                    <Chip 
                                        label={item.mediaType} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                    {item.rating && (
                                        <Chip 
                                            label={`★ ${item.rating}`} 
                                            size="small" 
                                            color="warning"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                            }
                            secondary={
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Status: {item.status || 'No status set'}
                                    </Typography>
                                    {(item.topics?.length > 0 || item.genres?.length > 0) && (
                                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {item.topics?.map((topic, index) => (
                                                <Chip
                                                    key={`topic-${index}`}
                                                    label={topic}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: '18px' }}
                                                />
                                            ))}
                                            {item.genres?.map((genre, index) => (
                                                <Chip
                                                    key={`genre-${index}`}
                                                    label={genre}
                                                    size="small"
                                                    color="secondary"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: '18px' }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                    {item.notes && (
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                mt: 0.5,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {item.notes}
                                        </Typography>
                                    )}
                                </Box>
                            }
                        />
                        <ListItemSecondaryAction>
                            <IconButton edge="end" color="primary">
                                <OpenInNew />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                    {index < mediaItems.length - 1 && <Divider />}
                </React.Fragment>
            ))}
        </List>
    );

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {searchType === 'topic' ? 'Topic' : 'Genre'}: {searchValue}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Found {mediaItems.length} media item{mediaItems.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                    
                    {/* View Mode Toggle */}
                    <ButtonGroup variant="outlined" aria-label="view mode">
                        <Button
                            onClick={() => handleViewModeChange('card')}
                            variant={viewMode === 'card' ? 'contained' : 'outlined'}
                            startIcon={<ViewModule />}
                        >
                            Cards
                        </Button>
                        <Button
                            onClick={() => handleViewModeChange('list')}
                            variant={viewMode === 'list' ? 'contained' : 'outlined'}
                            startIcon={<ViewList />}
                        >
                            List
                        </Button>
                    </ButtonGroup>
                </Box>

                {/* Results */}
                {mediaItems.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            No media items found for this {searchType}.
                        </Typography>
                        <Button 
                            variant="contained" 
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/search-by-topic-genre')}
                        >
                            Back to Search
                        </Button>
                    </Box>
                ) : (
                    viewMode === 'card' ? renderCardView() : renderListView()
                )}
            </Box>
        </Container>
    );
}

export default SearchResults;
