import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container,
    Select, MenuItem, InputLabel, FormControl,
    Checkbox, FormControlLabel, Radio, RadioGroup,
    FormLabel, Chip, OutlinedInput, Paper, Grid
} from '@mui/material';
import { addMedia, getAllMixlists, addMediaToMixlist, addPodcastEpisode } from '../services/apiService';

function AddMediaForm() {
    const [title, setTitle] = useState('');
    const [mediaType, setMediaType] = useState('');
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Uncharted'); // Changed from consumed to status
    const [dateCompleted, setDateCompleted] = useState(''); // Changed from dateConsumed
    const [rating, setRating] = useState('');
    const [ownershipStatus, setOwnershipStatus] = useState('');
    const [description, setDescription] = useState('');
    const [relatedNotes, setRelatedNotes] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [genres, setGenres] = useState([]);
    const [genreInput, setGenreInput] = useState('');
    const [topics, setTopics] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    
    // Podcast specific fields
    const [podcastType, setPodcastType] = useState(''); // 'Series' or 'Episode'
    const [podcastSeriesId, setPodcastSeriesId] = useState('');
    const [audioLink, setAudioLink] = useState('');
    const [releaseDate, setReleaseDate] = useState('');
    const [durationInSeconds, setDurationInSeconds] = useState('');
    
    // Mixlist selection
    const [availableMixlists, setAvailableMixlists] = useState([]);
    const [selectedMixlists, setSelectedMixlists] = useState([]);
    const [mixlistInput, setMixlistInput] = useState('');
    
    const navigate = useNavigate();

    // Load available mixlists on component mount
    useEffect(() => {
        const loadMixlists = async () => {
            try {
                console.log('Loading mixlists...');
                const response = await getAllMixlists();
                console.log('Mixlists response:', response);
                console.log('Mixlists data:', response.data);
                setAvailableMixlists(response.data);
            } catch (error) {
                console.error('Error loading mixlists:', error);
                console.error('Error details:', error.response?.data);
                console.error('Error status:', error.response?.status);
            }
        };
        loadMixlists();
    }, []);

    // Handle mixlist selection
    const handleMixlistKeyPress = (event) => {
        if (event.key === 'Enter' && mixlistInput.trim()) {
            event.preventDefault();
            const mixlist = availableMixlists.find(p => {
                const name = p.Name || p.name || '';
                return name.toLowerCase().includes(mixlistInput.toLowerCase());
            });
            if (mixlist && !selectedMixlists.some(p => (p.Id || p.id) === (mixlist.Id || mixlist.id))) {
                // Normalize the mixlist object
                const normalizedMixlist = {
                    ...mixlist,
                    Id: mixlist.Id || mixlist.id,
                    Name: mixlist.Name || mixlist.name || `Mixlist ${mixlist.Id || mixlist.id}`
                };
                setSelectedMixlists([...selectedMixlists, normalizedMixlist]);
                setMixlistInput('');
            }
        }
    };

    const removeMixlist = (mixlistToRemove) => {
        setSelectedMixlists(selectedMixlists.filter(mixlist => mixlist.Id !== mixlistToRemove.Id));
    };

    // Handle genre input
    const handleGenreKeyPress = (event) => {
        if (event.key === 'Enter' && genreInput.trim()) {
            event.preventDefault();
            if (!genres.includes(genreInput.trim())) {
                setGenres([...genres, genreInput.trim()]);
            }
            setGenreInput('');
        }
    };

    const removeGenre = (genreToRemove) => {
        setGenres(genres.filter(genre => genre !== genreToRemove));
    };

    // Handle topic input
    const handleTopicKeyPress = (event) => {
        if (event.key === 'Enter' && topicInput.trim()) {
            event.preventDefault();
            if (!topics.includes(topicInput.trim())) {
                setTopics([...topics, topicInput.trim()]);
            }
            setTopicInput('');
        }
    };

    const removeTopic = (topicToRemove) => {
        setTopics(topics.filter(topic => topic !== topicToRemove));
    };

    // Handle thumbnail file upload
    const handleThumbnailUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setThumbnailFile(file);
            // TODO: Upload to document storage and set thumbnail URL
            // For now, we'll just show the filename
            console.log('Thumbnail file selected:', file.name);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Base media data - CRITICAL: Use Pascal case to match backend DTO
        let mediaData = { 
            Title: title, 
            MediaType: mediaType, 
            Status: status, // Required field
            Topics: topics.length > 0 ? topics : [], // Required array
            Genres: genres.length > 0 ? genres : [] // Required array
        };
        
        // Add optional fields only if they have values
        if (link && link.trim()) mediaData.Link = link;
        if (notes && notes.trim()) mediaData.Notes = notes;
        if (status === 'Completed' && dateCompleted) mediaData.DateCompleted = dateCompleted;
        if (status === 'Completed' && rating) mediaData.Rating = rating;
        if (ownershipStatus) mediaData.OwnershipStatus = ownershipStatus;
        if (description && description.trim()) mediaData.Description = description;
        if (relatedNotes && relatedNotes.trim()) mediaData.RelatedNotes = relatedNotes;
        if (thumbnail && thumbnail.trim()) mediaData.Thumbnail = thumbnail;

        try {
            // Basic validation
            if (!title.trim()) {
                alert('Title is required');
                return;
            }
            if (!mediaType) {
                alert('Media Type is required');
                return;
            }
            
            console.log('Submitting media data:', mediaData);
            console.log('Raw form values:', { title, mediaType, status, ownershipStatus, rating });
            
            // Check if media type is supported by backend
            if (mediaType !== 'Podcast') {
                alert('Currently only Podcast media type is supported by the backend. Other media types are not yet implemented.');
                return;
            }
            
            let response;
            
            // Handle podcast-specific creation
            if (mediaType === 'Podcast') {
                if (podcastType === 'Series') {
                    // For now, create as regular media until PodcastSeriesController exists
                    response = await addMedia(mediaData);
                } else if (podcastType === 'Episode') {
                    // Create podcast episode with additional fields - Pascal case for backend
                    const episodeData = {
                        Title: title,
                        Link: link,
                        Notes: notes,
                        Description: description,
                        Status: status,
                        DateCompleted: status === 'Completed' && dateCompleted ? dateCompleted : null,
                        Rating: status === 'Completed' && rating ? rating : null,
                        OwnershipStatus: ownershipStatus || null,
                        Topics: topics.length > 0 ? topics : [], // Ensure proper array format
                        Genres: genres.length > 0 ? genres : [], // Ensure proper array format
                        RelatedNotes: relatedNotes,
                        Thumbnail: thumbnail,
                        PodcastSeriesId: podcastSeriesId, // Capital P to match DTO
                        AudioLink: audioLink || null,
                        ReleaseDate: releaseDate || null,
                        DurationInSeconds: durationInSeconds ? parseInt(durationInSeconds) : 0
                    };
                    
                    response = await addPodcastEpisode(episodeData);
                } else {
                    // No podcast type selected, create as regular media
                    response = await addMedia(mediaData);
                }
            } else {
                // Create regular media item
                response = await addMedia(mediaData);
            }

            // Handle different response types
            let data;
            if (response.json) {
                // Fetch response
                data = await response.json();
            } else {
                // addMedia response (axios)
                data = response.data;
            }
            
            console.log('Response data received:', data);
            
            // Add media to selected mixlists
            const mediaId = data.id || data.Id; // Handle both lowercase and uppercase Id
            if (selectedMixlists.length > 0 && mediaId) {
                for (const mixlist of selectedMixlists) {
                    try {
                        await addMediaToMixlist(mixlist.Id, mediaId);
                        console.log(`Added media to mixlist: ${mixlist.Name}`);
                    } catch (mixlistError) {
                        console.error(`Failed to add media to mixlist ${mixlist.Name}:`, mixlistError);
                    }
                }
            }
            
            console.log('Media added!', data);
            navigate(`/media/${mediaId}`);
        } catch (error) {
            console.error('Failed to add media:', error);
            console.error('Error details:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Full error response:', error.response);
            
            // More detailed error message
            let errorMessage = 'Unknown error';
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.errors) {
                    // Handle validation errors
                    const validationErrors = Object.entries(error.response.data.errors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('\n');
                    errorMessage = `Validation errors:\n${validationErrors}`;
                } else {
                    errorMessage = JSON.stringify(error.response.data);
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Show error to user
            alert(`Failed to add media (Status ${error.response?.status}):\n${errorMessage}`);
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
        if (mediaType === 'Podcast') {
            return (
                <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '18px', fontWeight: 'bold' }}>
                        Podcast Type
                    </Typography>
                    
                    <FormControl component="fieldset" fullWidth margin="normal">
                        <FormLabel component="legend" sx={{ 
                            color: '#ffffff',
                            fontSize: '14px',
                            '&.Mui-focused': { color: '#ffffff' }
                        }}>
                            Choose podcast type:
                        </FormLabel>
                        <RadioGroup
                            value={podcastType}
                            onChange={(e) => setPodcastType(e.target.value)}
                            row
                            sx={{ mt: 1 }}
                        >
                            <FormControlLabel 
                                value="Series" 
                                control={<Radio />} 
                                label="Series"
                                sx={{ 
                                    '& .MuiFormControlLabel-label': { fontSize: '14px' }
                                }}
                            />
                            <FormControlLabel 
                                value="Episode" 
                                control={<Radio />} 
                                label="Episode"
                                sx={{ 
                                    '& .MuiFormControlLabel-label': { fontSize: '14px' }
                                }}
                            />
                        </RadioGroup>
                    </FormControl>

                    {podcastType === 'Episode' && (
                        <>
                            <TextField
                                label="Podcast Series"
                                placeholder="Select or add podcast series..."
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={podcastSeriesId}
                                onChange={(e) => setPodcastSeriesId(e.target.value)}
                                sx={{
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
                            <TextField
                                label="Duration (Minutes)"
                                placeholder="60"
                                type="number"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={durationInSeconds ? (parseInt(durationInSeconds) / 60).toString() : ''}
                                onChange={handleDurationChange}
                                sx={{
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
                        </>
                    )}
                </Box>
            );
        }
        return null;
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
            },
            '& .MuiSelect-select': {
                fontSize: '16px !important'
            },
            '& .MuiFormControlLabel-label': {
                fontSize: '16px !important'
            }
        }}>
            <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ 
                    width: '100%',
                    maxWidth: '600px',
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
                    Add New Media
                </Typography>
                
                {/* Title - Prominent heading */}
                <Typography variant="h5" sx={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    mb: 1,
                    color: '#ffffff'
                }}>
                    Title
                </Typography>
                <TextField
                    placeholder="Enter media title..."
                    variant="outlined"
                    fullWidth
                    required
                    margin="normal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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

                {/* Media Type */}
                <FormControl fullWidth margin="normal" required sx={{
                    mb: 3,
                    '& .MuiInputLabel-root': {
                        color: '#ffffff',
                        fontSize: '16px'
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
                        sx={{
                            '& .MuiSelect-select': {
                                fontSize: '16px'
                            }
                        }}
                    >
                        <MenuItem value="Article">Article</MenuItem>
                        <MenuItem value="Book">Book</MenuItem>
                        <MenuItem value="Document">Document</MenuItem>
                        <MenuItem value="Movie">Movie</MenuItem>
                        <MenuItem value="Music">Music</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                        <MenuItem value="Podcast">Podcast</MenuItem>
                        <MenuItem value="TVShow">TV Show</MenuItem>
                        <MenuItem value="Video">Video</MenuItem>
                        <MenuItem value="VideoGame">Video Game</MenuItem>
                        <MenuItem value="Website">Website</MenuItem>
                    </Select>
                </FormControl>

                {/* Link */}
                <TextField
                    label="Link"
                    placeholder="https://example.com"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    sx={{
                        mb: 3,
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

                {/* Description */}
                <TextField
                    label="Description"
                    placeholder="Brief description of the media..."
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    margin="normal"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{
                        mb: 3,
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

                {/* Status Selection */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        mb: 2,
                        color: '#ffffff'
                    }}>
                        Status
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            row
                            sx={{ gap: 2 }}
                        >
                            <FormControlLabel 
                                value="Uncharted" 
                                control={<Radio size="small" />} 
                                label="Uncharted"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                            />
                            <FormControlLabel 
                                value="ActivelyExploring" 
                                control={<Radio size="small" />} 
                                label="Actively Exploring"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                            />
                            <FormControlLabel 
                                value="Completed" 
                                control={<Radio size="small" />} 
                                label="Completed"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                            />
                            <FormControlLabel 
                                value="Abandoned" 
                                control={<Radio size="small" />} 
                                label="Abandoned"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '14px' } }}
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>

                {/* Conditional Date Completed */}
                {status === 'Completed' && (
                    <TextField
                        label="Date Completed"
                        type="date"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={dateCompleted}
                        onChange={(e) => setDateCompleted(e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-input': {
                                fontSize: '14px'
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
                )}

                {/* Conditional Rating */}
                {status === 'Completed' && (
                    <FormControl fullWidth margin="normal" sx={{
                        mb: 3,
                        '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            fontSize: '14px'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}>
                        <InputLabel id="rating-label">Rating</InputLabel>
                        <Select
                            labelId="rating-label"
                            value={rating}
                            label="Rating"
                            onChange={(e) => setRating(e.target.value)}
                            sx={{
                                '& .MuiSelect-select': {
                                    fontSize: '14px'
                                }
                            }}
                        >
                            <MenuItem value="">None</MenuItem>
                            <MenuItem value="SuperLike">Super Like</MenuItem>
                            <MenuItem value="Like">Like</MenuItem>
                            <MenuItem value="Neutral">Neutral</MenuItem>
                            <MenuItem value="Dislike">Dislike</MenuItem>
                        </Select>
                    </FormControl>
                )}

                {/* Ownership Status */}
                <FormControl fullWidth margin="normal" sx={{
                    mb: 3,
                    '& .MuiInputLabel-root': {
                        color: '#ffffff',
                        fontSize: '14px'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ffffff'
                    }
                }}>
                    <InputLabel id="ownership-label">Ownership Status</InputLabel>
                    <Select
                        labelId="ownership-label"
                        value={ownershipStatus}
                        label="Ownership Status"
                        onChange={(e) => setOwnershipStatus(e.target.value)}
                        sx={{
                            '& .MuiSelect-select': {
                                fontSize: '14px'
                            }
                        }}
                    >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="Own">Own</MenuItem>
                        <MenuItem value="Rented">Rented</MenuItem>
                        <MenuItem value="Streamed">Streamed</MenuItem>
                    </Select>
                </FormControl>

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
                </Box>

                {/* Genres */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        label="Genres"
                        placeholder="Type a genre and press Enter..."
                        variant="outlined"
                        fullWidth
                        value={genreInput}
                        onChange={(e) => setGenreInput(e.target.value)}
                        onKeyPress={handleGenreKeyPress}
                        sx={{
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
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {genres.map((genre, index) => (
                            <Chip
                                key={index}
                                label={genre}
                                onDelete={() => removeGenre(genre)}
                                size="small"
                                sx={{ fontSize: '12px' }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Topics */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        label="Topics"
                        placeholder="Type a topic and press Enter..."
                        variant="outlined"
                        fullWidth
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyPress={handleTopicKeyPress}
                        sx={{
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
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {topics.map((topic, index) => (
                            <Chip
                                key={index}
                                label={topic}
                                onDelete={() => removeTopic(topic)}
                                size="small"
                                sx={{ fontSize: '12px' }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* Notes */}
                <TextField
                    label="Notes"
                    placeholder="Add any notes or thoughts about this media..."
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{
                        mb: 3,
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

                {/* Mixlist Selection */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ 
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#ffffff'
                        }}>
                            Add to Mixlists
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => navigate('/create-mixlist')}
                            sx={{ 
                                fontSize: '16px',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                py: 1.5,
                                px: 3,
                                borderRadius: '8px'
                            }}
                        >
                            + New Mixlist
                        </Button>
                    </Box>
                    <TextField
                        placeholder="Type to search mixlists..."
                        variant="outlined"
                        fullWidth
                        value={mixlistInput}
                        onChange={(e) => setMixlistInput(e.target.value)}
                        onKeyPress={handleMixlistKeyPress}
                        sx={{
                            mb: 2,
                            '& .MuiInputBase-input': {
                                fontSize: '16px'
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: '#ffffff',
                                opacity: 1
                            }
                        }}
                    />
                    
                    {/* Selected Mixlists */}
                    {selectedMixlists.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ 
                                fontSize: '14px', 
                                color: '#ffffff', 
                                mb: 1,
                                fontWeight: 'bold'
                            }}>
                                Selected mixlists:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {selectedMixlists.map((mixlist) => (
                                    <Chip
                                        key={mixlist.Id}
                                        label={mixlist.Name}
                                        onDelete={() => removeMixlist(mixlist)}
                                        size="small"
                                        sx={{ fontSize: '14px' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                    
                    {/* Available Mixlists */}
                    {availableMixlists.length > 0 && mixlistInput && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ 
                                fontSize: '14px', 
                                color: '#ffffff', 
                                mb: 1,
                                fontWeight: 'bold'
                            }}>
                                Available mixlists:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {availableMixlists
                                    .filter(mixlist => {
                                        // Handle both Name and name properties, and Id vs id
                                        const name = mixlist.Name || mixlist.name || '';
                                        const id = mixlist.Id || mixlist.id;
                                        return name.toLowerCase().includes(mixlistInput.toLowerCase()) &&
                                            !selectedMixlists.some(p => (p.Id || p.id) === id);
                                    })
                                    .slice(0, 5)
                                    .map(mixlist => {
                                        // Ensure we have consistent property names
                                        const normalizedMixlist = {
                                            ...mixlist,
                                            Id: mixlist.Id || mixlist.id,
                                            Name: mixlist.Name || mixlist.name || `Mixlist ${mixlist.Id || mixlist.id}`
                                        };
                                        
                                        return (
                                            <Chip
                                                key={normalizedMixlist.Id}
                                                label={normalizedMixlist.Name}
                                                variant="outlined"
                                                size="small"
                                                onClick={() => {
                                                    setSelectedMixlists([...selectedMixlists, normalizedMixlist]);
                                                    setMixlistInput('');
                                                }}
                                                sx={{ 
                                                    fontSize: '12px', 
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Box>
                        </Box>
                    )}
                    

                </Box>

                {/* Media type specific fields */}
                {renderMediaTypeSpecificFields()}

                <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    sx={{ 
                        mt: 3, 
                        width: '100%',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        py: 1.5
                    }}
                >
                    Save Media
                </Button>
            </Box>
        </Box>
    );
}

export default AddMediaForm;