import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Grid, Fab, Chip, IconButton
} from '@mui/material';
import { Add, ArrowBack, Delete } from '@mui/icons-material';
import { getMixlistById, removeMediaFromMixlist } from '../services/apiService';

function MixlistDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mixlist, setMixlist] = useState(null);
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            console.error('Error removing media from mixlist:', error);
        }
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
        <Box sx={{ p: 3, minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <IconButton onClick={() => navigate('/mixlists')} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="h3" component="h1" sx={{ 
                        fontSize: '32px',
                        fontWeight: 'bold'
                    }}>
                        {mixlist.Name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#888', mt: 1 }}>
                        {mixlist.MediaItems ? mixlist.MediaItems.length : 0} items
                    </Typography>
                </Box>
            </Box>

            {/* Mixlist Thumbnail */}
            {mixlist.Thumbnail && (
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <img 
                        src={mixlist.Thumbnail} 
                        alt={mixlist.Name}
                        style={{ 
                            maxWidth: '300px', 
                            maxHeight: '200px', 
                            borderRadius: '8px',
                            objectFit: 'cover'
                        }}
                    />
                </Box>
            )}

                {/* Media Items */}
            {mixlist.MediaItems && mixlist.MediaItems.length > 0 ? (
                <Box>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                        Media Items ({mixlist.MediaItems.length})
                    </Typography>
                    <Grid container spacing={3}>
                        {mixlist.MediaItems.map((mediaItem) => (
                            <Grid item xs={12} sm={6} md={4} key={mediaItem.id}>
                                <Card>
                                    {mediaItem.thumbnail && (
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={mediaItem.thumbnail}
                                            alt={mediaItem.title}
                                        />
                                    )}
                                    <CardContent>
                                        <Typography variant="h6" component="h3" noWrap>
                                            {mediaItem.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {mediaItem.mediaType}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            startIcon={<Delete />}
                                            onClick={() => handleRemoveMedia(mediaItem.id)}
                                        >
                                            Remove
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', mt: 8 }}>
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
