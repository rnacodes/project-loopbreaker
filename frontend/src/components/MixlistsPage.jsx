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
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '50vh',
                gap: 2,
                px: { xs: 2, sm: 3 }
            }}>
                <CircularProgress size={60} />
                <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                    Loading mixlists...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '100vh' }}>
            <Typography 
                variant="h3" 
                component="h1" 
                gutterBottom 
                sx={{ 
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2rem' },
                    fontWeight: 'bold',
                    mb: { xs: 3, sm: 4 },
                    textAlign: 'center'
                }}
            >
                My Mixlists
            </Typography>

            {/* Import/Export Actions */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center', 
                gap: 2, 
                mb: { xs: 3, sm: 4 },
                px: { xs: 1, sm: 0 }
            }}>
                <Button 
                    variant="outlined"
                    onClick={() => navigate('/import-mixlist')}
                    sx={{ 
                        px: { xs: 2, sm: 3 }, 
                        py: { xs: 1, sm: 1.5 },
                        width: { xs: '100%', sm: 'auto' },
                        minHeight: '48px',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        color: 'white',
                        borderColor: 'white',
                        '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                    }}
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
                <Box sx={{ textAlign: 'center', mt: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 0 } }}>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            mb: 2, 
                            color: '#888',
                            fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }}
                    >
                        No mixlists yet
                    </Typography>
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            mb: { xs: 3, sm: 4 }, 
                            color: '#666',
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                    >
                        Create your first mixlist to organize your media!
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={() => navigate('/create-mixlist')}
                        sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' }, 
                            px: { xs: 3, sm: 4 }, 
                            py: 1.5,
                            minHeight: '48px',
                            width: { xs: '100%', sm: 'auto' },
                            maxWidth: { xs: '400px', sm: 'none' }
                        }}
                    >
                        Create First Mixlist
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
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
                                            transform: { xs: 'none', sm: 'translateY(-4px)' },
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                        },
                                        '&:active': {
                                            transform: 'scale(0.98)'
                                        }
                                    }}
                                    onClick={() => navigate(`/mixlist/${id}`)}
                                >
                                    {thumbnail && (
                                        <CardMedia
                                            component="img"
                                            sx={{ 
                                                height: { xs: 160, sm: 180, md: 200 },
                                                objectFit: 'cover'
                                            }}
                                            image={thumbnail}
                                            alt={name}
                                        />
                                    )}
                                    <CardContent sx={{ 
                                        flexGrow: 1, 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        p: { xs: 2, sm: 2 }
                                    }}>
                                        <Typography variant="h6" component="h2" sx={{ 
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.125rem' },
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
                                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
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
                                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                backgroundColor: 'rgba(0,0,0,0.1)',
                                                px: { xs: 1.5, sm: 2 },
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
                    bottom: { xs: 16, sm: 24, md: 32 }, 
                    right: { xs: 16, sm: 24, md: 32 },
                    width: { xs: 56, sm: 56 },
                    height: { xs: 56, sm: 56 },
                    zIndex: 1000
                }}
                onClick={() => navigate('/create-mixlist')}
            >
                <Add sx={{ fontSize: { xs: 24, sm: 28 } }} />
            </Fab>
        </Box>
    );
}

export default MixlistsPage;
