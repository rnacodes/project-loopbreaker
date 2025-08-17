import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, IconButton, Collapse, Divider, Paper, Link,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, List, ListItem, ListItemText, Snackbar, Alert, InputAdornment
} from '@mui/material';
import { 
    ArrowBack, ExpandMore, ExpandLess, OpenInNew, Edit,
    Search, Upload, FileDownload, AddCircle, Add, Delete
} from '@mui/icons-material';
import { 
    getMixlistById, removeMediaFromMixlist, searchMedia, addMediaToMixlist
} from '../services/apiService';
import SimpleMediaCarousel from './shared/SimpleMediaCarousel';

function MixlistProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mixlist, setMixlist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mediaListExpanded, setMediaListExpanded] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [addMediaDialogOpen, setAddMediaDialogOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const loadMixlist = async () => {
            try {
                const mixlistResponse = await getMixlistById(id);
                setMixlist(mixlistResponse.data);
            } catch (error) {
                console.error('Error loading mixlist:', error);
                setSnackbar({ open: true, message: 'Failed to load mixlist', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };
        
        if (id) {
            loadMixlist();
        } else {
            setLoading(false);
        }
    }, [id]);

    // Media search functionality
    const handleSearchMedia = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await searchMedia(query);
            setSearchResults(response.data || []);
        } catch (error) {
            console.error('Error searching media:', error);
            setSnackbar({ open: true, message: 'Failed to search media', severity: 'error' });
        } finally {
            setSearching(false);
        }
    };

    const handleAddMedia = async (mediaItemId) => {
        try {
            await addMediaToMixlist(id, mediaItemId);
            
            // Reload the mixlist to update the display
            const response = await getMixlistById(id);
            setMixlist(response.data);
            
            // Close dialog and clear search
            setAddMediaDialogOpen(false);
            setSearchQuery('');
            setSearchResults([]);
            
            setSnackbar({ open: true, message: 'Media added successfully!', severity: 'success' });
        } catch (error) {
            console.error('Error adding media to mixlist:', error);
            setSnackbar({ open: true, message: 'Failed to add media', severity: 'error' });
        }
    };

    const handleRemoveMedia = async (mediaItemId) => {
        try {
            await removeMediaFromMixlist(id, mediaItemId);
            
            // Reload the mixlist to update the display
            const response = await getMixlistById(id);
            setMixlist(response.data);
            
            // Clear selected media if it was removed
            if (selectedMedia && selectedMedia.id === mediaItemId) {
                setSelectedMedia(null);
            }
            
            setSnackbar({ open: true, message: 'Media removed successfully!', severity: 'success' });
        } catch (error) {
            console.error('Error removing media from mixlist:', error);
            setSnackbar({ open: true, message: 'Failed to remove media', severity: 'error' });
        }
    };

    const handleMediaCarouselClick = (media) => {
        setSelectedMedia(media);
    };

    const getMediaTypeColor = (mediaType) => {
        const colors = {
            'Podcast': '#9C27B0', 'Book': '#2196F3', 'Movie': '#FF5722',
            'Article': '#4CAF50', 'Video': '#FF9800', 'Music': '#E91E63',
            'VideoGame': '#673AB7', 'TVShow': '#795548', 'Website': '#607D8B',
            'Document': '#3F51B5', 'Other': '#9E9E9E'
        };
        return colors[mediaType] || colors['Other'];
    };

    const getStatusColor = (status) => {
        const colors = {
            'Completed': '#4CAF50', 'ActivelyExploring': '#FF9800',
            'Uncharted': '#9E9E9E', 'Abandoned': '#F44336'
        };
        return colors[status] || colors['Uncharted'];
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

    const currentMediaItems = mixlist.MediaItems || mixlist.mediaItems || [];
    const hasMediaItems = currentMediaItems.length > 0;

    return (
        <Box sx={{ minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ p: 3, pb: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate('/mixlists')} sx={{ mr: 2 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h3" component="h1" sx={{ 
                            fontSize: '32px', fontWeight: 'bold'
                        }}>
                            {mixlist.Name || mixlist.name}
                        </Typography>
                    </Box>

                    {/* Edit Button */}
                    <Button
                        onClick={() => navigate(`/mixlist/${id}/edit`)}
                        startIcon={<Edit />}
                        variant="contained"
                        color="primary"
                        size="large"
                    >
                        Edit Mixlist
                    </Button>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        onClick={() => window.open(`/api/mixlist/${id}/export`, '_blank')}
                        startIcon={<FileDownload />}
                        variant="contained"
                        color="primary"
                        size="large"
                    >
                        Export Mixlist
                    </Button>
                </Box>

                {/* Mixlist Information Card */}
                <Card sx={{ mb: 4, overflow: 'hidden' }}>
                    {/* Thumbnail */}
                    {(mixlist.Thumbnail || mixlist.thumbnail) && (
                        <CardMedia
                            component="img"
                            sx={{ width: '100%', height: 250, objectFit: 'cover' }}
                            image={mixlist.Thumbnail || mixlist.thumbnail}
                            alt={mixlist.Name || mixlist.name}
                        />
                    )}
                    
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                                {mixlist.Name || mixlist.name}
                            </Typography>
                            <Chip 
                                label={`${currentMediaItems.length} items`}
                                sx={{ 
                                    backgroundColor: 'primary.main', 
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Box>

                        {/* Description */}
                        {(mixlist.Description || mixlist.description) && (
                            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                                {mixlist.Description || mixlist.description}
                            </Typography>
                        )}

                        {/* Date Created */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Created on: {new Date(mixlist.DateCreated || mixlist.dateCreated).toLocaleDateString()}
                        </Typography>

                        {/* Collapsible Media List */}
                        <Box>
                            <Button
                                onClick={() => setMediaListExpanded(!mediaListExpanded)}
                                startIcon={mediaListExpanded ? <ExpandLess /> : <ExpandMore />}
                                variant="contained"
                                color="primary"
                                sx={{ 
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    mb: 2
                                }}
                            >
                                Media Items ({currentMediaItems.length})
                            </Button>
                            
                            <Collapse in={mediaListExpanded}>
                                <Box sx={{ pl: 2 }}>
                                    {hasMediaItems ? (
                                        currentMediaItems.map((mediaItem, index) => (
                                            <Paper key={mediaItem.id || mediaItem.Id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {index + 1}.
                                                    </Typography>
                                                    <Link
                                                        component="button"
                                                        variant="body1"
                                                        onClick={() => navigate(`/media/${mediaItem.id || mediaItem.Id}`)}
                                                        sx={{ 
                                                            textDecoration: 'none',
                                                            fontWeight: 'medium',
                                                            '&:hover': { textDecoration: 'underline' }
                                                        }}
                                                    >
                                                        {mediaItem.title || mediaItem.Title}
                                                    </Link>
                                                    <Chip
                                                        label={mediaItem.mediaType || mediaItem.MediaType}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getMediaTypeColor(mediaItem.mediaType || mediaItem.MediaType),
                                                            color: 'white',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleRemoveMedia(mediaItem.id || mediaItem.Id)}
                                                    size="small"
                                                    color="error"
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Paper>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                            No media items in this mixlist yet.
                                        </Typography>
                                    )}
                                </Box>
                            </Collapse>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Simple Media Carousel */}
            {hasMediaItems && (
                <Box sx={{ px: 3, mb: 4 }}>
                    <SimpleMediaCarousel
                        mediaItems={currentMediaItems.map(item => ({
                            ...item,
                            thumbnailUrl: item.thumbnail || item.Thumbnail
                        }))}
                        title="Browse Media"
                        subtitle="Click on any item to view details below"
                        onMediaClick={handleMediaCarouselClick}
                    />
                </Box>
            )}

            {/* Selected Media Profile */}
            {selectedMedia && (
                <Box sx={{ px: 3, mb: 4 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Card sx={{ overflow: 'hidden' }}>
                        {(selectedMedia.thumbnail || selectedMedia.Thumbnail) && (
                            <CardMedia
                                component="img"
                                sx={{ width: '100%', height: 200, objectFit: 'cover' }}
                                image={selectedMedia.thumbnail || selectedMedia.Thumbnail}
                                alt={selectedMedia.title || selectedMedia.Title}
                            />
                        )}
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold', flex: 1 }}>
                                    {selectedMedia.title || selectedMedia.Title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Edit />}
                                        onClick={() => navigate(`/media/${selectedMedia.id || selectedMedia.Id}/edit`)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<OpenInNew />}
                                        onClick={() => navigate(`/media/${selectedMedia.id || selectedMedia.Id}`)}
                                    >
                                        View Full Profile
                                    </Button>
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                <Chip
                                    label={selectedMedia.mediaType || selectedMedia.MediaType}
                                    sx={{
                                        backgroundColor: getMediaTypeColor(selectedMedia.mediaType || selectedMedia.MediaType),
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                />
                                {(selectedMedia.status || selectedMedia.Status) && (
                                    <Chip
                                        label={selectedMedia.status || selectedMedia.Status}
                                        sx={{
                                            backgroundColor: getStatusColor(selectedMedia.status || selectedMedia.Status),
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                )}
                            </Box>

                            {selectedMedia.description && (
                                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                                    {selectedMedia.description}
                                </Typography>
                            )}

                            {selectedMedia.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                    <strong>Notes:</strong> {selectedMedia.notes}
                                </Typography>
                            )}

                            {selectedMedia.link && (
                                <Box sx={{ mt: 2 }}>
                                    <Link 
                                        href={selectedMedia.link.startsWith('http') ? selectedMedia.link : `https://${selectedMedia.link}`}
                                        target="_blank" 
                                        rel="noopener"
                                        sx={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: 1,
                                            color: 'primary.main',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        View Source <OpenInNew fontSize="small" />
                                    </Link>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Action Buttons Section */}
            <Box sx={{ textAlign: 'center', mt: 4, px: 3, pb: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                    Add Content to This Mixlist
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                        variant="contained" 
                        size="large"
                        startIcon={<AddCircle />}
                        onClick={() => setAddMediaDialogOpen(true)}
                        sx={{ fontSize: '16px', px: 4, py: 1.5 }}
                    >
                        Add Existing Media
                    </Button>
                    <Button 
                        variant="contained" 
                        size="large"
                        startIcon={<Upload />}
                        onClick={() => navigate('/upload-media')}
                        sx={{ fontSize: '16px', px: 4, py: 1.5 }}
                    >
                        Upload Media
                    </Button>
                    <Button 
                        variant="contained" 
                        size="large"
                        startIcon={<FileDownload />}
                        onClick={() => navigate('/import-media')}
                        sx={{ fontSize: '16px', px: 4, py: 1.5 }}
                    >
                        Import Media
                    </Button>
                </Box>
            </Box>

            {/* Add Media Dialog */}
            <Dialog open={addMediaDialogOpen} onClose={() => setAddMediaDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Media to Mixlist</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Search media by name"
                        variant="outlined"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleSearchMedia(e.target.value);
                        }}
                        sx={{ mb: 2, mt: 1 }}
                        placeholder="Type to search for media..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            )
                        }}
                    />

                    {searching && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <Typography variant="body2">Searching...</Typography>
                        </Box>
                    )}

                    {!searching && searchQuery && searchResults.length === 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                No media found matching "{searchQuery}"
                            </Typography>
                        </Box>
                    )}

                    {!searching && searchResults.length > 0 && (
                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {searchResults
                                .filter(media => !currentMediaItems.some(current => 
                                    (current.id || current.Id) === (media.id || media.Id)
                                ))
                                .map((media) => (
                                    <ListItem 
                                        key={media.id || media.Id} 
                                        button
                                        onClick={() => handleAddMedia(media.id || media.Id)}
                                        sx={{ border: 1, borderColor: 'divider', mb: 1, borderRadius: 1 }}
                                    >
                                        <ListItemText 
                                            primary={media.title || media.Title}
                                            secondary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <Chip
                                                        label={media.mediaType || media.MediaType}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getMediaTypeColor(media.mediaType || media.MediaType),
                                                            color: 'white',
                                                            fontSize: '0.7rem'
                                                        }}
                                                    />
                                                    {media.description && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {media.description.length > 100 
                                                                ? `${media.description.substring(0, 100)}...` 
                                                                : media.description
                                                            }
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    )}

                    {!searchQuery && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                Start typing to search for media to add
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => setAddMediaDialogOpen(false)}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for feedback */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default MixlistProfilePage;
