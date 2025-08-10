import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Grid, Fab, Chip, IconButton, Collapse, Divider, Paper, Link
} from '@mui/material';
import { Add, ArrowBack, Delete, ExpandMore, ExpandLess, OpenInNew } from '@mui/icons-material';
import { getMixlistById, removeMediaFromMixlist } from '../services/apiService';
import MediaCarousel from './shared/MediaCarousel';

function MixlistDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mixlist, setMixlist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mediaListExpanded, setMediaListExpanded] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);

    useEffect(() => {
        const loadMixlist = async () => {
            try {
                const response = await getMixlistById(id);
                console.log('Mixlist response:', response);
                console.log('Mixlist data:', response.data);
                setMixlist(response.data);
            } catch (error) {
                console.error('Error loading mixlist:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMixlist();
    }, [id]);

    const handleRemoveMedia = async (mediaItemId) => {
        try {
            await removeMediaFromMixlist(id, mediaItemId);
            // Reload the mixlist to update the display
            const response = await getMixlistById(id);
            setMixlist(response.data);
            // Clear selected media if it was removed
            if (selectedMedia && selectedMedia.id === mediaItemId) {
                setSelectedMedia(null);
            }
        } catch (error) {
            console.error('Error removing media from mixlist:', error);
        }
    };

    const handleMediaCarouselClick = (media) => {
        setSelectedMedia(media);
    };

    const getMediaTypeColor = (mediaType) => {
        const colors = {
            'Podcast': '#9C27B0',
            'Book': '#2196F3',
            'Movie': '#FF5722',
            'Article': '#4CAF50',
            'Video': '#FF9800',
            'Music': '#E91E63',
            'VideoGame': '#673AB7',
            'TVShow': '#795548',
            'Website': '#607D8B',
            'Document': '#3F51B5',
            'Other': '#9E9E9E'
        };
        return colors[mediaType] || colors['Other'];
    };

    const getStatusColor = (status) => {
        const colors = {
            'Completed': '#4CAF50',
            'ActivelyExploring': '#FF9800',
            'Uncharted': '#9E9E9E',
            'Abandoned': '#F44336'
        };
        return colors[status] || colors['Uncharted'];
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography variant="h6">Loading mixlist...</Typography>
            </Box>
        );
    }

    if (!mixlist) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography variant="h6">Mixlist not found</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ p: 3, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <IconButton onClick={() => navigate('/mixlists')} sx={{ mr: 2 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h3" component="h1" sx={{ 
                        fontSize: '32px',
                        fontWeight: 'bold'
                    }}>
                        {mixlist.Name || mixlist.name}
                    </Typography>
                </Box>

                {/* Mixlist Information Card */}
                <Card sx={{ mb: 4, overflow: 'hidden' }}>
                    {/* Thumbnail */}
                    {(mixlist.Thumbnail || mixlist.thumbnail) && (
                        <CardMedia
                            component="img"
                            sx={{
                                width: '100%',
                                height: 250,
                                objectFit: 'cover'
                            }}
                            image={mixlist.Thumbnail || mixlist.thumbnail}
                            alt={mixlist.Name || mixlist.name}
                        />
                    )}
                    
                    <CardContent sx={{ p: 3 }}>
                        {/* Mixlist Name and Item Count */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                                {mixlist.Name || mixlist.name}
                            </Typography>
                            <Chip 
                                label={`${(mixlist.MediaItems || mixlist.mediaItems || []).length} items`}
                                sx={{ 
                                    backgroundColor: 'primary.main', 
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Box>

                        {/* Description */}
                        {(mixlist.Description || mixlist.description) && (
                            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                                {mixlist.Description || mixlist.description}
                            </Typography>
                        )}

                        {/* Collapsible Media List */}
                        <Box>
                            <Button
                                onClick={() => setMediaListExpanded(!mediaListExpanded)}
                                startIcon={mediaListExpanded ? <ExpandLess /> : <ExpandMore />}
                                sx={{ 
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    mb: 2
                                }}
                            >
                                Media Items ({(mixlist.MediaItems || mixlist.mediaItems || []).length})
                            </Button>
                            
                            <Collapse in={mediaListExpanded}>
                                <Box sx={{ pl: 2 }}>
                                    {(mixlist.MediaItems || mixlist.mediaItems || []).length > 0 ? (
                                        (mixlist.MediaItems || mixlist.mediaItems || []).map((mediaItem, index) => (
                                            <Paper key={mediaItem.id || mediaItem.Id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {index + 1}.
                                                    </Typography>
                                                    <Link
                                                        component="button"
                                                        variant="body1"
                                                        onClick={() => navigate(`/media/${mediaItem.id || mediaItem.Id}`)}
                                                        sx={{ 
                                                            textDecoration: 'none',
                                                            fontWeight: 'medium',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        {mediaItem.title || mediaItem.Title}
                                                    </Link>
                                                    <Chip
                                                        label={mediaItem.mediaType || mediaItem.MediaType}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getMediaTypeColor(mediaItem.mediaType || mediaItem.MediaType),
                                                            color: 'white',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleRemoveMedia(mediaItem.id || mediaItem.Id)}
                                                    size="small"
                                                    color="error"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Paper>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                            No media items in this mixlist yet.
                                        </Typography>
                                    )}
                                </Box>
                            </Collapse>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Media Carousel */}
            {(mixlist.MediaItems || mixlist.mediaItems || []).length > 0 && (
                <Box sx={{ px: 3, mb: 4 }}>
                    <MediaCarousel
                        mediaItems={(mixlist.MediaItems || mixlist.mediaItems || []).map(item => ({
                            ...item,
                            thumbnailUrl: item.thumbnail || item.Thumbnail
                        }))}
                        title="Browse Media"
                        subtitle="Click on any item to view details below"
                        variant="coverflow"
                        autoplay={false}
                        onMediaClick={handleMediaCarouselClick}
                        showNavigation={true}
                        showPagination={true}
                    />
                </Box>
            )}

            {/* Selected Media Profile */}
            {selectedMedia && (
                <Box sx={{ px: 3, mb: 4 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Card sx={{ overflow: 'hidden' }}>
                        {(selectedMedia.thumbnail || selectedMedia.Thumbnail) && (
                            <CardMedia
                                component="img"
                                sx={{
                                    width: '100%',
                                    height: 200,
                                    objectFit: 'cover'
                                }}
                                image={selectedMedia.thumbnail || selectedMedia.Thumbnail}
                                alt={selectedMedia.title || selectedMedia.Title}
                            />
                        )}
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold', flex: 1 }}>
                                    {selectedMedia.title || selectedMedia.Title}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<OpenInNew />}
                                    onClick={() => navigate(`/media/${selectedMedia.id || selectedMedia.Id}`)}
                                    sx={{ ml: 2 }}
                                >
                                    View Full Profile
                                </Button>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                <Chip
                                    label={selectedMedia.mediaType || selectedMedia.MediaType}
                                    sx={{
                                        backgroundColor: getMediaTypeColor(selectedMedia.mediaType || selectedMedia.MediaType),
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                />
                                {(selectedMedia.status || selectedMedia.Status) && (
                                    <Chip
                                        label={selectedMedia.status || selectedMedia.Status}
                                        sx={{
                                            backgroundColor: getStatusColor(selectedMedia.status || selectedMedia.Status),
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                )}
                            </Box>

                            {selectedMedia.description && (
                                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                                    {selectedMedia.description}
                                </Typography>
                            )}

                            {selectedMedia.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                    <strong>Notes:</strong> {selectedMedia.notes}
                                </Typography>
                            )}

                            {selectedMedia.link && (
                                <Box sx={{ mt: 2 }}>
                                    <Link 
                                        href={selectedMedia.link.startsWith('http') ? selectedMedia.link : `https://${selectedMedia.link}`}
                                        target="_blank" 
                                        rel="noopener"
                                        sx={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: 1,
                                            color: 'primary.main',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        View Source <OpenInNew fontSize="small" />
                                    </Link>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Empty State */}
            {(!mixlist.MediaItems || mixlist.MediaItems.length === 0) && (
                <Box sx={{ textAlign: 'center', mt: 8, px: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2, color: '#888' }}>
                        No media items in this mixlist
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
                        Add some media items to get started!
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={() => navigate('/add-media')}
                        sx={{ fontSize: '16px', px: 4, py: 1.5 }}
                    >
                        Add Media
                    </Button>
                </Box>
            )}

            {/* Floating Action Button to add media */}
            <Fab 
                color="primary" 
                aria-label="add media to mixlist"
                sx={{ 
                    position: 'fixed', 
                    bottom: 32, 
                    right: 32,
                    zIndex: 1000
                }}
                onClick={() => navigate('/add-media')}
            >
                <Add />
            </Fab>
        </Box>
    );
}

export default MixlistDetailPage;
