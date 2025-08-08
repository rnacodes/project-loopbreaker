import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Grid, Fab
} from '@mui/material';
import { Add } from '@mui/icons-material';
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
                    {mixlists.map((mixlist) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={mixlist.id}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                    }
                                }}
                                onClick={() => navigate(`/mixlist/${mixlist.id}`)}
                            >
                                {mixlist.Thumbnail && (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={mixlist.Thumbnail}
                                        alt={mixlist.Name}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}
                                <CardContent>
                                    <Typography variant="h6" component="h2" sx={{ 
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}>
                                        {mixlist.Name}
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                        mt: 1,
                                        textAlign: 'center',
                                        color: '#888'
                                    }}>
                                        {mixlist.MediaItems ? mixlist.MediaItems.length : 0} item{(mixlist.MediaItems ? mixlist.MediaItems.length : 0) !== 1 ? 's' : ''}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
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
