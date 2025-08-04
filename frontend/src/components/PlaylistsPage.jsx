import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Grid, Fab
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { getAllPlaylists } from '../services/apiService';

function PlaylistsPage() {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadPlaylists = async () => {
            try {
                const response = await getAllPlaylists();
                setPlaylists(response.data);
            } catch (error) {
                console.error('Error loading playlists:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPlaylists();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography variant="h6">Loading playlists...</Typography>
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
                My Playlists
            </Typography>

            {playlists.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 8 }}>
                    <Typography variant="h5" sx={{ mb: 2, color: '#888' }}>
                        No playlists yet
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
                        Create your first playlist to organize your media!
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={() => navigate('/create-playlist')}
                        sx={{ fontSize: '16px', px: 4, py: 1.5 }}
                    >
                        Create First Playlist
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {playlists.map((playlist) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={playlist.id}>
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
                                onClick={() => navigate(`/playlist/${playlist.id}`)}
                            >
                                {playlist.thumbnail && (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={playlist.thumbnail}
                                        alt={playlist.name}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                )}
                                <CardContent>
                                    <Typography variant="h6" component="h2" sx={{ 
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}>
                                        {playlist.name}
                                    </Typography>
                                    {playlist.mediaItems && (
                                        <Typography variant="body2" sx={{ 
                                            mt: 1,
                                            textAlign: 'center',
                                            color: '#888'
                                        }}>
                                            {playlist.mediaItems.length} item{playlist.mediaItems.length !== 1 ? 's' : ''}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Floating Action Button to create new playlist */}
            <Fab 
                color="primary" 
                aria-label="create playlist"
                sx={{ 
                    position: 'fixed', 
                    bottom: 32, 
                    right: 32,
                    zIndex: 1000
                }}
                onClick={() => navigate('/create-playlist')}
            >
                <Add />
            </Fab>
        </Box>
    );
}

export default PlaylistsPage;
