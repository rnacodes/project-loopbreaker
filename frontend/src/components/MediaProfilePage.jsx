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
    ChevronLeft, ChevronRight, ThumbDown, 
    ThumbUp, Help, Star 
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
  const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);

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

        const mixlistIds = media.mixlistIds || [];
        console.log('Mixlist IDs:', mixlistIds);
        
        if (mixlistIds.length > 0) {
          const mixlistPromises = mixlistIds.map(id => 
            getAllMixlists().then(response => 
              response.data.find(mixlist => mixlist.id === id)
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

  const getRatingIcon = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'dislike':
        return <ThumbDown sx={{ color: '#F44336' }} />;
      case 'like':
        return <ThumbUp sx={{ color: '#4CAF50' }} />;
      case 'neutral':
        return <Help sx={{ color: '#FF9800' }} />;
      case 'superlike':
        return <Star sx={{ color: '#9C27B0' }} />;
      default:
        return null;
    }
  };

  const getRatingText = (rating) => {
    if (!rating) return 'No rating available';
    return rating.charAt(0).toUpperCase() + rating.slice(1).toLowerCase();
  };

  const handleAddToMixlist = async (mixlistId) => {
    try {
      await addMediaToMixlist(mixlistId, id);
      setSnackbar({ open: true, message: 'Media added to mixlist successfully!', severity: 'success' });
      setAddToMixlistDialog(false);
      
      // Refresh the current mixlists
      const updatedMediaResponse = await getMediaById(id);
      const updatedMedia = updatedMediaResponse.data;
      const mixlistIds = updatedMedia.mixlistIds || [];
      
      if (mixlistIds.length > 0) {
        const mixlistPromises = mixlistIds.map(id => 
          getAllMixlists().then(response => 
            response.data.find(mixlist => mixlist.id === id)
          ).catch(() => null)
        );
        
        const mixlists = await Promise.all(mixlistPromises);
        const validMixlists = mixlists.filter(mixlist => mixlist !== null);
        setCurrentMixlists(validMixlists);
      }
    } catch (error) {
      console.error('Failed to add media to mixlist:', error);
      setSnackbar({ open: true, message: 'Failed to add media to mixlist', severity: 'error' });
    }
  };

  const handleCreateNewMixlist = () => {
    navigate('/create-mixlist');
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
                    {mediaItem.title || 'Untitled Media'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={mediaItem.mediaType || 'Unknown'}
                      sx={{
                        backgroundColor: getMediaTypeColor(mediaItem.mediaType),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    />
                    {mediaItem.status && (
                      <Chip
                        label={getStatusDisplayText(mediaItem.status)}
                        sx={{
                          backgroundColor: getStatusColor(mediaItem.status),
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
                    <strong>Title:</strong> {mediaItem.title || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Type:</strong> {mediaItem.mediaType || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Status:</strong> {getStatusDisplayText(mediaItem.status) || 'N/A'}
                  </Typography>
                  
                  {/* Rating Display */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ mr: 1 }}>
                      <strong>Rating:</strong>
                    </Typography>
                    {getRatingIcon(mediaItem.rating)}
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      {getRatingText(mediaItem.rating)}
                    </Typography>
                  </Box>

                  {/* Ownership Status Display */}
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Ownership Status:</strong> {mediaItem.ownershipStatus || 'N/A'}
                  </Typography>

                  {/* Visit Link */}
                  {mediaItem.link && (
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ mr: 1 }}>
                        <strong>Visit Item:</strong>
                      </Typography>
                      <Link
                        href={mediaItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          color: '#ffffff',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          '&:hover': { 
                            textDecoration: 'underline',
                            color: '#e3f2fd'
                          }
                        }}
                      >
                        <OpenInNew sx={{ fontSize: 16, mr: 0.5 }} />
                        Link
                      </Link>
                    </Box>
                  )}

                  {/* Genre Section */}
                  {(mediaItem.genre || (mediaItem.genres && mediaItem.genres.length > 0)) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Genre{mediaItem.genres && mediaItem.genres.length > 1 ? 's' : ''}:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {mediaItem.genres && mediaItem.genres.length > 0 ? (
                          mediaItem.genres.map((genre, index) => (
                            <Link
                              key={index}
                              component="button"
                              onClick={() => navigate(`/search-results?type=genre&value=${encodeURIComponent(genre)}`)}
                              sx={{
                                color: '#ffffff',
                                textDecoration: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.5,
                                fontSize: '0.875rem',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              {genre}
                            </Link>
                          ))
                        ) : (
                          mediaItem.genre && (
                            <Link
                              component="button"
                              onClick={() => navigate(`/search-results?type=genre&value=${encodeURIComponent(mediaItem.genre)}`)}
                              sx={{
                                color: '#ffffff',
                                textDecoration: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.5,
                                fontSize: '0.875rem',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  textDecoration: 'underline'
                                }
                              }}
                            >
                              {mediaItem.genre}
                            </Link>
                          )
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Topics Section */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Topic{(mediaItem.topics && mediaItem.topics.length > 1) ? 's' : ''}:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {mediaItem.topics && mediaItem.topics.length > 0 ? (
                        mediaItem.topics.map((topic, index) => (
                          <Link
                            key={index}
                            component="button"
                            onClick={() => navigate(`/search-results?type=topic&value=${encodeURIComponent(topic)}`)}
                            sx={{
                              color: '#ffffff',
                              textDecoration: 'none',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: 1,
                              px: 1.5,
                              py: 0.5,
                              fontSize: '0.875rem',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {topic}
                          </Link>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {mediaItem.description && (
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Description:</strong> {mediaItem.description}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Right side - Thumbnail and dates */}
              <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {mediaItem.thumbnail && (
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: 180, 
                      height: 270, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      mb: 2
                    }}
                    image={mediaItem.thumbnail}
                    alt={mediaItem.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                {/* Date Information */}
                <Box sx={{ textAlign: 'center', minWidth: 180 }}>
                  {mediaItem.dateAdded && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Added:</strong> {new Date(mediaItem.dateAdded).toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        year: '2-digit' 
                      })}
                    </Typography>
                  )}
                  {mediaItem.dateCompleted && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Completed:</strong> {new Date(mediaItem.dateCompleted).toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        year: '2-digit' 
                      })}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Mixlists Section */}
        <Card sx={{ mt: 3, overflow: 'hidden', borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Mixlists
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlaylistAdd />}
                  onClick={() => setAddToMixlistDialog(true)}
                  sx={{ 
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Add to Mixlist
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreateNewMixlist}
                  sx={{ 
                    backgroundColor: 'white',
                    color: 'black',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Create New
                </Button>
              </Box>
            </Box>
            
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
                      key={mixlist.id} 
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
                      onClick={() => navigate(`/mixlist/${mixlist.id}`)}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {mixlist.name || `Mixlist ${mixlist.id}`}
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
                <Typography variant="body1" color="text.secondary">
                  This media item is not part of any mixlists yet. Use the buttons above to add it to an existing mixlist or create a new one.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Add to Mixlist Dialog */}
        <Dialog 
          open={addToMixlistDialog} 
          onClose={() => setAddToMixlistDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add to Mixlist</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a mixlist to add "{mediaItem?.title}" to:
            </Typography>
            <List>
              {availableMixlists
                .filter(mixlist => !currentMixlists.some(current => current.id === mixlist.id))
                .map((mixlist) => (
                  <ListItem 
                    key={mixlist.id}
                    button
                    onClick={() => handleAddToMixlist(mixlist.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      primary={mixlist.name}
                      secondary={mixlist.description || `${mixlist.mediaItems?.length || 0} items`}
                    />
                  </ListItem>
                ))}
            </List>
            {availableMixlists.filter(mixlist => !currentMixlists.some(current => current.id === mixlist.id)).length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No available mixlists to add to. Create a new mixlist first.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddToMixlistDialog(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default MediaProfilePage;
