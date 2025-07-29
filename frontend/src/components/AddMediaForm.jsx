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
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const mediaData = { title, mediaType, link, notes };
        try {
            const response = await addMedia(mediaData);
            console.log('Media added!', response.data);
            // Navigate to the new item's profile page
            navigate(`/media/${response.data.id}`);
        } catch (error) {
            console.error('Failed to add media:', error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Add New Media
                </Typography>
                <TextField
                    label="Title"
                    variant="outlined"
                    fullWidth
                    required
                    margin="normal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <FormControl fullWidth margin="normal" required>
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
                        <MenuItem value="Video">Video</MenuItem>
                        <MenuItem value="Movie">Movie</MenuItem>
                        <MenuItem value="TvShow">TV Show</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    label="Link (Optional)"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                />

                {/* Consumed Checkbox */}
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

                {/* Rating Dropdown */}
                <FormControl fullWidth margin="normal">
                    <InputLabel id="rating-label">Rating (Optional)</InputLabel>
                    <Select
                        labelId="rating-label"
                        value={rating}
                        label="Rating (Optional)"
                        onChange={(e) => setRating(e.target.value)}
                    >
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="1">1 - Poor</MenuItem>
                        <MenuItem value="2">2 - Fair</MenuItem>
                        <MenuItem value="3">3 - Good</MenuItem>
                        <MenuItem value="4">4 - Very Good</MenuItem>
                        <MenuItem value="5">5 - Excellent</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Notes (Optional)"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    Save Media
                </Button>
            </Box>
        </Container>
    );
}

export default AddMediaForm;