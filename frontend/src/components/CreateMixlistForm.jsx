import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container
} from '@mui/material';
import { createMixlist, uploadThumbnail } from '../services/apiService';

function CreateMixlistForm() {
    const [name, setName] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

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
                setThumbnail(thumbnailUrl);
                console.log('Thumbnail uploaded successfully:', thumbnailUrl);
            } catch (error) {
                console.error('Error uploading thumbnail:', error);
                alert('Failed to upload thumbnail. Please try again.');
                setThumbnailFile(null);
            }
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        try {
            // Create mixlist data
            const mixlistData = {
                name: name.trim(),
                thumbnail: thumbnail || `https://picsum.photos/400/400?random=${Date.now()}&blur=1`
            };

            console.log('Attempting to create mixlist with data:', mixlistData);
            const response = await createMixlist(mixlistData);
            console.log('Mixlist created!', response);
            console.log('Mixlist data:', response.data);
            
            // Navigate to the mixlist or back to mixlists list
            navigate('/mixlists'); // Updated route
        } catch (error) {
            console.error('Failed to create mixlist:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            alert(`Failed to create mixlist: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            py: 4,
            px: 2,
            // Global font size override for this form
            '& .MuiInputBase-input': {
                fontSize: '16px !important'
            },
            '& .MuiInputLabel-root': {
                fontSize: '16px !important'
            }
        }}>
            <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ 
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'background.paper',
                    borderRadius: '16px',
                    p: 4,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom sx={{ 
                    textAlign: 'center', 
                    fontSize: '28px',
                    fontWeight: 'bold',
                    mb: 3
                }}>
                    Create New Mixlist
                </Typography>
                
                {/* Mixlist Name */}
                <Typography variant="h5" sx={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    mb: 1,
                    color: '#ffffff'
                }}>
                    Mixlist Name
                </Typography>
                <TextField
                    placeholder="Enter mixlist name..."
                    variant="outlined"
                    fullWidth
                    required
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{
                        mb: 3,
                        '& .MuiInputBase-input': {
                            fontSize: '16px'
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        }
                    }}
                />

                {/* Thumbnail URL */}
                <TextField
                    label="Thumbnail URL"
                    placeholder="https://example.com/thumbnail.jpg"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    sx={{
                        mb: 2,
                        '& .MuiInputBase-input': {
                            fontSize: '14px'
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        },
                        '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            fontSize: '14px'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}
                />

                {/* Thumbnail Upload */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ 
                        mb: 2, 
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                    }}>
                        Upload Thumbnail
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
                            color: '#ffffff'
                        }}>
                            Selected: {thumbnailFile.name}
                        </Typography>
                    )}
                    {thumbnail && (
                        <Typography variant="body2" sx={{ 
                            mt: 1, 
                            fontSize: '14px',
                            color: '#22c55e'
                        }}>
                            ✓ Thumbnail uploaded successfully
                        </Typography>
                    )}
                </Box>

                {/* Info about thumbnail generation */}
                <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                    <Typography variant="body2" sx={{ 
                        fontSize: '14px',
                        color: '#ffffff',
                        opacity: 0.8
                    }}>
                        🎨 Upload a custom thumbnail or leave empty for a placeholder image.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                    <Button 
                        type="button"
                        variant="outlined" 
                        onClick={() => navigate(-1)}
                        sx={{ 
                            flex: 1,
                            fontSize: '16px',
                            fontWeight: 'bold',
                            py: 1.5
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        disabled={!name || isSubmitting}
                        sx={{ 
                            flex: 2,
                            fontSize: '16px',
                            fontWeight: 'bold',
                            py: 1.5
                        }}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Mixlist'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default CreateMixlistForm;
