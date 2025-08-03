import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container,
    Select, MenuItem, InputLabel, FormControl,
    Checkbox, FormControlLabel
} from '@mui/material';
import { addMedia } from '../services/apiService';

function AddMediaForm() {
    const [title, setTitle] = useState('');
    const [mediaType, setMediaType] = useState('');
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const [consumed, setConsumed] = useState(false);
    const [rating, setRating] = useState('');
    const [description, setDescription] = useState('');
    const [relatedNotes, setRelatedNotes] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    
    // Podcast Episode specific fields
    const [podcastSeriesId, setPodcastSeriesId] = useState('');
    const [audioLink, setAudioLink] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [durationInSeconds, setDurationInSeconds] = useState('');
    
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Base media data
        let mediaData = { 
            title, 
            mediaType, 
            link, 
            notes, 
            consumed, 
            rating: rating || null,
            description: description || null,
            relatedNotes: relatedNotes || null,
            thumbnail: thumbnail || null
        };

        // Add specific fields based on media type
        if (mediaType === 'Podcast') {
            mediaData = {
                ...mediaData,
                podcastSeriesId: podcastSeriesId || null,
                audioLink: audioLink || null,
                releaseDate: releaseDate || null,
                durationInSeconds: durationInSeconds ? parseInt(durationInSeconds) : null
            };
        }

        try {
            const response = await addMedia(mediaData);
            console.log('Media added!', response.data);
            navigate(`/media/${response.data.id}`);
        } catch (error) {
            console.error('Failed to add media:', error);
        }
    };

    // Convert duration from minutes to seconds
    const handleDurationChange = (e) => {
        const minutes = e.target.value;
        if (minutes) {
            setDurationInSeconds((parseFloat(minutes) * 60).toString());
        } else {
            setDurationInSeconds('');
        }
    };

    const renderMediaTypeSpecificFields = () => {
        switch (mediaType) {
            case 'Podcast':
                return (
                    <>
                        <TextField
                            label="Podcast Series ID (Optional)"
                            placeholder="Enter podcast series ID..."
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={podcastSeriesId}
                            onChange={(e) => setPodcastSeriesId(e.target.value)}
                            sx={{
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#ffffff',
                                    opacity: 1
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#ffffff'
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#ffffff'
                                }
                            }}
                        />
                        <TextField
                            label="Audio Link (Optional)"
                            placeholder="https://example.com/audio.mp3"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={audioLink}
                            onChange={(e) => setAudioLink(e.target.value)}
                            sx={{
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#ffffff',
                                    opacity: 1
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#ffffff'
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#ffffff'
                                }
                            }}
                        />
                        <TextField
                            label="Release Date (Optional)"
                            type="date"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={releaseDate}
                            onChange={(e) => setReleaseDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: '#ffffff'
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#ffffff'
                                }
                            }}
                        />
                        <TextField
                            label="Duration (Minutes, Optional)"
                            placeholder="60"
                            type="number"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={durationInSeconds ? (parseInt(durationInSeconds) / 60).toString() : ''}
                            onChange={handleDurationChange}
                            sx={{
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#ffffff',
                                    opacity: 1
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#ffffff'
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#ffffff'
                                }
                            }}
                        />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            py: 4,
            px: 2
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
                <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
                    Add New Media
                </Typography>
                
                <TextField
                    label="Title"
                    placeholder="Enter media title..."
                    variant="outlined"
                    fullWidth
                    required
                    margin="normal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        },
                        '& .MuiInputLabel-root': {
                            color: '#ffffff'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}
                />

                <FormControl fullWidth margin="normal" required sx={{
                    '& .MuiInputLabel-root': {
                        color: '#ffffff'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ffffff'
                    }
                }}>
                    <InputLabel id="media-type-label">Media Type</InputLabel>
                    <Select
                        labelId="media-type-label"
                        value={mediaType}
                        label="Media Type"
                        onChange={(e) => setMediaType(e.target.value)}
                    >
                        <MenuItem value="Article">Article</MenuItem>
                        <MenuItem value="Podcast">Podcast</MenuItem>
                        <MenuItem value="Book">Book</MenuItem>
                        <MenuItem value="Website">Website</MenuItem>
                        <MenuItem value="Document">Document</MenuItem>
                        <MenuItem value="Movie">Movie</MenuItem>
                        <MenuItem value="TVShow">TV Show</MenuItem>
                        <MenuItem value="Music">Music</MenuItem>
                        <MenuItem value="Video">Video</MenuItem>
                        <MenuItem value="VideoGame">Video Game</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Link (Optional)"
                    placeholder="https://example.com"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    sx={{
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        },
                        '& .MuiInputLabel-root': {
                            color: '#ffffff'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}
                />

                <TextField
                    label="Description (Optional)"
                    placeholder="Brief description of the media..."
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        },
                        '& .MuiInputLabel-root': {
                            color: '#ffffff'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}
                />

                {/* Media type specific fields */}
                {renderMediaTypeSpecificFields()}

                <FormControl fullWidth margin="normal">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={consumed}
                                onChange={(e) => setConsumed(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Already consumed this media?"
                    />
                </FormControl>

                <FormControl fullWidth margin="normal" sx={{
                    '& .MuiInputLabel-root': {
                        color: '#ffffff'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ffffff'
                    }
                }}>
                    <InputLabel id="rating-label">Rating (Optional)</InputLabel>
                    <Select
                        labelId="rating-label"
                        value={rating}
                        label="Rating (Optional)"
                        onChange={(e) => setRating(e.target.value)}
                    >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="SuperLike">Super Like</MenuItem>
                        <MenuItem value="Like">Like</MenuItem>
                        <MenuItem value="Neutral">Neutral</MenuItem>
                        <MenuItem value="Dislike">Dislike</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Notes (Optional)"
                    placeholder="Add any notes or thoughts about this media..."
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        },
                        '& .MuiInputLabel-root': {
                            color: '#ffffff'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}
                />

                <TextField
                    label="Related Notes/Links (Optional)"
                    placeholder="Links to Obsidian notes or other documents..."
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                    value={relatedNotes}
                    onChange={(e) => setRelatedNotes(e.target.value)}
                    sx={{
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        },
                        '& .MuiInputLabel-root': {
                            color: '#ffffff'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}
                />

                <TextField
                    label="Thumbnail URL (Optional)"
                    placeholder="https://example.com/thumbnail.jpg"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    sx={{
                        '& .MuiInputBase-input::placeholder': {
                            color: '#ffffff',
                            opacity: 1
                        },
                        '& .MuiInputLabel-root': {
                            color: '#ffffff'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}
                />

                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '100%' }}>
                    Save Media
                </Button>
            </Box>
        </Box>
    );
}

export default AddMediaForm;