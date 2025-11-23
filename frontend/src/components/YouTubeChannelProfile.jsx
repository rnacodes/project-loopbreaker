import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, Paper, Link, IconButton, Grid,
    CircularProgress, Alert, List, ListItem, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    ArrowBack, Edit, OpenInNew, Sync, Delete,
    PlaylistAdd, YouTube
} from '@mui/icons-material';
import {
    getYouTubeChannelById,
    getYouTubeChannelVideos,
    deleteYouTubeChannel,
    syncYouTubeChannelMetadata,
    getAllMixlists,
    addMediaToMixlist,
    removeMediaFromMixlist
} from '../services/apiService';

function YouTubeChannelProfile() {
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [availableMixlists, setAvailableMixlists] = useState([]);
    const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchChannelData();
        fetchMixlists();
    }, [id]);

    const fetchChannelData = async () => {
        try {
            setLoading(true);
            const channelData = await getYouTubeChannelById(id);
            setChannel(channelData);
            
            const channelVideos = await getYouTubeChannelVideos(id);
            setVideos(channelVideos);
        } catch (error) {
            console.error('Error fetching channel data:', error);
            setSnackbar({ open: true, message: 'Failed to load channel', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchMixlists = async () => {
        try {
            const mixlists = await getAllMixlists();
            setAvailableMixlists(mixlists);
        } catch (error) {
            console.error('Error fetching mixlists:', error);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await syncYouTubeChannelMetadata(id);
            await fetchChannelData();
            setSnackbar({ open: true, message: 'Channel synced successfully', severity: 'success' });
        } catch (error) {
            console.error('Error syncing channel:', error);
            setSnackbar({ open: true, message: 'Failed to sync channel', severity: 'error' });
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this channel? Associated videos will remain in the database.')) {
            try {
                await deleteYouTubeChannel(id);
                setSnackbar({ open: true, message: 'Channel deleted successfully', severity: 'success' });
                setTimeout(() => navigate('/youtube-channels'), 1500);
            } catch (error) {
                console.error('Error deleting channel:', error);
                setSnackbar({ open: true, message: 'Failed to delete channel', severity: 'error' });
            }
        }
    };

    const handleAddToMixlist = async (mixlistId) => {
        try {
            await addMediaToMixlist(mixlistId, id);
            await fetchChannelData();
            setSnackbar({ open: true, message: 'Added to mixlist', severity: 'success' });
            setAddToMixlistDialog(false);
        } catch (error) {
            console.error('Error adding to mixlist:', error);
            setSnackbar({ open: true, message: 'Failed to add to mixlist', severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!channel) {
        return (
            <Box p={3}>
                <Alert severity="error">Channel not found</Alert>
                <Button onClick={() => navigate('/youtube-channels')} sx={{ mt: 2 }}>
                    Back to Channels
                </Button>
            </Box>
        );
    }

    return (
        <Box p={3}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => navigate('/youtube-channels')} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4">YouTube Channel</Typography>
            </Box>

            {/* Channel Card */}
            <Card sx={{ mb: 3 }}>
                <Grid container>
                    <Grid item xs={12} md={3}>
                        {channel.thumbnail && (
                            <CardMedia
                                component="img"
                                image={channel.thumbnail}
                                alt={channel.title}
                                sx={{ height: '100%', objectFit: 'cover' }}
                            />
                        )}
                    </Grid>
                    <Grid item xs={12} md={9}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {channel.title}
                            </Typography>

                            {channel.customUrl && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {channel.customUrl}
                                </Typography>
                            )}

                            {channel.description && (
                                <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                                    {channel.description}
                                </Typography>
                            )}

                            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                                {channel.subscriberCount && (
                                    <Chip label={`${channel.subscriberCount.toLocaleString()} subscribers`} />
                                )}
                                {channel.videoCount && (
                                    <Chip label={`${channel.videoCount.toLocaleString()} videos`} />
                                )}
                                {channel.videoCountInDb > 0 && (
                                    <Chip label={`${channel.videoCountInDb} in database`} color="primary" />
                                )}
                            </Box>

                            <Box display="flex" gap={1} flexWrap="wrap">
                                {channel.link && (
                                    <Button
                                        startIcon={<YouTube />}
                                        href={channel.link}
                                        target="_blank"
                                        size="small"
                                    >
                                        View on YouTube
                                    </Button>
                                )}
                                <Button
                                    startIcon={<Sync />}
                                    onClick={handleSync}
                                    disabled={syncing}
                                    size="small"
                                >
                                    {syncing ? 'Syncing...' : 'Sync Metadata'}
                                </Button>
                                <Button
                                    startIcon={<PlaylistAdd />}
                                    onClick={() => setAddToMixlistDialog(true)}
                                    size="small"
                                >
                                    Add to Mixlist
                                </Button>
                                <Button
                                    startIcon={<Edit />}
                                    onClick={() => navigate(`/edit-channel/${id}`)}
                                    size="small"
                                >
                                    Edit
                                </Button>
                                <Button
                                    startIcon={<Delete />}
                                    onClick={handleDelete}
                                    color="error"
                                    size="small"
                                >
                                    Delete
                                </Button>
                            </Box>
                        </CardContent>
                    </Grid>
                </Grid>
            </Card>

            {/* Videos from this channel */}
            {videos.length > 0 && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Videos from this Channel ({videos.length})
                    </Typography>
                    <List>
                        {videos.map((video) => (
                            <ListItem
                                key={video.id}
                                button
                                onClick={() => navigate(`/media/${video.id}`)}
                            >
                                <ListItemText
                                    primary={video.title}
                                    secondary={`Status: ${video.status} | Added: ${new Date(video.dateAdded).toLocaleDateString()}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            {/* Add to Mixlist Dialog */}
            <Dialog open={addToMixlistDialog} onClose={() => setAddToMixlistDialog(false)}>
                <DialogTitle>Add to Mixlist</DialogTitle>
                <DialogContent>
                    <List>
                        {availableMixlists
                            .filter(m => !channel.mixlistIds?.includes(m.id))
                            .map((mixlist) => (
                                <ListItem
                                    key={mixlist.id}
                                    button
                                    onClick={() => handleAddToMixlist(mixlist.id)}
                                >
                                    <ListItemText primary={mixlist.name} />
                                </ListItem>
                            ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddToMixlistDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default YouTubeChannelProfile;

