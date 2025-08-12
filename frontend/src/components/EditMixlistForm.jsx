import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, TextField, Button, Box,
    Card, CardContent, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { Save, Cancel, ArrowBack } from '@mui/icons-material';
import { getMixlistById, updateMixlist, uploadThumbnail } from '../services/apiService';

function EditMixlistForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        thumbnail: ''
    });

    useEffect(() => {
        const fetchMixlist = async () => {
            try {
                const response = await getMixlistById(id);
                const mixlist = response.data;
                
                setFormData({
                    name: mixlist.Name || mixlist.name || '',
                    description: mixlist.Description || mixlist.description || '',
                    thumbnail: mixlist.Thumbnail || mixlist.thumbnail || ''
                });
            } catch (error) {
                console.error('Failed to fetch mixlist:', error);
                setSnackbar({ open: true, message: 'Failed to load mixlist', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMixlist();
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
            await updateMixlist(id, formData);
            
            setSnackbar({ 
                open: true, 
                message: 'Mixlist updated successfully!', 
                severity: 'success' 
            });

            // Redirect back to mixlist profile after a short delay
            setTimeout(() => {
                navigate(`/mixlist/${id}`);
            }, 1500);

        } catch (error) {
            console.error('Failed to update mixlist:', error);
            setSnackbar({ 
                open: true, 
                message: error.response?.data?.message || 'Failed to update mixlist', 
                severity: 'error' 
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/mixlist/${id}`);
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
                        Edit Mixlist
                    </Typography>
                </Box>

                <Card>
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Name */}
                                <TextField
                                    fullWidth
                                    label="Mixlist Name *"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
                                    placeholder="Enter a name for your mixlist"
                                />

                                {/* Description */}
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe what this mixlist is about..."
                                />

                                {/* Thumbnail URL */}
                                <TextField
                                    fullWidth
                                    label="Thumbnail URL"
                                    value={formData.thumbnail}
                                    onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    helperText="Optional: URL to an image for this mixlist"
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

                                {/* Action Buttons */}
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
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
        </Container>
    );
}

export default EditMixlistForm;
