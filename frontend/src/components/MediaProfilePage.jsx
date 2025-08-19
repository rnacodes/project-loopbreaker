import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, Paper, Link, Container, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemText, Collapse, Snackbar, Alert,
    CircularProgress
} from '@mui/material';
import { 
    ArrowBack, Edit, OpenInNew, FileDownload, 
    ExpandLess, ExpandMore, PlaylistAdd 
} from '@mui/icons-material';
import { 
    getMediaById, getAllMixlists, addMediaToMixlist, 
    removeMediaFromMixlist 
} from '../services/apiService';

function MediaProfilePage() {
  const [mediaItem, setMediaItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mixlistsExpanded, setMixlistsExpanded] = useState(false);
  const [mixlistDialogOpen, setMixlistDialogOpen] = useState(false);
  const [availableMixlists, setAvailableMixlists] = useState([]);
  const [currentMixlists, setCurrentMixlists] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching media item with ID:', id);
        // Fetch media item
        const mediaResponse = await getMediaById(id);
        console.log('Media response:', mediaResponse);
        const media = mediaResponse.data;
        console.log('Media data:', media);
        setMediaItem(media);

        // Find current mixlists
        const currentMixlistsArray = media.mixlists || media.Mixlists || [];
        console.log('Current mixlists:', currentMixlistsArray);
        setCurrentMixlists(currentMixlistsArray);

        // Fetch available mixlists
        console.log('Fetching available mixlists...');
        const mixlistsResponse = await getAllMixlists();
        console.log('Mixlists response:', mixlistsResponse);
        setAvailableMixlists(mixlistsResponse.data || []);

      } catch (error) {
        console.error('Failed to fetch data:', error);
        console.error('Error details:', error.response?.data);
        console.error('Error status:', error.response?.status);
        setSnackbar({ open: true, message: 'Failed to load media item', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleMixlistAdd = async (mixlistId) => {
    try {
      await addMediaToMixlist(mixlistId, id);

      // Update current mixlists display
      const mixlist = availableMixlists.find(m => (m.id || m.Id) === mixlistId);
      if (mixlist) {
        setCurrentMixlists(prev => [...prev, mixlist]);
      }

      setSnackbar({ open: true, message: 'Added to mixlist successfully!', severity: 'success' });
    } catch (error) {
      console.error('Failed to add to mixlist:', error);
      setSnackbar({ open: true, message: 'Failed to add to mixlist', severity: 'error' });
    }
  };

  const handleMixlistRemove = async (mixlistId) => {
    try {
      await removeMediaFromMixlist(mixlistId, id);

      // Update current mixlists display
      setCurrentMixlists(prev => prev.filter(m => (m.id || m.Id) !== mixlistId));

      setSnackbar({ open: true, message: 'Removed from mixlist successfully!', severity: 'success' });
    } catch (error) {
      console.error('Failed to remove from mixlist:', error);
      setSnackbar({ open: true, message: 'Failed to remove from mixlist', severity: 'error' });
    }
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
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Loading media item...</Typography>
          <Typography variant="body2" color="text.secondary">ID: {id}</Typography>
        </Box>
      </Container>
    );
  }

  if (!mediaItem) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">Media item not found.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            The media item you're looking for doesn't exist or couldn't be loaded.
          </Typography>
          <Button 
            onClick={() => navigate('/all-media')} 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Back to All Media
          </Button>
        </Box>
      </Container>
    );
  }

  // Debug: Log the media item structure
  console.log('Rendering media item:', mediaItem);
  console.log('Media item keys:', Object.keys(mediaItem));

  try {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          {/* Header with back button and edit button */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Media Profile
              </Typography>
            </Box>

            <Button
              onClick={() => navigate(`/media/${id}/edit`)}
              startIcon={<Edit />}
              variant="contained"
              size="large"
            >
              Edit Media
            </Button>
          </Box>


          {/* Action Buttons */}
          {/* <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              onClick={() => window.open(`/api/media/${id}/export`, '_blank')}
              startIcon={<FileDownload />}
              variant="outlined"
              color="primary"
              size="medium"
            >
              Export Media Item
            </Button>
          </Box> */}

          <Card sx={{ overflow: 'hidden', borderRadius: 2 }}>
            {/* Debug Info - Remove this after fixing */}
            <Box sx={{ p: 2, backgroundColor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Debug: Media ID: {id} | Has data: {mediaItem ? 'Yes' : 'No'} | 
                Keys: {mediaItem ? Object.keys(mediaItem).join(', ') : 'None'}
              </Typography>
            </Box>

            {/* Thumbnail */}
            {(mediaItem.thumbnail || mediaItem.Thumbnail) && (
              <CardMedia
                component="img"
                sx={{ width: '100%', height: 300, objectFit: 'cover' }}
                image={mediaItem.thumbnail || mediaItem.Thumbnail}
                alt={mediaItem.title || mediaItem.Title}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}

            <CardContent sx={{ p: 4 }}>
              {/* Title and Type */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '2.5rem' }}>
                  {mediaItem.title || mediaItem.Title || 'Untitled Media'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={mediaItem.mediaType || mediaItem.MediaType || 'Unknown'}
                    sx={{
                      backgroundColor: getMediaTypeColor(mediaItem.mediaType || mediaItem.MediaType),
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  />
                  {(mediaItem.status || mediaItem.Status) && (
                    <Chip
                      label={mediaItem.status || mediaItem.Status}
                      sx={{
                        backgroundColor: getStatusColor(mediaItem.status || mediaItem.Status),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Basic Info Display */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  Basic Information
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Title:</strong> {mediaItem.title || mediaItem.Title || 'N/A'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Type:</strong> {mediaItem.mediaType || mediaItem.MediaType || 'N/A'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Status:</strong> {mediaItem.status || mediaItem.Status || 'N/A'}
                </Typography>
                {(mediaItem.description || mediaItem.Description) && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Description:</strong> {mediaItem.description || mediaItem.Description}
                  </Typography>
                )}
              </Box>

              {/* Raw Data Display for Debugging */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Raw Data (Debug)
                </Typography>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ fontSize: '12px', margin: 0 }}>
                    {JSON.stringify(mediaItem, null, 2)}
                  </pre>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  } catch (error) {
    console.error('Error rendering MediaProfilePage:', error);
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">Error rendering media profile</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {error.message}
          </Typography>
          <Button 
            onClick={() => navigate('/all-media')} 
            variant="contained" 
            sx={{ mt: 2 }}
          >
            Back to All Media
          </Button>
        </Box>
      </Container>
    );
  }
}

export default MediaProfilePage;
