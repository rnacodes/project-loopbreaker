import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Button, Grid, Card, CardContent, CardMedia,
    Box, CircularProgress, Chip, Fab
} from '@mui/material';
import { Add, FileDownload, Upload } from '@mui/icons-material';
import { getAllMixlists } from '../services/apiService';

function MixlistsPage() {
    const [mixlists, setMixlists] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadMixlists = async () => {
            try {
                console.log('Attempting to load mixlists...');
                const response = await getAllMixlists();
                console.log('Mixlists response:', response);
                console.log('Mixlists data:', response.data);
                // Use the actual mixlists from the main endpoint
                setMixlists(response.data);
            } catch (error) {
                console.error('Error loading mixlists:', error);
                console.error('Error details:', error.response?.data);
                console.error('Error status:', error.response?.status);
            } finally {
                setLoading(false);
            }
        };
        loadMixlists();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography variant="h6">Loading mixlists...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, minHeight: '100vh' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ 
                fontSize: '32px',
                fontWeight: 'bold',
                mb: 4,
                textAlign: 'center'
            }}>
                My Mixlists
            </Typography>

            {/* Import/Export Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => navigate('/import-mixlist')}
                    sx={{ px: 3, py: 1.5 }}
                >
                    Import Mixlist
                </Button>

                {/*}
                <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={() => window.open('/api/mixlist/export', '_blank')}
                    sx={{ px: 3, py: 1.5 }}
                >
                    Export All Mixlists
                </Button> */}
            </Box>

            {mixlists.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Typography variant="h5" sx={{ mb: 2, color: '#888' }}>
                        No mixlists yet
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
                        Create your first mixlist to organize your media!
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={() => navigate('/create-mixlist')}
                        sx={{ fontSize: '16px', px: 4, py: 1.5 }}
                    >
                        Create First Mixlist
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {mixlists.map((mixlist) => {
                        // Handle both possible property names
                        const id = mixlist.id || mixlist.Id;
                        const name = mixlist.Name || mixlist.name || 'Unnamed Mixlist';
                        const thumbnail = mixlist.Thumbnail || mixlist.thumbnail;
                        const description = mixlist.Description || mixlist.description;
                        const mediaCount = mixlist.MediaItems ? mixlist.MediaItems.length : (mixlist.mediaItems ? mixlist.mediaItems.length : 0);
                        
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={id}>
                                <Card 
                                    sx={{ 
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                        }
                                    }}
                                    onClick={() => navigate(`/mixlist/${id}`)}
                                >
                                    {thumbnail && (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={thumbnail}
                                            alt={name}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                    )}
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Typography variant="h6" component="h2" sx={{ 
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            mb: 1
                                        }}>
                                            {name}
                                        </Typography>
                                        
                                        {description && (
                                            <Typography variant="body2" sx={{ 
                                                mb: 2,
                                                color: 'text.secondary',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                lineHeight: 1.4
                                            }}>
                                                {description}
                                            </Typography>
                                        )}
                                        
                                        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                                            <Typography variant="body2" sx={{ 
                                                color: '#888',
                                                fontWeight: 'medium',
                                                backgroundColor: 'rgba(0,0,0,0.1)',
                                                px: 2,
                                                py: 0.5,
                                                borderRadius: 1
                                            }}>
                                                {mediaCount} item{mediaCount !== 1 ? 's' : ''}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Floating Action Button to create new mixlist */}
            <Fab 
                color="primary" 
                aria-label="create mixlist"
                sx={{ 
                    position: 'fixed', 
                    bottom: 32, 
                    right: 32,
                    zIndex: 1000
                }}
                onClick={() => navigate('/create-mixlist')}
            >
                <Add />
            </Fab>
        </Box>
    );
}

export default MixlistsPage;
