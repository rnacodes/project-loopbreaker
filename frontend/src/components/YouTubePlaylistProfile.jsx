import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, Paper, Link, IconButton, Grid,
    CircularProgress, Alert, Accordion, AccordionSummary, AccordionDetails,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Snackbar
} from '@mui/material';
import {
    ArrowBack, Edit, OpenInNew, Sync, Delete,
    PlaylistAdd, YouTube, ExpandMore, PlayArrow
} from '@mui/icons-material';
import {
    getYouTubePlaylistById,
    getYouTubePlaylistVideos,
    deleteYouTubePlaylist,
    syncYouTubePlaylist,
    getAllMixlists,
    addMediaToMixlist,
    removeMediaFromMixlist
} from '../services/apiService';

function YouTubePlaylistProfile() {
    const [playlist, setPlaylist] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [availableMixlists, setAvailableMixlists] = useState([]);
    const [currentMixlists, setCurrentMixlists] = useState([]);
    const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [videosExpanded, setVideosExpanded] = useState(true);
    
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPlaylistData();
        fetchMixlists();
    }, [id]);

    const fetchPlaylistData = async () => {
        try {
            setLoading(true);
            const playlistData = await getYouTubePlaylistById(id, true);
            setPlaylist(playlistData);
            
            // Extract videos from the playlist response or fetch separately
            if (playlistData.videos && playlistData.videos.length > 0) {
                setVideos(playlistData.videos);
            } else {
                const playlistVideos = await getYouTubePlaylistVideos(id);
                setVideos(playlistVideos);
            }
        } catch (error) {
            console.error('Error fetching playlist data:', error);
            setSnackbar({ open: true, message: 'Failed to load playlist', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMixlists = async () => {
        try {
            const mixlists = await getAllMixlists();
            setAvailableMixlists(mixlists.data || []);
        } catch (error) {
            console.error('Error fetching mixlists:', error);
            setAvailableMixlists([]);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await syncYouTubePlaylist(id);
            await fetchPlaylistData();
            setSnackbar({ open: true, message: 'Playlist synced successfully', severity: 'success' });
        } catch (error) {
            console.error('Error syncing playlist:', error);
            setSnackbar({ open: true, message: 'Failed to sync playlist', severity: 'error' });
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this playlist? Videos will remain in the database.')) {
            try {
                await deleteYouTubePlaylist(id);
                setSnackbar({ open: true, message: 'Playlist deleted successfully', severity: 'success' });
                setTimeout(() => navigate('/all-media?mediaType=Playlist'), 1500);
            } catch (error) {
                console.error('Error deleting playlist:', error);
                setSnackbar({ open: true, message: 'Failed to delete playlist', severity: 'error' });
            }
        }
    };

    const handleAddToMixlist = async (mixlistId) => {
        try {
            await addMediaToMixlist(mixlistId, id);
            await fetchPlaylistData();
            setSnackbar({ open: true, message: 'Added to mixlist', severity: 'success' });
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!playlist) {
        return (
            <Box p={3}>
                <Alert severity="error">Playlist not found</Alert>
                <Button onClick={() => navigate('/all-media')} sx={{ mt: 2 }}>
                    Back to Media
                </Button>
            </Box>
        );
    }

    return (
        <Box p={3}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4">YouTube Playlist</Typography>
            </Box>

            {/* Playlist Card */}
            <Card sx={{ mb: 3 }}>
                <Grid container>
                    <Grid item xs={12} md={3}>
                        {playlist.thumbnail && (
                            <CardMedia
                                component="img"
                                image={playlist.thumbnail}
                                alt={playlist.title}
                                crossOrigin="anonymous"
                                sx={{ 
                                    height: { xs: 200, md: '100%' }, 
                                    objectFit: 'contain',
                                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                                }}
                            />
                        )}
                    </Grid>
                    <Grid item xs={12} md={9}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {playlist.title}
                            </Typography>
                            
                            {/* Metadata Chips */}
                            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                <Chip 
                                    icon={<YouTube />} 
                                    label="YouTube Playlist" 
                                    color="error" 
                                    size="small"
                                />
                                {playlist.videoCount !== null && playlist.videoCount !== undefined && (
                                    <Chip 
                                        icon={<PlayArrow />}
                                        label={`${playlist.videoCount} video${playlist.videoCount !== 1 ? 's' : ''}`} 
                                        size="small"
                                    />
                                )}
                                {playlist.privacyStatus && (
                                    <Chip 
                                        label={playlist.privacyStatus.charAt(0).toUpperCase() + playlist.privacyStatus.slice(1)} 
                                        size="small"
                                        color={playlist.privacyStatus === 'public' ? 'success' : 'default'}
                                    />
                                )}
                                {playlist.status && (
                                    <Chip 
                                        label={playlist.status} 
                                        size="small"
                                        color="primary"
                                    />
                                )}
                                {playlist.rating && (
                                    <Chip 
                                        label={playlist.rating} 
                                        size="small"
                                        color="secondary"
                                    />
                                )}
                            </Box>

                            {/* Description */}
                            {playlist.description && (
                                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                                    {playlist.description}
                                </Typography>
                            )}

                            {/* Topics & Genres */}
                            {playlist.topics && playlist.topics.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">Topics: </Typography>
                                    {playlist.topics.map((topic, idx) => (
                                        <Chip key={idx} label={topic} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                    ))}
                                </Box>
                            )}

                            {playlist.genres && playlist.genres.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Genres: </Typography>
                                    {playlist.genres.map((genre, idx) => (
                                        <Chip key={idx} label={genre} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                    ))}
                                </Box>
                            )}

                            {/* Dates */}
                            <Box sx={{ mt: 2 }}>
                                {playlist.publishedAt && (
                                    <Typography variant="body2" color="text.secondary">
                                        Published: {new Date(playlist.publishedAt).toLocaleDateString()}
                                    </Typography>
                                )}
                                {playlist.dateAdded && (
                                    <Typography variant="body2" color="text.secondary">
                                        Added to Library: {new Date(playlist.dateAdded).toLocaleDateString()}
                                    </Typography>
                                )}
                                {playlist.lastSyncedAt && (
                                    <Typography variant="body2" color="text.secondary">
                                        Last Synced: {new Date(playlist.lastSyncedAt).toLocaleDateString()}
                                    </Typography>
                                )}
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {playlist.link && (
                                    <Button
                                        variant="contained"
                                        startIcon={<YouTube />}
                                        href={playlist.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View on YouTube
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
                                    onClick={handleSync}
                                    disabled={syncing}
                                >
                                    Sync
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<PlaylistAdd />}
                                    onClick={() => setAddToMixlistDialog(true)}
                                >
                                    Add to Mixlist
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<Delete />}
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </CardContent>
                    </Grid>
                </Grid>
            </Card>

            {/* Videos Section */}
            <Accordion expanded={videosExpanded} onChange={() => setVideosExpanded(!videosExpanded)}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                        Videos in Playlist ({videos.length})
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {videos.length === 0 ? (
                        <Alert severity="info">No videos in this playlist yet</Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {videos.map((video, index) => (
                                <Grid item xs={12} key={video.id}>
                                    <Card 
                                        sx={{ 
                                            display: 'flex',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                boxShadow: 4
                                            }
                                        }}
                                        onClick={() => navigate(`/media/${video.id}`)}
                                    >
                                        {video.thumbnail && (
                                            <CardMedia
                                                component="img"
                                                sx={{ 
                                                    width: 160, 
                                                    height: 90,
                                                    objectFit: 'cover',
                                                    flexShrink: 0
                                                }}
                                                image={video.thumbnail}
                                                alt={video.title}
                                                crossOrigin="anonymous"
                                            />
                                        )}
                                        <CardContent sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {video.position !== undefined && video.position !== null && (
                                                            <span style={{ color: '#888', marginRight: '8px' }}>
                                                                #{video.position + 1}
                                                            </span>
                                                        )}
                                                        {video.title}
                                                    </Typography>
                                                    {video.lengthInSeconds > 0 && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Duration: {formatDuration(video.lengthInSeconds)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/media/${video.id}`);
                                                    }}
                                                >
                                                    <OpenInNew fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Notes Section */}
            {playlist.notes && (
                <Paper sx={{ p: 2, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>Notes</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {playlist.notes}
                    </Typography>
                </Paper>
            )}

            {/* Add to Mixlist Dialog */}
            <Dialog open={addToMixlistDialog} onClose={() => setAddToMixlistDialog(false)}>
                <DialogTitle>Add to Mixlist</DialogTitle>
                <DialogContent>
                    <List>
                        {availableMixlists.map((mixlist) => (
                            <ListItem 
                                button 
                                key={mixlist.id} 
                                onClick={() => handleAddToMixlist(mixlist.id)}
                            >
                                <ListItemText primary={mixlist.name} secondary={mixlist.description} />
                            </ListItem>
                        ))}
                    </List>
                    {availableMixlists.length === 0 && (
                        <Alert severity="info">No mixlists available. Create one first!</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddToMixlistDialog(false)}>Cancel</Button>
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

export default YouTubePlaylistProfile;

