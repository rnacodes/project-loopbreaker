import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, IconButton, Grid, CircularProgress, Alert,
    Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, ListItemButton
} from '@mui/material';
import {
    ArrowBack, Edit, OpenInNew, Sync, Delete,
    PlaylistAdd, Podcasts, ExpandMore, Notifications, NotificationsOff
} from '@mui/icons-material';
import {
    getPodcastSeriesById,
    getEpisodesBySeriesId,
    syncPodcastSeriesEpisodes,
    subscribeToPodcastSeries,
    unsubscribeFromPodcastSeries,
    deletePodcastSeries,
    getAllMixlists,
    addMediaToMixlist
} from '../services/apiService';

function PodcastSeriesProfile() {
    const [series, setSeries] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [availableMixlists, setAvailableMixlists] = useState([]);
    const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSeriesData();
        fetchMixlists();
    }, [id]);

    const fetchSeriesData = async () => {
        try {
            setLoading(true);
            const [seriesResponse, episodesResponse] = await Promise.all([
                getPodcastSeriesById(id),
                getEpisodesBySeriesId(id)
            ]);

            setSeries(seriesResponse.data);
            
            // Sort episodes by episode number (descending - newest first) or release date
            const sortedEpisodes = (episodesResponse.data || []).sort((a, b) => {
                // Try to sort by episode number first
                if (a.episodeNumber && b.episodeNumber) {
                    return b.episodeNumber - a.episodeNumber;
                }
                // Fall back to release date
                if (a.releaseDate && b.releaseDate) {
                    return new Date(b.releaseDate) - new Date(a.releaseDate);
                }
                // Fall back to date added
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            });
            
            setEpisodes(sortedEpisodes);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching podcast series:', error);
            setSnackbar({ open: true, message: 'Failed to load podcast series', severity: 'error' });
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

    const handleSync = async () => {
        try {
            setSyncing(true);
            const response = await syncPodcastSeriesEpisodes(id);
            
            setSnackbar({ 
                open: true, 
                message: `Synced! ${response.data.newEpisodesCount || 0} new episodes found.`, 
                severity: 'success' 
            });
            
            // Refresh data
            await fetchSeriesData();
            setSyncing(false);
        } catch (error) {
            console.error('Error syncing episodes:', error);
            setSnackbar({ open: true, message: 'Failed to sync episodes', severity: 'error' });
            setSyncing(false);
        }
    };

    const handleSubscribe = async () => {
        try {
            if (series.isSubscribed) {
                await unsubscribeFromPodcastSeries(id);
                setSeries({ ...series, isSubscribed: false });
                setSnackbar({ open: true, message: 'Unsubscribed from podcast', severity: 'info' });
            } else {
                await subscribeToPodcastSeries(id);
                setSeries({ ...series, isSubscribed: true });
                setSnackbar({ open: true, message: 'Subscribed to podcast!', severity: 'success' });
            }
        } catch (error) {
            console.error('Error toggling subscription:', error);
            setSnackbar({ open: true, message: 'Failed to update subscription', severity: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            await deletePodcastSeries(id);
            setSnackbar({ open: true, message: 'Podcast series deleted', severity: 'success' });
            setTimeout(() => navigate('/all-media?mediaType=Podcast'), 1500);
        } catch (error) {
            console.error('Error deleting series:', error);
            setSnackbar({ open: true, message: 'Failed to delete podcast series', severity: 'error' });
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

    const getEpisodeIdentifier = (episode) => {
        if (episode.seasonNumber && episode.episodeNumber) {
            return `S${episode.seasonNumber}E${episode.episodeNumber}`;
        } else if (episode.episodeNumber) {
            return `Episode ${episode.episodeNumber}`;
        }
        return '';
    };

    const getStatusColor = (status) => {
        const statusColors = {
            0: '#9e9e9e', // Uncharted - gray
            1: '#2196f3', // InProgress - blue
            2: '#4caf50', // Completed - green
            3: '#ff9800', // OnHold - orange
            4: '#f44336', // Dropped - red
            5: '#9c27b0'  // PlanTo - purple
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

    if (!series) {
        return (
            <Box p={3}>
                <Alert severity="error">Podcast series not found</Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => navigate('/all-media?mediaType=Podcast')} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4">Podcast Series</Typography>
            </Box>

            {/* Series Details Card */}
            <Card sx={{ mb: 3 }}>
                <Grid container>
                    <Grid item xs={12} md={4}>
                        {series.thumbnail && (
                            <Box sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '150%', // 2:3 aspect ratio for podcasts
                                overflow: 'hidden',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }}>
                                <CardMedia
                                    component="img"
                                    image={series.thumbnail}
                                    alt={series.title}
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
                        <CardContent>
                            <Typography variant="h5" gutterBottom>{series.title}</Typography>
                            
                            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                <Chip label="Podcast Series" icon={<Podcasts />} color="primary" />
                                {series.isSubscribed && (
                                    <Chip 
                                        label="Subscribed" 
                                        icon={<Notifications />} 
                                        color="success" 
                                        size="small"
                                    />
                                )}
                                {series.totalEpisodes > 0 && (
                                    <Chip label={`${series.totalEpisodes} episodes`} size="small" />
                                )}
                                {series.status !== undefined && (
                                    <Chip 
                                        label={getStatusText(series.status)} 
                                        sx={{ backgroundColor: getStatusColor(series.status), color: 'white' }}
                                        size="small"
                                    />
                                )}
                            </Box>

                            {series.publisher && (
                                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                    <strong>Publisher:</strong> {series.publisher}
                                </Typography>
                            )}

                            <Typography variant="body1" color="text.secondary" paragraph>
                                {series.description || 'No description available.'}
                            </Typography>

                            {/* Action Buttons */}
                            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                {series.link && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<OpenInNew />}
                                        href={series.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View on ListenNotes
                                    </Button>
                                )}
                                <Button
                                    variant={series.isSubscribed ? "outlined" : "contained"}
                                    size="small"
                                    startIcon={series.isSubscribed ? <NotificationsOff /> : <Notifications />}
                                    onClick={handleSubscribe}
                                    color={series.isSubscribed ? "inherit" : "primary"}
                                >
                                    {series.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Sync />}
                                    onClick={handleSync}
                                    disabled={syncing}
                                >
                                    {syncing ? <CircularProgress size={20} /> : 'Sync Episodes'}
                                </Button>
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
                                Added: {new Date(series.dateAdded).toLocaleDateString()}
                                {series.lastSyncDate && ` | Last Synced: ${new Date(series.lastSyncDate).toLocaleDateString()}`}
                            </Typography>
                        </CardContent>
                    </Grid>
                </Grid>
            </Card>

            {/* Episodes Section */}
            <Accordion defaultExpanded sx={{ mt: 3 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Episodes ({episodes.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {episodes.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No episodes found. Click "Sync Episodes" to fetch from ListenNotes.
                        </Typography>
                    ) : (
                        <List>
                            {episodes.map((episode, index) => (
                                <React.Fragment key={episode.id}>
                                    <ListItemButton
                                        onClick={() => navigate(`/podcast-episode/${episode.id}`)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 1,
                                            '&:hover': {
                                                backgroundColor: 'action.hover'
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box display="flex" alignItems="center" gap={2} flex={1}>
                                                    {getEpisodeIdentifier(episode) && (
                                                        <Chip 
                                                            label={getEpisodeIdentifier(episode)} 
                                                            size="small" 
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                        {episode.title}
                                                    </Typography>
                                                </Box>
                                                {episode.status !== undefined && (
                                                    <Chip 
                                                        label={getStatusText(episode.status)} 
                                                        size="small"
                                                        sx={{ 
                                                            backgroundColor: getStatusColor(episode.status), 
                                                            color: 'white',
                                                            ml: 1
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Box display="flex" gap={2} mt={1}>
                                                {episode.durationInSeconds > 0 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Duration: {formatDuration(episode.durationInSeconds)}
                                                    </Typography>
                                                )}
                                                {episode.releaseDate && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Released: {new Date(episode.releaseDate).toLocaleDateString()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </ListItemButton>
                                    {index < episodes.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Add to Mixlist Dialog */}
            <Dialog open={addToMixlistDialog} onClose={() => setAddToMixlistDialog(false)}>
                <DialogTitle>Add Podcast Series to Mixlist</DialogTitle>
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
                <DialogTitle>Delete Podcast Series?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{series.title}"? This will also delete all episodes.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
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
    );
}

export default PodcastSeriesProfile;

