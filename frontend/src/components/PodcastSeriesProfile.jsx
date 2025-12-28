import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, IconButton, Grid, CircularProgress, Alert,
    Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, ListItemButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
    ArrowBack, Edit, OpenInNew, Sync, Delete,
    PlaylistAdd, Podcasts, ExpandMore, Visibility, Add, CheckCircle
} from '@mui/icons-material';
import axios from 'axios';
import {
    getPodcastSeriesById,
    getEpisodesBySeriesId,
    syncPodcastSeriesEpisodes,
    deletePodcastSeries,
    getAllMixlists,
    addMediaToMixlist,
    importPodcastEpisodeFromApi
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
    const [viewAllEpisodesDialog, setViewAllEpisodesDialog] = useState(false);
    const [allEpisodesFromApi, setAllEpisodesFromApi] = useState([]);
    const [displayedEpisodes, setDisplayedEpisodes] = useState([]);
    const [loadingAllEpisodes, setLoadingAllEpisodes] = useState(false);
    const [importedEpisodes, setImportedEpisodes] = useState(new Map()); // Map of externalId -> episodeId
    const [importingEpisode, setImportingEpisode] = useState(null);
    const [importSuccessDialog, setImportSuccessDialog] = useState(false);
    const [lastImportedEpisode, setLastImportedEpisode] = useState(null);

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
            const response = await addMediaToMixlist(mixlistId, id);
            console.log('Add to mixlist response:', response);
            setSnackbar({ open: true, message: 'Added to mixlist!', severity: 'success' });
            setAddToMixlistDialog(false);
        } catch (error) {
            console.error('Error adding to mixlist:', error);
            console.error('Error details:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to add to mixlist';
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        }
    };

    const handleViewAllEpisodes = async () => {
        if (!series?.externalId) {
            setSnackbar({ open: true, message: 'No external ID available for this series', severity: 'error' });
            return;
        }

        try {
            setLoadingAllEpisodes(true);
            setViewAllEpisodesDialog(true);
            
            // Fetch all episodes from ListenNotes API without saving
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5033/api';
            const response = await axios.get(`${API_URL}/ListenNotes/podcasts/${series.externalId}`);
            
            // Store all episodes and display first 10
            const allEpisodes = response.data.episodes || [];
            setAllEpisodesFromApi(allEpisodes);
            setDisplayedEpisodes(allEpisodes.slice(0, 10));
            
            // Check which episodes are already imported
            await checkImportedEpisodes(allEpisodes);
            
            setLoadingAllEpisodes(false);
        } catch (error) {
            console.error('Error fetching all episodes:', error);
            setSnackbar({ open: true, message: 'Failed to fetch episodes from ListenNotes', severity: 'error' });
            setLoadingAllEpisodes(false);
            setViewAllEpisodesDialog(false);
        }
    };

    const checkImportedEpisodes = async (apiEpisodes) => {
        try {
            // Get all episodes for this series from the database
            const dbEpisodesResponse = await getEpisodesBySeriesId(id);
            const dbEpisodes = dbEpisodesResponse.data || [];
            
            // Create a map of external IDs to episode IDs
            const importedMap = new Map();
            dbEpisodes.forEach(ep => {
                if (ep.externalId) {
                    importedMap.set(ep.externalId, ep.id);
                }
            });
            
            setImportedEpisodes(importedMap);
        } catch (error) {
            console.error('Error checking imported episodes:', error);
        }
    };

    const handleImportEpisode = async (episode) => {
        if (!episode.id) {
            setSnackbar({ open: true, message: 'Episode ID not available', severity: 'error' });
            return;
        }

        try {
            setImportingEpisode(episode.id);
            
            const importedEp = await importPodcastEpisodeFromApi(episode.id, id);
            
            // Update the imported episodes map
            const newImportedMap = new Map(importedEpisodes);
            newImportedMap.set(episode.id, importedEp.id);
            setImportedEpisodes(newImportedMap);
            
            // Store the imported episode for the success dialog
            setLastImportedEpisode({
                title: episode.title,
                id: importedEp.id
            });
            
            setImportingEpisode(null);
            setImportSuccessDialog(true);
            
            // Refresh the episodes list to update count
            await fetchSeriesData();
        } catch (error) {
            console.error('Error importing episode:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to import episode';
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });
            setImportingEpisode(null);
        }
    };

    const handleGoToEpisode = () => {
        if (lastImportedEpisode?.id) {
            navigate(`/media/${lastImportedEpisode.id}`);
        }
        setImportSuccessDialog(false);
    };

    const handleContinueImporting = () => {
        setImportSuccessDialog(false);
    };

    const handleLoadMoreEpisodes = () => {
        const currentLength = displayedEpisodes.length;
        const nextBatch = allEpisodesFromApi.slice(0, currentLength + 10);
        setDisplayedEpisodes(nextBatch);
        // No need to re-check imported episodes as the map already contains all
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
            1: '#2196f3', // ActivelyExploring - blue
            2: '#4caf50', // Completed - green
            3: '#f44336'  // Abandoned - red
        };
        return statusColors[status] || '#9e9e9e';
    };

    const getStatusText = (status) => {
        const statusText = {
            0: 'Uncharted',
            1: 'Actively Exploring',
            2: 'Completed',
            3: 'Abandoned'
        };
        return statusText[status] || 'Unknown';
    };

    const formatEpisodeDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getListenNotesUrl = () => {
        if (series?.externalId) {
            return `https://www.listennotes.com/podcasts/${series.externalId}/`;
        }
        return series?.link || null;
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
                        {series.thumbnail ? (
                            <Box sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '100%', // 1:1 aspect ratio for podcast covers
                                overflow: 'hidden',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }}>
                                <Box
                                    component="img"
                                    src={series.thumbnail}
                                    alt={series.title}
                                    onError={(e) => {
                                        console.error('Image failed to load:', series.thumbnail);
                                        e.target.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                        console.log('Image loaded successfully:', series.thumbnail);
                                    }}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box sx={{
                                position: 'relative',
                                width: '100%',
                                paddingTop: '100%',
                                overflow: 'hidden',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Podcasts sx={{ fontSize: 80, opacity: 0.3, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                            </Box>
                        )}
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>{series.title}</Typography>
                            
                            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                                <Chip label="Podcast Series" icon={<Podcasts />} color="primary" size="medium" />
                                {series.totalEpisodes > 0 && (
                                    <Chip label={`${series.totalEpisodes} episodes`} size="medium" variant="outlined" />
                                )}
                                {series.status !== undefined && (
                                    <Chip 
                                        label={getStatusText(series.status)} 
                                        sx={{ backgroundColor: getStatusColor(series.status), color: 'white' }}
                                        size="medium"
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
                                {getListenNotesUrl() && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<OpenInNew />}
                                        href={getListenNotesUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{
                                            color: 'white',
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                            '&:hover': {
                                                borderColor: 'white',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        View on ListenNotes
                                    </Button>
                                )}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Sync />}
                                    onClick={handleSync}
                                    disabled={syncing}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        '&:hover': {
                                            borderColor: 'white',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        },
                                        '&:disabled': {
                                            color: 'rgba(255, 255, 255, 0.3)',
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        }
                                    }}
                                >
                                    {syncing ? <CircularProgress size={20} /> : 'Sync Episodes'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Visibility />}
                                    onClick={handleViewAllEpisodes}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        '&:hover': {
                                            borderColor: 'white',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                >
                                    View All Episodes
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
                                    size="small"
                                    startIcon={<Delete />}
                                    onClick={() => setDeleteConfirmDialog(true)}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        '&:hover': {
                                            borderColor: '#f44336',
                                            backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                            color: '#f44336'
                                        }
                                    }}
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
                                                            size="medium" 
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
                                                        size="medium"
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

            {/* Import Success Dialog */}
            <Dialog open={importSuccessDialog} onClose={handleContinueImporting}>
                <DialogTitle>Episode Imported Successfully!</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        "{lastImportedEpisode?.title}" has been imported to your library.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Would you like to go to the episode's profile page or continue importing episodes?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleContinueImporting} variant="outlined">
                        Continue Importing
                    </Button>
                    <Button onClick={handleGoToEpisode} variant="contained" color="primary">
                        Go to Episode
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View All Episodes Dialog */}
            <Dialog 
                open={viewAllEpisodesDialog} 
                onClose={() => setViewAllEpisodesDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    All Episodes from ListenNotes
                    <Typography variant="caption" display="block" color="text.secondary">
                        Viewing episodes from ListenNotes API (not saved to database)
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {loadingAllEpisodes && allEpisodesFromApi.length === 0 ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                            <CircularProgress />
                        </Box>
                    ) : allEpisodesFromApi.length === 0 ? (
                        <Typography>No episodes available from ListenNotes API.</Typography>
                    ) : (
                        <>
                            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="60px">Import</TableCell>
                                            <TableCell width="80px">Episode</TableCell>
                                            <TableCell>Title</TableCell>
                                            <TableCell width="120px">Released</TableCell>
                                            <TableCell width="100px">Duration</TableCell>
                                                    <TableCell width="80px">ListenNotes</TableCell>
                                            <TableCell width="80px">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {displayedEpisodes.map((episode, index) => {
                                            const isImported = importedEpisodes.has(episode.id);
                                            const episodeDbId = importedEpisodes.get(episode.id);
                                            const isImporting = importingEpisode === episode.id;
                                            
                                            return (
                                                <TableRow key={episode.id || index} hover>
                                                    <TableCell>
                                                        {isImported ? (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/media/${episodeDbId}`)}
                                                                color="success"
                                                                title="Go to episode profile"
                                                            >
                                                                <CheckCircle />
                                                            </IconButton>
                                                        ) : (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleImportEpisode(episode)}
                                                                disabled={isImporting}
                                                                title="Import episode"
                                                                sx={{ color: 'white' }}
                                                            >
                                                                {isImporting ? (
                                                                    <CircularProgress size={20} sx={{ color: 'white' }} />
                                                                ) : (
                                                                    <Add sx={{ color: 'white' }} />
                                                                )}
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        {isImported ? (
                                                            <Button
                                                                variant="text"
                                                                onClick={() => navigate(`/media/${episodeDbId}`)}
                                                                sx={{ 
                                                                    textTransform: 'none',
                                                                    justifyContent: 'flex-start',
                                                                    textAlign: 'left',
                                                                    fontWeight: 500
                                                                }}
                                                            >
                                                                {episode.title}
                                                            </Button>
                                                        ) : (
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {episode.title}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {episode.pub_date_ms 
                                                            ? new Date(episode.pub_date_ms).toLocaleDateString()
                                                            : 'N/A'
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatEpisodeDuration(episode.audio_length_sec)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {isImported ? (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/media/${episodeDbId}`)}
                                                                color="primary"
                                                                title="View episode profile"
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        ) : (
                                                            episode.link && (
                                                                <IconButton
                                                                    size="small"
                                                                    href={episode.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="Open in ListenNotes"
                                                                >
                                                                    <OpenInNew fontSize="small" />
                                                                </IconButton>
                                                            )
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {displayedEpisodes.length < allEpisodesFromApi.length && (
                                <Box display="flex" justifyContent="center" mt={2}>
                                    <Button
                                        variant="contained"
                                        onClick={handleLoadMoreEpisodes}
                                        disabled={loadingAllEpisodes}
                                    >
                                        Load More Episodes ({displayedEpisodes.length} of {allEpisodesFromApi.length})
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Typography variant="caption" sx={{ flex: 1, ml: 2, color: 'white' }}>
                        Showing: {displayedEpisodes.length} of {allEpisodesFromApi.length} episodes
                    </Typography>
                    <Button onClick={() => setViewAllEpisodesDialog(false)} sx={{ color: 'white' }}>
                        Close
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

