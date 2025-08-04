import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container,
    Select, MenuItem, InputLabel, FormControl,
    Checkbox, FormControlLabel, Radio, RadioGroup,
    FormLabel, Chip, OutlinedInput
} from '@mui/material';
import { addMedia, getAllPlaylists, addMediaToPlaylist } from '../services/apiService';

function AddMediaForm() {
    const [title, setTitle] = useState('');
    const [mediaType, setMediaType] = useState('');
    const [link, setLink] = useState('');
    const [notes, setNotes] = useState('');
    const [consumed, setConsumed] = useState(false);
    const [dateConsumed, setDateConsumed] = useState('');
    const [rating, setRating] = useState('');
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
    
    // Playlist selection
    const [availablePlaylists, setAvailablePlaylists] = useState([]);
    const [selectedPlaylists, setSelectedPlaylists] = useState([]);
    const [playlistInput, setPlaylistInput] = useState('');
    
    const navigate = useNavigate();

    // Load available playlists on component mount
    useEffect(() => {
        const loadPlaylists = async () => {
            try {
                const response = await getAllPlaylists();
                setAvailablePlaylists(response.data);
            } catch (error) {
                console.error('Error loading playlists:', error);
            }
        };
        loadPlaylists();
    }, []);

    // Handle playlist selection
    const handlePlaylistKeyPress = (event) => {
        if (event.key === 'Enter' && playlistInput.trim()) {
            event.preventDefault();
            const playlist = availablePlaylists.find(p => 
                p.name.toLowerCase().includes(playlistInput.toLowerCase())
            );
            if (playlist && !selectedPlaylists.some(p => p.id === playlist.id)) {
                setSelectedPlaylists([...selectedPlaylists, playlist]);
            }
            setPlaylistInput('');
        }
    };

    const removePlaylist = (playlistToRemove) => {
        setSelectedPlaylists(selectedPlaylists.filter(playlist => playlist.id !== playlistToRemove.id));
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
        
        // Convert arrays to comma-separated strings for database storage
        const genresString = genres.length > 0 ? genres.join(', ') : null;
        const topicsString = topics.length > 0 ? topics.join(', ') : null;
        
        // Base media data
        let mediaData = { 
            title, 
            mediaType, 
            link, 
            notes, 
            consumed, 
            dateConsumed: consumed && dateConsumed ? dateConsumed : null,
            rating: consumed && rating ? rating : null,
            description: description || null,
            relatedNotes: relatedNotes || null,
            thumbnail: thumbnail || null,
            genre: genresString,
            topics: topicsString
        };

        try {
            let response;
            
            // Handle podcast-specific creation
            if (mediaType === 'Podcast') {
                if (podcastType === 'Series') {
                    // For now, create as regular media until PodcastSeriesController exists
                    response = await addMedia(mediaData);
                } else if (podcastType === 'Episode') {
                    // Create podcast episode with additional fields
                    const episodeData = {
                        title,
                        link,
                        notes,
                        description,
                        genre: genresString,
                        topics: topicsString,
                        relatedNotes,
                        thumbnail,
                        consumed,
                        dateConsumed: consumed && dateConsumed ? dateConsumed : null,
                        rating: consumed && rating ? rating : null,
                        PodcastSeriesId: podcastSeriesId, // Note capital P to match DTO
                        audioLink: audioLink || null,
                        releaseDate: releaseDate || null,
                        durationInSeconds: durationInSeconds ? parseInt(durationInSeconds) : 0
                    };
                    
                    response = await fetch('/api/podcastepisode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(episodeData)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
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
            
            // Add media to selected playlists
            if (selectedPlaylists.length > 0 && data.id) {
                for (const playlist of selectedPlaylists) {
                    try {
                        await addMediaToPlaylist(playlist.id, data.id);
                        console.log(`Added media to playlist: ${playlist.name}`);
                    } catch (playlistError) {
                        console.error(`Failed to add media to playlist ${playlist.name}:`, playlistError);
                    }
                }
            }
            
            console.log('Media added!', data);
            navigate(`/media/${data.id}`);
        } catch (error) {
            console.error('Failed to add media:', error);
            // You might want to show an error message to the user here
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
                        fontSize: '14px'
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

                {/* Consumed Checkbox */}
                <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={consumed}
                                onChange={(e) => setConsumed(e.target.checked)}
                                color="primary"
                            />
                        }
                        label="Already consumed this media?"
                        sx={{ 
                            '& .MuiFormControlLabel-label': { 
                                fontSize: '14px' 
                            }
                        }}
                    />
                </FormControl>

                {/* Conditional Date Consumed */}
                {consumed && (
                    <TextField
                        label="Date Consumed"
                        type="date"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={dateConsumed}
                        onChange={(e) => setDateConsumed(e.target.value)}
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
                {consumed && (
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
                        mb: 1, 
                        fontSize: '14px',
                        color: '#ffffff'
                    }}>
                        Upload Thumbnail
                    </Typography>
                    <Button
                        variant="outlined"
                        component="label"
                        sx={{ 
                            fontSize: '14px',
                            textTransform: 'none'
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
                            fontSize: '12px',
                            color: '#888'
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

                {/* Playlist Selection */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body1" sx={{ 
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#ffffff'
                        }}>
                            Add to Playlists
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate('/create-playlist')}
                            sx={{ 
                                fontSize: '12px',
                                textTransform: 'none',
                                minWidth: 'auto',
                                px: 2
                            }}
                        >
                            + New Playlist
                        </Button>
                    </Box>
                    <TextField
                        placeholder="Type to search playlists..."
                        variant="outlined"
                        fullWidth
                        value={playlistInput}
                        onChange={(e) => setPlaylistInput(e.target.value)}
                        onKeyPress={handlePlaylistKeyPress}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: '14px'
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: '#ffffff',
                                opacity: 1
                            }
                        }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedPlaylists.map((playlist) => (
                            <Chip
                                key={playlist.id}
                                label={playlist.name}
                                onDelete={() => removePlaylist(playlist)}
                                size="small"
                                sx={{ fontSize: '12px' }}
                            />
                        ))}
                    </Box>
                    {availablePlaylists.length > 0 && playlistInput && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '12px', color: '#888', mb: 1 }}>
                                Available playlists:
                            </Typography>
                            {availablePlaylists
                                .filter(playlist => 
                                    playlist.name.toLowerCase().includes(playlistInput.toLowerCase()) &&
                                    !selectedPlaylists.some(p => p.id === playlist.id)
                                )
                                .slice(0, 5)
                                .map(playlist => (
                                    <Chip
                                        key={playlist.id}
                                        label={playlist.name}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => {
                                            setSelectedPlaylists([...selectedPlaylists, playlist]);
                                            setPlaylistInput('');
                                        }}
                                        sx={{ 
                                            fontSize: '10px', 
                                            mr: 1, 
                                            mb: 1,
                                            cursor: 'pointer'
                                        }}
                                    />
                                ))
                            }
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