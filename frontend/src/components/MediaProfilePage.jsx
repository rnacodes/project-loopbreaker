import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, Paper, Link, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemText, Collapse, Snackbar, Alert,
    CircularProgress
} from '@mui/material';
import { 
    ArrowBack, Edit, OpenInNew, FileDownload, 
    ExpandLess, ExpandMore, PlaylistAdd, 
    ChevronLeft, ChevronRight 
} from '@mui/icons-material';
import { 
    getMediaById, getAllMixlists, addMediaToMixlist, 
    removeMediaFromMixlist
} from '../services/apiService';

function MediaProfilePage() {
  const [mediaItem, setMediaItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableMixlists, setAvailableMixlists] = useState([]);
  const [currentMixlists, setCurrentMixlists] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching media item with ID:', id);
        const mediaResponse = await getMediaById(id);
        console.log('Media response:', mediaResponse);
        const media = mediaResponse.data;
        console.log('Media data:', media);
        setMediaItem(media);

        const mixlistIds = media.mixlistIds || media.MixlistIds || [];
        console.log('Mixlist IDs:', mixlistIds);
        
        if (mixlistIds.length > 0) {
          const mixlistPromises = mixlistIds.map(id => 
            getAllMixlists().then(response => 
              response.data.find(mixlist => (mixlist.id || mixlist.Id) === id)
            ).catch(() => null)
          );
          
          const mixlists = await Promise.all(mixlistPromises);
          const validMixlists = mixlists.filter(mixlist => mixlist !== null);
          console.log('Fetched mixlists:', validMixlists);
          setCurrentMixlists(validMixlists);
        } else {
          setCurrentMixlists([]);
        }

        const mixlistsResponse = await getAllMixlists();
        console.log('Mixlists response:', mixlistsResponse);
        setAvailableMixlists(mixlistsResponse.data || []);

      } catch (error) {
        console.error('Failed to fetch data:', error);
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

  const getStatusDisplayText = (status) => {
    if (status === 'ActivelyExploring') return 'Actively Exploring';
    return status;
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        py: 4,
        px: 2
      }}>
        <Box sx={{ 
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'background.paper',
          borderRadius: '16px',
          p: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Loading media item...</Typography>
          <Typography variant="body2" color="text.secondary">ID: {id}</Typography>
        </Box>
      </Box>
    );
  }

  if (!mediaItem) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        py: 4,
        px: 2
      }}>
        <Box sx={{ 
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'background.paper',
          borderRadius: '16px',
          p: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
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
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start',
      py: 4,
      px: 2
    }}>
      <Box sx={{ 
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'background.paper',
        borderRadius: '16px',
        p: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
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

        <Card sx={{ overflow: 'hidden', borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Main content with thumbnail on the right */}
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              {/* Left side - Media information */}
              <Box sx={{ flex: 1 }}>
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
                        label={getStatusDisplayText(mediaItem.status || mediaItem.Status)}
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
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Title:</strong> {mediaItem.title || mediaItem.Title || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Type:</strong> {mediaItem.mediaType || mediaItem.MediaType || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Status:</strong> {getStatusDisplayText(mediaItem.status || mediaItem.Status) || 'N/A'}
                  </Typography>
                  {(mediaItem.description || mediaItem.Description) && (
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Description:</strong> {mediaItem.description || mediaItem.Description}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Right side - Thumbnail */}
              {(mediaItem.thumbnail || mediaItem.Thumbnail) && (
                <Box sx={{ flexShrink: 0 }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: 180, 
                      height: 270, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}
                    image={mediaItem.thumbnail || mediaItem.Thumbnail}
                    alt={mediaItem.title || mediaItem.Title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Mixlists Section */}
        <Card sx={{ mt: 3, overflow: 'hidden', borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Mixlists
            </Typography>
            
            {currentMixlists.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                {/* Carousel Container */}
                <Box 
                  className="mixlist-carousel"
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    overflow: 'hidden',
                    scrollBehavior: 'smooth'
                  }}
                >
                  {currentMixlists.map((mixlist, index) => (
                    <Card 
                      key={mixlist.id || mixlist.Id} 
                      sx={{ 
                        minWidth: 280,
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                        }
                      }}
                      onClick={() => navigate(`/mixlist/${mixlist.id || mixlist.Id}`)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {mixlist.name || mixlist.Name || `Mixlist ${mixlist.id || mixlist.Id}`}
                        </Typography>
                        {mixlist.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {mixlist.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={`${mixlist.mediaItems?.length || 0} items`} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  This media item is not part of any mixlists yet.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PlaylistAdd />}
                  onClick={() => navigate('/create-mixlist')}
                  sx={{ 
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Create Mixlist
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default MediaProfilePage;
