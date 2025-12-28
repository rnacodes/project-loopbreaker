import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, IconButton, Grid, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
    Snackbar, Paper
} from '@mui/material';
import {
    ArrowBack, Edit, OpenInNew, Delete, PlaylistAdd,
    PlayArrow, Podcasts, NavigateBefore, NavigateNext, Headset
} from '@mui/icons-material';
import {
    getPodcastEpisodeById,
    getPodcastSeriesById,
    getEpisodesBySeriesId,
    deletePodcastEpisode,
    getAllMixlists,
    addMediaToMixlist
} from '../services/apiService';

function PodcastEpisodeProfile() {
    const [episode, setEpisode] = useState(null);
    const [series, setSeries] = useState(null);
    const [allEpisodes, setAllEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableMixlists, setAvailableMixlists] = useState([]);
    const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchEpisodeData();
        fetchMixlists();
    }, [id]);

    const fetchEpisodeData = async () => {
        try {
            setLoading(true);
            const episodeResponse = await getPodcastEpisodeById(id);
            const episodeData = episodeResponse.data;
            setEpisode(episodeData);

            // Fetch parent series data
            if (episodeData.seriesId) {
                const [seriesResponse, episodesResponse] = await Promise.all([
                    getPodcastSeriesById(episodeData.seriesId),
                    getEpisodesBySeriesId(episodeData.seriesId)
                ]);
                
                setSeries(seriesResponse.data);
                
                // Sort episodes for navigation
                const sortedEpisodes = (episodesResponse.data || []).sort((a, b) => {
                    if (a.episodeNumber && b.episodeNumber) {
                        return a.episodeNumber - b.episodeNumber;
                    }
                    if (a.releaseDate && b.releaseDate) {
                        return new Date(a.releaseDate) - new Date(b.releaseDate);
                    }
                    return new Date(a.dateAdded) - new Date(b.dateAdded);
                });
                
                setAllEpisodes(sortedEpisodes);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching episode:', error);
            setSnackbar({ open: true, message: 'Failed to load episode', severity: 'error' });
            setLoading(false);
        }
    };

    const fetchMixlists = async () => {
        try {
            const response = await getAllMixlists();
            setAvailableMixlists(response.data || []);
        } catch (error) {
            console.error('Error fetching mixlists:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePodcastEpisode(id);
            setSnackbar({ open: true, message: 'Episode deleted', severity: 'success' });
            setTimeout(() => {
                if (series) {
                    navigate(`/podcast-series/${series.id}`);
                } else {
                    navigate('/all-media?mediaType=Podcast');
                }
            }, 1500);
        } catch (error) {
            console.error('Error deleting episode:', error);
            setSnackbar({ open: true, message: 'Failed to delete episode', severity: 'error' });
        }
        setDeleteConfirmDialog(false);
    };

    const handleAddToMixlist = async (mixlistId) => {
        try {
            await addMediaToMixlist(mixlistId, id);
            setSnackbar({ open: true, message: 'Added to mixlist!', severity: 'success' });
            setAddToMixlistDialog(false);
        } catch (error) {
            console.error('Error adding to mixlist:', error);
            setSnackbar({ open: true, message: 'Failed to add to mixlist', severity: 'error' });
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };


    const getCurrentEpisodeIndex = () => {
        return allEpisodes.findIndex(ep => ep.id === id);
    };

    const getPreviousEpisode = () => {
        const currentIndex = getCurrentEpisodeIndex();
        if (currentIndex > 0) {
            return allEpisodes[currentIndex - 1];
        }
        return null;
    };

    const getNextEpisode = () => {
        const currentIndex = getCurrentEpisodeIndex();
        if (currentIndex >= 0 && currentIndex < allEpisodes.length - 1) {
            return allEpisodes[currentIndex + 1];
        }
        return null;
    };

    const getStatusColor = (status) => {
        const statusColors = {
            0: '#9e9e9e', // Uncharted
            1: '#2196f3', // InProgress
            2: '#4caf50', // Completed
            3: '#ff9800', // OnHold
            4: '#f44336', // Dropped
            5: '#9c27b0'  // PlanTo
        };
        return statusColors[status] || '#9e9e9e';
    };

    const getStatusText = (status) => {
        const statusText = {
            0: 'Uncharted',
            1: 'In Progress',
            2: 'Completed',
            3: 'On Hold',
            4: 'Dropped',
            5: 'Plan To'
        };
        return statusText[status] || 'Unknown';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!episode) {
        return (
            <Box p={3}>
                <Alert severity="error">Episode not found</Alert>
            </Box>
        );
    }

    const previousEpisode = getPreviousEpisode();
    const nextEpisode = getNextEpisode();
    const currentIndex = getCurrentEpisodeIndex();
    const effectiveThumbnail = episode.thumbnail || series?.thumbnail;

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            py: { xs: 2, sm: 4 },
            px: { xs: 1, sm: 2 }
        }}>
            <Box sx={{ 
                width: '100%',
                maxWidth: '900px',
                backgroundColor: 'background.paper',
                borderRadius: { xs: '8px', sm: '16px' },
                p: { xs: 2, sm: 3, md: 4 },
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton 
                        onClick={() => series ? navigate(`/podcast-series/${series.id}`) : navigate('/all-media?mediaType=Podcast')} 
                        sx={{ mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography 
                        variant="h4"
                        onClick={() => navigate('/search?mediaType=Podcast')}
                        sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        Podcast Episode
                    </Typography>
                </Box>

                {/* Episode Details Card */}
                <Card sx={{ overflow: 'hidden', borderRadius: 2, mb: 3 }}>
                    <Grid container>
                        <Grid item xs={12} md={4}>
                            {effectiveThumbnail && (
                                <Box sx={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingTop: '150%', // 2:3 aspect ratio
                                    overflow: 'hidden',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                }}>
                                    <CardMedia
                                        component="img"
                                        image={effectiveThumbnail}
                                        alt={episode.title}
                                        crossOrigin="anonymous"
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Box>
                            )}
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                                <Typography variant="h5" gutterBottom>{episode.title}</Typography>
                                
                                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                    <Chip label="Podcast Episode" icon={<Headset />} color="secondary" size="small" />
                                    {episode.status !== undefined && (
                                        <Chip 
                                            label={getStatusText(episode.status)} 
                                            sx={{ backgroundColor: getStatusColor(episode.status), color: 'white' }}
                                            size="small"
                                        />
                                    )}
                                    {currentIndex >= 0 && allEpisodes.length > 0 && (
                                        <Chip 
                                            label={`${currentIndex + 1} of ${allEpisodes.length}`} 
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>

                                {series && (
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        <strong>From:</strong>{' '}
                                        <Button 
                                            onClick={() => navigate(`/podcast-series/${series.id}`)}
                                            sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                                        >
                                            {series.title}
                                        </Button>
                                    </Typography>
                                )}

                                {episode.publisher && (
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        <strong>Publisher:</strong> {episode.publisher}
                                    </Typography>
                                )}

                                <Box display="flex" gap={2} mb={2}>
                                    {episode.durationInSeconds > 0 && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Duration:</strong> {formatDuration(episode.durationInSeconds)}
                                        </Typography>
                                    )}
                                    {episode.releaseDate && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>Released:</strong> {new Date(episode.releaseDate).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>

                                <Typography variant="body1" color="text.secondary" paragraph>
                                    {episode.description || 'No description available.'}
                                </Typography>

                                {/* Action Buttons */}
                                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                    {episode.audioLink && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<PlayArrow />}
                                            href={episode.audioLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            color="primary"
                                        >
                                            Play Audio
                                        </Button>
                                    )}
                                    {episode.link && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<OpenInNew />}
                                            href={episode.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open in ListenNotes
                                        </Button>
                                    )}
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<PlaylistAdd />}
                                        onClick={() => setAddToMixlistDialog(true)}
                                    >
                                        Add to Mixlist
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        startIcon={<Delete />}
                                        onClick={() => setDeleteConfirmDialog(true)}
                                    >
                                        Delete
                                    </Button>
                                </Box>

                                <Divider sx={{ my: 2 }} />
                                
                                <Typography variant="caption" color="text.secondary">
                                    Added: {new Date(episode.dateAdded).toLocaleDateString()}
                                </Typography>
                            </CardContent>
                        </Grid>
                    </Grid>
                </Card>

                {/* Parent Series Card */}
                {series && (
                    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <Podcasts sx={{ verticalAlign: 'middle', mr: 1 }} />
                            Parent Series
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                {series.thumbnail && (
                                    <CardMedia
                                        component="img"
                                        image={series.thumbnail}
                                        alt={series.title}
                                        crossOrigin="anonymous"
                                        sx={{ 
                                            borderRadius: 1,
                                            maxWidth: '100%',
                                            height: 'auto'
                                        }}
                                    />
                                )}
                            </Grid>
                            <Grid item xs={12} sm={9}>
                                <Typography variant="h6">{series.title}</Typography>
                                {series.publisher && (
                                    <Typography variant="body2" color="text.secondary">
                                        {series.publisher}
                                    </Typography>
                                )}
                                {series.totalEpisodes > 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        {series.totalEpisodes} episodes
                                    </Typography>
                                )}
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => navigate(`/podcast-series/${series.id}`)}
                                    sx={{ mt: 2 }}
                                >
                                    View Full Series →
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {/* Episode Navigation */}
                {allEpisodes.length > 1 && (
                    <Box display="flex" justifyContent="space-between" gap={2} mb={3}>
                        <Button
                            variant="outlined"
                            startIcon={<NavigateBefore />}
                            onClick={() => previousEpisode && navigate(`/podcast-episode/${previousEpisode.id}`)}
                            disabled={!previousEpisode}
                            sx={{ flex: 1 }}
                        >
                            Previous Episode
                        </Button>
                        <Button
                            variant="outlined"
                            endIcon={<NavigateNext />}
                            onClick={() => nextEpisode && navigate(`/podcast-episode/${nextEpisode.id}`)}
                            disabled={!nextEpisode}
                            sx={{ flex: 1 }}
                        >
                            Next Episode
                        </Button>
                    </Box>
                )}

                {/* Add to Mixlist Dialog */}
                <Dialog open={addToMixlistDialog} onClose={() => setAddToMixlistDialog(false)}>
                    <DialogTitle>Add Episode to Mixlist</DialogTitle>
                    <DialogContent>
                        {availableMixlists.length === 0 ? (
                            <Typography>No mixlists available. Create one first!</Typography>
                        ) : (
                            <List>
                                {availableMixlists.map((mixlist) => (
                                    <ListItem 
                                        button 
                                        key={mixlist.id} 
                                        onClick={() => handleAddToMixlist(mixlist.id)}
                                    >
                                        <ListItemText primary={mixlist.name} />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAddToMixlistDialog(false)}>Cancel</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
                    <DialogTitle>Delete Episode?</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete "{episode.title}"?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
                        <Button onClick={handleDelete} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={6000} 
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert 
                        onClose={() => setSnackbar({ ...snackbar, open: false })} 
                        severity={snackbar.severity} 
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
}

export default PodcastEpisodeProfile;

