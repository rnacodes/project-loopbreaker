import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, TextField, Button, Box, MenuItem,
    Card, CardContent, Snackbar, Alert, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Save, Cancel, ArrowBack, Delete } from '@mui/icons-material';
import { getMediaById, updateMedia, uploadThumbnail, deleteMedia } from '../services/apiService';

function EditMediaForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        mediaType: 'Other',
        status: 'Uncharted',
        rating: '',
        ownershipStatus: '',
        link: '',
        description: '',
        notes: '',
        relatedNotes: '',
        thumbnail: '',
        genre: '',
        dateCompleted: ''
    });

    // Media type options (not editable)
    const mediaTypes = [
        'Article', 'Book', 'Document', 'Movie', 'Music', 'Other',
        'Podcast', 'TVShow', 'Video', 'VideoGame', 'Website'
    ];

    // Status options
    const statusOptions = [
        'Uncharted', 'ActivelyExploring', 'Completed', 'Abandoned'
    ];

    // Rating options
    const ratingOptions = [
        'SuperLike', 'Like', 'Neutral', 'Dislike'
    ];

    // Ownership status options
    const ownershipStatusOptions = [
        'Own', 'Rented', 'Streamed'
    ];

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const response = await getMediaById(id);
                const media = response.data;
                
                setFormData({
                    title: media.title || media.Title || '',
                    mediaType: media.mediaType || media.MediaType || 'Other',
                    status: media.status || media.Status || 'Uncharted',
                    rating: media.rating || media.Rating || '',
                    ownershipStatus: media.ownershipStatus || media.OwnershipStatus || '',
                    link: media.link || media.Link || '',
                    description: media.description || media.Description || '',
                    notes: media.notes || media.Notes || '',
                    relatedNotes: media.relatedNotes || media.RelatedNotes || '',
                    thumbnail: media.thumbnail || media.Thumbnail || '',
                    genre: media.genre || media.Genre || '',
                    dateCompleted: media.dateCompleted || media.DateCompleted ? 
                        new Date(media.dateCompleted || media.DateCompleted).toISOString().split('T')[0] : ''
                });
            } catch (error) {
                console.error('Failed to fetch media:', error);
                setSnackbar({ open: true, message: 'Failed to load media item', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMedia();
        }
    }, [id]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle thumbnail file upload
    const handleThumbnailUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setThumbnailFile(file);
            console.log('Thumbnail file selected:', file.name);
            
            try {
                // Upload thumbnail to DigitalOcean Spaces
                console.log('Uploading thumbnail to DigitalOcean Spaces...');
                const response = await uploadThumbnail(file);
                const thumbnailUrl = response.data.url;
                
                // Set the thumbnail URL from the upload response
                handleInputChange('thumbnail', thumbnailUrl);
                console.log('Thumbnail uploaded successfully:', thumbnailUrl);
                
                setSnackbar({ 
                    open: true, 
                    message: 'Thumbnail uploaded successfully!', 
                    severity: 'success' 
                });
            } catch (error) {
                console.error('Error uploading thumbnail:', error);
                setSnackbar({ 
                    open: true, 
                    message: 'Failed to upload thumbnail. Please try again.', 
                    severity: 'error' 
                });
                setThumbnailFile(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Prepare update data according to CreateMediaItemDto
            const updateData = {
                title: formData.title,
                mediaType: formData.mediaType,
                status: formData.status,
                rating: formData.rating || null, // Convert empty string to null for enum
                ownershipStatus: formData.ownershipStatus || null, // Convert empty string to null for enum
                link: formData.link || null,
                description: formData.description || null,
                notes: formData.notes || null,
                relatedNotes: formData.relatedNotes || null,
                thumbnail: formData.thumbnail || null,
                genre: formData.genre || null,
                dateCompleted: formData.dateCompleted ? new Date(formData.dateCompleted).toISOString() : null,
                topics: [], // TODO: Add topic editing in future
                genres: []  // TODO: Add genre editing in future
            };

            await updateMedia(id, updateData);
            
            setSnackbar({ 
                open: true, 
                message: 'Media item updated successfully!', 
                severity: 'success' 
            });

            // Redirect back to media profile after a short delay
            setTimeout(() => {
                navigate(`/media/${id}`);
            }, 1500);

        } catch (error) {
            console.error('Failed to update media:', error);
            setSnackbar({ 
                open: true, 
                message: error.response?.data?.message || 'Failed to update media item', 
                severity: 'error' 
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/media/${id}`);
    };

    const handleDelete = async () => {
        try {
            await deleteMedia(id);
            setSnackbar({ 
                open: true, 
                message: 'Media item deleted successfully!', 
                severity: 'success' 
            });
            
            // Navigate to all media page after a short delay
            setTimeout(() => {
                navigate('/all-media');
            }, 1500);
        } catch (error) {
            console.error('Failed to delete media:', error);
            setSnackbar({ 
                open: true, 
                message: error.response?.data?.error || 'Failed to delete media item', 
                severity: 'error' 
            });
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <Button
                        onClick={handleCancel}
                        startIcon={<ArrowBack />}
                        sx={{ mr: 2 }}
                    >
                        Back
                    </Button>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Edit Media Item
                    </Typography>
                </Box>

                <Card>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Title */}
                                <TextField
                                    fullWidth
                                    label="Title *"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    required
                                />

                                {/* Media Type (Display only - not editable) */}
                                <TextField
                                    fullWidth
                                    label="Media Type"
                                    value={formData.mediaType}
                                    disabled
                                    helperText="Media type cannot be changed after creation"
                                />

                                {/* Status */}
                                <TextField
                                    fullWidth
                                    select
                                    label="Status"
                                    value={formData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                >
                                    {statusOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {/* Rating */}
                                <TextField
                                    fullWidth
                                    select
                                    label="Rating"
                                    value={formData.rating}
                                    onChange={(e) => handleInputChange('rating', e.target.value)}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {ratingOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {/* Ownership Status */}
                                <TextField
                                    fullWidth
                                    select
                                    label="Ownership Status"
                                    value={formData.ownershipStatus}
                                    onChange={(e) => handleInputChange('ownershipStatus', e.target.value)}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {ownershipStatusOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {/* Link */}
                                <TextField
                                    fullWidth
                                    label="Link/URL"
                                    value={formData.link}
                                    onChange={(e) => handleInputChange('link', e.target.value)}
                                    placeholder="https://example.com"
                                />

                                {/* Genre */}
                                <TextField
                                    fullWidth
                                    label="Genre"
                                    value={formData.genre}
                                    onChange={(e) => handleInputChange('genre', e.target.value)}
                                />

                                {/* Thumbnail URL */}
                                <TextField
                                    fullWidth
                                    label="Thumbnail URL"
                                    value={formData.thumbnail}
                                    onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                />

                                {/* Thumbnail Upload */}
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body1" sx={{ 
                                        mb: 2, 
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}>
                                        Upload New Thumbnail
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        component="label"
                                        sx={{ 
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            py: 1.5,
                                            px: 3,
                                            borderRadius: '8px'
                                        }}
                                    >
                                        Choose File
                                        <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={handleThumbnailUpload}
                                        />
                                    </Button>
                                    {thumbnailFile && (
                                        <Typography variant="body2" sx={{ 
                                            mt: 1, 
                                            fontSize: '14px',
                                            color: 'text.secondary'
                                        }}>
                                            Selected: {thumbnailFile.name}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Date Completed */}
                                <TextField
                                    fullWidth
                                    label="Date Completed"
                                    type="date"
                                    value={formData.dateCompleted}
                                    onChange={(e) => handleInputChange('dateCompleted', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />

                                {/* Description */}
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                />

                                {/* Notes */}
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    multiline
                                    rows={4}
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                />

                                {/* Related Notes */}
                                <TextField
                                    fullWidth
                                    label="Related Notes"
                                    multiline
                                    rows={3}
                                    value={formData.relatedNotes}
                                    onChange={(e) => handleInputChange('relatedNotes', e.target.value)}
                                    helperText="Links to Obsidian notes or other documents"
                                />

                                {/* Action Buttons */}
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 4 }}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<Delete />}
                                        onClick={() => setDeleteDialogOpen(true)}
                                        disabled={saving}
                                        size="large"
                                    >
                                        Delete Media
                                    </Button>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Cancel />}
                                            onClick={handleCancel}
                                            disabled={saving}
                                            size="large"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={<Save />}
                                            disabled={saving}
                                            size="large"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            </Box>

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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{formData.title}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default EditMediaForm;
