import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField, Button, Box, Typography, Container,
    Select, MenuItem, InputLabel, FormControl,
    Checkbox, FormControlLabel, Radio, RadioGroup,
    FormLabel, Chip, OutlinedInput, Paper, Grid,
    Autocomplete
} from '@mui/material';
import { 
    addMedia, getAllMixlists, addMediaToMixlist, createPodcastEpisode,
    searchTopics, searchGenres, searchPodcastSeries, createBook,
    createMovie, createTvShow, uploadThumbnail
} from '../services/apiService';

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
    
    // Book specific fields
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [asin, setAsin] = useState('');
    const [format, setFormat] = useState('Digital'); // 'Digital' or 'Physical'
    const [partOfSeries, setPartOfSeries] = useState(false);
    
    // Movie specific fields
    const [director, setDirector] = useState('');
    const [cast, setCast] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [runtimeMinutes, setRuntimeMinutes] = useState('');
    const [mpaaRating, setMpaaRating] = useState('');
    const [imdbId, setImdbId] = useState('');
    const [tmdbId, setTmdbId] = useState('');
    const [tmdbRating, setTmdbRating] = useState('');
    const [tagline, setTagline] = useState('');
    const [homepage, setHomepage] = useState('');
    const [originalLanguage, setOriginalLanguage] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');
    
    // TV Show specific fields
    const [creator, setCreator] = useState('');
    const [firstAirYear, setFirstAirYear] = useState('');
    const [lastAirYear, setLastAirYear] = useState('');
    const [numberOfSeasons, setNumberOfSeasons] = useState('');
    const [numberOfEpisodes, setNumberOfEpisodes] = useState('');
    const [contentRating, setContentRating] = useState('');
    const [originalName, setOriginalName] = useState('');
    
    // Mixlist selection
    const [availableMixlists, setAvailableMixlists] = useState([]);
    const [selectedMixlists, setSelectedMixlists] = useState([]);
    const [mixlistInput, setMixlistInput] = useState('');
    
    // Autocomplete states
    const [topicSuggestions, setTopicSuggestions] = useState([]);
    const [genreSuggestions, setGenreSuggestions] = useState([]);
    const [podcastSeriesSuggestions, setPodcastSeriesSuggestions] = useState([]);
    const [selectedPodcastSeries, setSelectedPodcastSeries] = useState(null);
    
    // Validation errors
    const [validationErrors, setValidationErrors] = useState({});
    
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
            const normalizedGenre = genreInput.trim().toLowerCase();
            if (!genres.includes(normalizedGenre)) {
                setGenres([...genres, normalizedGenre]);
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
            const normalizedTopic = topicInput.trim().toLowerCase();
            if (!topics.includes(normalizedTopic)) {
                setTopics([...topics, normalizedTopic]);
            }
            setTopicInput('');
        }
    };

    const removeTopic = (topicToRemove) => {
        setTopics(topics.filter(topic => topic !== topicToRemove));
    };

    // Autocomplete search functions
    const handleTopicSearch = async (inputValue) => {
        if (inputValue.length > 0) {
            try {
                const response = await searchTopics(inputValue);
                setTopicSuggestions(response.data);
            } catch (error) {
                console.error('Error searching topics:', error);
                setTopicSuggestions([]);
            }
        } else {
            setTopicSuggestions([]);
        }
    };

    const handleGenreSearch = async (inputValue) => {
        if (inputValue.length > 0) {
            try {
                const response = await searchGenres(inputValue);
                setGenreSuggestions(response.data);
            } catch (error) {
                console.error('Error searching genres:', error);
                setGenreSuggestions([]);
            }
        } else {
            setGenreSuggestions([]);
        }
    };

    const handlePodcastSeriesSearch = async (inputValue) => {
        if (inputValue.length > 0) {
            try {
                const response = await searchPodcastSeries(inputValue);
                setPodcastSeriesSuggestions(response.data);
            } catch (error) {
                console.error('Error searching podcast series:', error);
                setPodcastSeriesSuggestions([]);
            }
        } else {
            setPodcastSeriesSuggestions([]);
        }
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
        
        // Base media data - Using camelCase to match backend DTO
        let mediaData = { 
            title: title, 
            mediaType: mediaType, 
            status: status, // Required field
            topics: topics.length > 0 ? topics : [], // Required array
            genres: genres.length > 0 ? genres : [] // Required array
        };
        
        // Add optional fields only if they have values
        if (link && link.trim()) mediaData.link = link;
        if (notes && notes.trim()) mediaData.notes = notes;
        if (status === 'Completed' && dateCompleted) mediaData.dateCompleted = dateCompleted;
        if (status === 'Completed' && rating) mediaData.rating = rating;
        if (ownershipStatus) mediaData.ownershipStatus = ownershipStatus;
        if (description && description.trim()) mediaData.description = description;
        if (relatedNotes && relatedNotes.trim()) mediaData.relatedNotes = relatedNotes;
        if (thumbnail && thumbnail.trim()) mediaData.thumbnail = thumbnail;

        try {
            // Clear previous validation errors
            setValidationErrors({});
            
            // Basic validation
            const errors = {};
            if (!title.trim()) {
                errors.title = 'Title is required';
            }
            if (!mediaType) {
                errors.mediaType = 'Media Type is required';
            }
            
            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                return;
            }
            
            console.log('Submitting media data:', mediaData);
            console.log('Raw form values:', { title, mediaType, status, ownershipStatus, rating });
            
            // Check if media type is supported by backend
            if (mediaType !== 'Podcast' && mediaType !== 'Book' && mediaType !== 'Movie' && mediaType !== 'TVShow') {
                alert('Currently only Podcast, Book, Movie, and TVShow media types are supported by the backend. Other media types are not yet implemented.');
                return;
            }
            
            let response;
            
            // Handle book-specific creation
            if (mediaType === 'Book') {
                const bookData = {
                    title: title,
                    link: link,
                    notes: notes,
                    description: description,
                    status: status,
                    dateCompleted: status === 'Completed' && dateCompleted ? dateCompleted : null,
                    rating: status === 'Completed' && rating ? rating : null,
                    ownershipStatus: ownershipStatus || null,
                    topics: topics.length > 0 ? topics : [],
                    genres: genres.length > 0 ? genres : [],
                    relatedNotes: relatedNotes,
                    thumbnail: thumbnail,
                    author: author,
                    isbn: isbn || null,
                    asin: asin || null,
                    format: format,
                    partOfSeries: partOfSeries
                };
                
                response = await createBook(bookData);
            }
            // Handle podcast-specific creation
            else if (mediaType === 'Podcast') {
                if (podcastType === 'Series') {
                    // For now, create as regular media until PodcastSeriesController exists
                    response = await addMedia(mediaData);
                } else if (podcastType === 'Episode') {
                    // Create podcast episode with additional fields - camelCase for backend
                    const episodeData = {
                        title: title,
                        link: link,
                        notes: notes,
                        description: description,
                        status: status,
                        dateCompleted: status === 'Completed' && dateCompleted ? dateCompleted : null,
                        rating: status === 'Completed' && rating ? rating : null,
                        ownershipStatus: ownershipStatus || null,
                        topics: topics.length > 0 ? topics : [], // Ensure proper array format
                        genres: genres.length > 0 ? genres : [], // Ensure proper array format
                        relatedNotes: relatedNotes,
                        thumbnail: thumbnail,
                        parentPodcastId: selectedPodcastSeries?.id || selectedPodcastSeries?.Id || podcastSeriesId,
                        audioLink: audioLink || null,
                        releaseDate: releaseDate || null,
                        durationInSeconds: durationInSeconds ? parseInt(durationInSeconds) : 0
                    };
                    
                    response = await createPodcastEpisode(episodeData);
                } else {
                    // No podcast type selected, create as regular media
                    response = await addMedia(mediaData);
                }
            }
            // Handle movie-specific creation
            else if (mediaType === 'Movie') {
                const movieData = {
                    title: title,
                    link: link,
                    notes: notes,
                    description: description,
                    status: status,
                    dateCompleted: status === 'Completed' && dateCompleted ? dateCompleted : null,
                    rating: status === 'Completed' && rating ? rating : null,
                    ownershipStatus: ownershipStatus || null,
                    topics: topics.length > 0 ? topics : [],
                    genres: genres.length > 0 ? genres : [],
                    relatedNotes: relatedNotes,
                    thumbnail: thumbnail,
                    director: director || null,
                    cast: cast || null,
                    releaseYear: releaseYear ? parseInt(releaseYear) : null,
                    runtimeMinutes: runtimeMinutes ? parseInt(runtimeMinutes) : null,
                    mpaaRating: mpaaRating || null,
                    imdbId: imdbId || null,
                    tmdbId: tmdbId || null,
                    tmdbRating: tmdbRating ? parseFloat(tmdbRating) : null,
                    tagline: tagline || null,
                    homepage: homepage || null,
                    originalLanguage: originalLanguage || null,
                    originalTitle: originalTitle || null
                };
                
                response = await createMovie(movieData);
            }
            // Handle TV show-specific creation
            else if (mediaType === 'TVShow') {
                const tvShowData = {
                    title: title,
                    link: link,
                    notes: notes,
                    description: description,
                    status: status,
                    dateCompleted: status === 'Completed' && dateCompleted ? dateCompleted : null,
                    rating: status === 'Completed' && rating ? rating : null,
                    ownershipStatus: ownershipStatus || null,
                    topics: topics.length > 0 ? topics : [],
                    genres: genres.length > 0 ? genres : [],
                    relatedNotes: relatedNotes,
                    thumbnail: thumbnail,
                    creator: creator || null,
                    cast: cast || null,
                    firstAirYear: firstAirYear ? parseInt(firstAirYear) : null,
                    lastAirYear: lastAirYear ? parseInt(lastAirYear) : null,
                    numberOfSeasons: numberOfSeasons ? parseInt(numberOfSeasons) : null,
                    numberOfEpisodes: numberOfEpisodes ? parseInt(numberOfEpisodes) : null,
                    contentRating: contentRating || null,
                    tmdbId: tmdbId || null,
                    tmdbRating: tmdbRating ? parseFloat(tmdbRating) : null,
                    tagline: tagline || null,
                    homepage: homepage || null,
                    originalLanguage: originalLanguage || null,
                    originalName: originalName || null
                };
                
                response = await createTvShow(tvShowData);
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
                        await addMediaToMixlist(mixlist.Id || mixlist.id, mediaId);
                        console.log(`Added media to mixlist: ${mixlist.Name || mixlist.name}`);
                    } catch (mixlistError) {
                        console.error(`Failed to add media to mixlist ${mixlist.Name || mixlist.name}:`, mixlistError);
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
        if (mediaType === 'Book') {
            return (
                <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                        Book Details
                    </Typography>
                    
                    {/* Author - Required */}
                    <TextField
                        label="Author"
                        placeholder="Enter author name..."
                        variant="outlined"
                        fullWidth
                        required
                        margin="normal"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
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

                    {/* ISBN */}
                    <TextField
                        label="ISBN"
                        placeholder="978-0123456789"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={isbn}
                        onChange={(e) => setIsbn(e.target.value)}
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

                    {/* ASIN */}
                    <TextField
                        label="ASIN"
                        placeholder="B0010SKUYM"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={asin}
                        onChange={(e) => setAsin(e.target.value)}
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

                    {/* Format */}
                    <FormControl fullWidth margin="normal" sx={{
                        mb: 2,
                        '& .MuiInputLabel-root': {
                            color: '#ffffff',
                            fontSize: '14px'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#ffffff'
                        }
                    }}>
                        <InputLabel id="format-label">Format</InputLabel>
                        <Select
                            labelId="format-label"
                            value={format}
                            label="Format"
                            onChange={(e) => setFormat(e.target.value)}
                        >
                            <MenuItem value="Digital">Digital</MenuItem>
                            <MenuItem value="Physical">Physical</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Part of Series */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={partOfSeries}
                                onChange={(e) => setPartOfSeries(e.target.checked)}
                            />
                        }
                        label="Part of Series"
                        sx={{ 
                            mt: 1,
                            '& .MuiFormControlLabel-label': { 
                                fontSize: '14px',
                                color: '#ffffff'
                            }
                        }}
                    />
                </Box>
            );
        }
        else if (mediaType === 'Podcast') {
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
                            <Autocomplete
                                options={podcastSeriesSuggestions}
                                getOptionLabel={(option) => option.title || option.Title || ''}
                                value={selectedPodcastSeries}
                                onChange={(event, newValue) => {
                                    setSelectedPodcastSeries(newValue);
                                    setPodcastSeriesId(newValue?.id || newValue?.Id || '');
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handlePodcastSeriesSearch(newInputValue);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Podcast Series"
                                        placeholder="Search for podcast series..."
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
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
                                )}
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
        else if (mediaType === 'Movie') {
            return (
                <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                        Movie Details
                    </Typography>
                    
                    {/* Director */}
                    <TextField
                        label="Director"
                        placeholder="Enter director name..."
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={director}
                        onChange={(e) => setDirector(e.target.value)}
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

                    {/* Cast */}
                    <TextField
                        label="Cast"
                        placeholder="Enter main cast members (comma-separated)..."
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={cast}
                        onChange={(e) => setCast(e.target.value)}
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

                    {/* Release Year and Runtime */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Release Year"
                                placeholder="2023"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={releaseYear}
                                onChange={(e) => setReleaseYear(e.target.value)}
                                type="number"
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Runtime (minutes)"
                                placeholder="120"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={runtimeMinutes}
                                onChange={(e) => setRuntimeMinutes(e.target.value)}
                                type="number"
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
                        </Grid>
                    </Grid>

                    {/* MPAA Rating and TMDB Rating */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="MPAA Rating"
                                placeholder="PG-13"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={mpaaRating}
                                onChange={(e) => setMpaaRating(e.target.value)}
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="TMDB Rating"
                                placeholder="8.5"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={tmdbRating}
                                onChange={(e) => setTmdbRating(e.target.value)}
                                type="number"
                                step="0.1"
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
                        </Grid>
                    </Grid>

                    {/* IMDB ID and TMDB ID */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="IMDB ID"
                                placeholder="tt1234567"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={imdbId}
                                onChange={(e) => setImdbId(e.target.value)}
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="TMDB ID"
                                placeholder="12345"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={tmdbId}
                                onChange={(e) => setTmdbId(e.target.value)}
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
                        </Grid>
                    </Grid>

                    {/* Tagline */}
                    <TextField
                        label="Tagline"
                        placeholder="Enter movie tagline..."
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
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

                    {/* Homepage */}
                    <TextField
                        label="Homepage"
                        placeholder="https://example.com"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={homepage}
                        onChange={(e) => setHomepage(e.target.value)}
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

                    {/* Original Language and Original Title */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Original Language"
                                placeholder="en"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={originalLanguage}
                                onChange={(e) => setOriginalLanguage(e.target.value)}
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Original Title"
                                placeholder="Original title in original language"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={originalTitle}
                                onChange={(e) => setOriginalTitle(e.target.value)}
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
                        </Grid>
                    </Grid>
                </Box>
            );
        }
        else if (mediaType === 'TVShow') {
            return (
                <Box sx={{ mt: 3, mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                        TV Show Details
                    </Typography>
                    
                    {/* Creator */}
                    <TextField
                        label="Creator"
                        placeholder="Enter creator name..."
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={creator}
                        onChange={(e) => setCreator(e.target.value)}
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

                    {/* Cast */}
                    <TextField
                        label="Cast"
                        placeholder="Enter main cast members (comma-separated)..."
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={cast}
                        onChange={(e) => setCast(e.target.value)}
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

                    {/* Air Years */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="First Air Year"
                                placeholder="2020"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={firstAirYear}
                                onChange={(e) => setFirstAirYear(e.target.value)}
                                type="number"
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Last Air Year"
                                placeholder="2023"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={lastAirYear}
                                onChange={(e) => setLastAirYear(e.target.value)}
                                type="number"
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
                        </Grid>
                    </Grid>

                    {/* Seasons and Episodes */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Number of Seasons"
                                placeholder="3"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={numberOfSeasons}
                                onChange={(e) => setNumberOfSeasons(e.target.value)}
                                type="number"
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Number of Episodes"
                                placeholder="24"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={numberOfEpisodes}
                                onChange={(e) => setNumberOfEpisodes(e.target.value)}
                                type="number"
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
                        </Grid>
                    </Grid>

                    {/* Content Rating */}
                    <TextField
                        label="Content Rating"
                        placeholder="TV-MA"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={contentRating}
                        onChange={(e) => setContentRating(e.target.value)}
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

                    {/* TMDB Rating and TMDB ID */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="TMDB Rating"
                                placeholder="8.5"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={tmdbRating}
                                onChange={(e) => setTmdbRating(e.target.value)}
                                type="number"
                                step="0.1"
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="TMDB ID"
                                placeholder="12345"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={tmdbId}
                                onChange={(e) => setTmdbId(e.target.value)}
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
                        </Grid>
                    </Grid>

                    {/* Tagline */}
                    <TextField
                        label="Tagline"
                        placeholder="Enter TV show tagline..."
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
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

                    {/* Homepage */}
                    <TextField
                        label="Homepage"
                        placeholder="https://example.com"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={homepage}
                        onChange={(e) => setHomepage(e.target.value)}
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

                    {/* Original Language and Original Name */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                label="Original Language"
                                placeholder="en"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={originalLanguage}
                                onChange={(e) => setOriginalLanguage(e.target.value)}
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
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Original Name"
                                placeholder="Original name in original language"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={originalName}
                                onChange={(e) => setOriginalName(e.target.value)}
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
                        </Grid>
                    </Grid>
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
                {validationErrors.title && (
                    <Typography color="error" variant="body2" sx={{ mt: 1, mb: 2 }} data-testid="title-error">
                        {validationErrors.title}
                    </Typography>
                )}

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
                    <InputLabel id="media-type-label" data-testid="media-type-label">Media Type</InputLabel>
                    <Select
                        labelId="media-type-label"
                        value={mediaType}
                        label="Media Type"
                        data-testid="media-type-select"
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
                {validationErrors.mediaType && (
                    <Typography color="error" variant="body2" sx={{ mt: 1, mb: 2 }} data-testid="media-type-error">
                        {validationErrors.mediaType}
                    </Typography>
                )}

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
                            borderRadius: '8px',
                            color: '#ffffff'
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
                    <Autocomplete
                        multiple
                        freeSolo
                        options={genreSuggestions.map((option) => option.name || option.Name)}
                        value={genres}
                        onChange={(event, newValue) => {
                            // Convert all values to lowercase
                            const normalizedGenres = newValue.map(genre => genre.toLowerCase());
                            setGenres(normalizedGenres);
                        }}
                        onInputChange={(event, newInputValue) => {
                            setGenreInput(newInputValue);
                            handleGenreSearch(newInputValue);
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    key={index}
                                    variant="outlined"
                                    label={option}
                                    size="small"
                                    sx={{ fontSize: '12px' }}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Genres"
                                placeholder="Type to search genres or add new..."
                                variant="outlined"
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
                        )}
                    />
                </Box>

                {/* Topics */}
                <Box sx={{ mb: 3 }}>
                    <Autocomplete
                        multiple
                        freeSolo
                        options={topicSuggestions.map((option) => option.name || option.Name)}
                        value={topics}
                        onChange={(event, newValue) => {
                            // Convert all values to lowercase
                            const normalizedTopics = newValue.map(topic => topic.toLowerCase());
                            setTopics(normalizedTopics);
                        }}
                        onInputChange={(event, newInputValue) => {
                            setTopicInput(newInputValue);
                            handleTopicSearch(newInputValue);
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    key={index}
                                    variant="outlined"
                                    label={option}
                                    size="small"
                                    sx={{ fontSize: '12px' }}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Topics"
                                placeholder="Type to search topics or add new..."
                                variant="outlined"
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
                        )}
                    />
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
                                borderRadius: '8px',
                                color: '#ffffff'
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