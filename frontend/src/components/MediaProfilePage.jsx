import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, Paper, Link
} from '@mui/material';
import { ArrowBack, Edit, OpenInNew, FileDownload } from '@mui/icons-material';
import { getMediaById } from '../services/apiService';

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
        // Fetch media item
        const mediaResponse = await getMediaById(id);
        const media = mediaResponse.data;
        setMediaItem(media);

        // Find current mixlists
        const currentMixlistsArray = media.mixlists || media.Mixlists || [];
        setCurrentMixlists(currentMixlistsArray);

        // Fetch available mixlists
        const mixlistsResponse = await getAllMixlists();
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mediaItem) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">Media item not found.</Typography>
        </Box>
      </Container>
    );
  }

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
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            onClick={() => window.open(`/api/media/${id}/export`, '_blank')}
            startIcon={<FileDownload />}
            variant="outlined"
            color="primary"
            size="medium"
          >
            Export Media Item
          </Button>
        </Box>

        <Card sx={{ overflow: 'hidden', borderRadius: 2 }}>
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
                {mediaItem.title || mediaItem.Title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={mediaItem.mediaType || mediaItem.MediaType}
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

            {/* Properties */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Properties
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>

                {/* Basic Information */}
                <Paper sx={{ p: 2, backgroundColor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Rating</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {mediaItem.rating || mediaItem.Rating || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Ownership</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {mediaItem.ownershipStatus || mediaItem.OwnershipStatus || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Genre</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {mediaItem.genre || mediaItem.Genre || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Dates */}
                <Paper sx={{ p: 2, backgroundColor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Dates
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Added</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {(mediaItem.dateAdded || mediaItem.DateAdded) ? new Date(mediaItem.dateAdded || mediaItem.DateAdded).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                    {(mediaItem.dateCompleted || mediaItem.DateCompleted) && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Completed</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {new Date(mediaItem.dateCompleted || mediaItem.DateCompleted).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>

                {/* Categories */}
                {((mediaItem.genres || mediaItem.Genres)?.length > 0 || (mediaItem.topics || mediaItem.Topics)?.length > 0) && (
                  <Paper sx={{ p: 2, backgroundColor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Categories
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(mediaItem.genres || mediaItem.Genres)?.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Genres</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {(mediaItem.genres || mediaItem.Genres).map((genre, index) => (
                              <Chip
                                key={index}
                                label={genre.name || genre.Name || genre}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {(mediaItem.topics || mediaItem.Topics)?.length > 0 && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">Topics</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {(mediaItem.topics || mediaItem.Topics).map((topic, index) => (
                              <Chip
                                key={index}
                                label={topic.name || topic.Name || topic}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                )}
              </Box>
            </Box>

            {/* Link */}
            {(mediaItem.link || mediaItem.Link) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Source
                </Typography>
                <Link
                  href={(mediaItem.link || mediaItem.Link).startsWith('http') ? (mediaItem.link || mediaItem.Link) : `https://${mediaItem.link || mediaItem.Link}`}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  View Source <OpenInNew fontSize="small" />
                </Link>
              </Box>
            )}

            {/* Description */}
            {(mediaItem.description || mediaItem.Description) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {mediaItem.description || mediaItem.Description}
                </Typography>
              </Box>
            )}

            {/* Notes */}
            {(mediaItem.notes || mediaItem.Notes) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {mediaItem.notes || mediaItem.Notes}
                </Typography>
              </Box>
            )}

            {/* Related Notes */}
            {(mediaItem.relatedNotes || mediaItem.RelatedNotes) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Related Notes
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {mediaItem.relatedNotes || mediaItem.RelatedNotes}
                </Typography>
              </Box>
            )}

            {/* Mixlists Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Button
                  onClick={() => setMixlistsExpanded(!mixlistsExpanded)}
                  startIcon={mixlistsExpanded ? <ExpandLess /> : <ExpandMore />}
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textTransform: 'none'
                  }}
                >
                  Mixlists ({currentMixlists.length})
                </Button>
                <Button
                  startIcon={<PlaylistAdd />}
                  onClick={() => setMixlistDialogOpen(true)}
                  variant="outlined"
                  size="small"
                >
                  Add to Mixlist
                </Button>
              </Box>

              <Collapse in={mixlistsExpanded}>
                <Box sx={{ pl: 2 }}>
                  {currentMixlists.length > 0 ? (
                    currentMixlists.map((mixlist) => (
                      <Paper key={mixlist.id || mixlist.Id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {mixlist.name || mixlist.Name}
                        </Typography>
                        <Button
                          onClick={() => handleMixlistRemove(mixlist.id || mixlist.Id)}
                          size="small"
                          color="error"
                        >
                          Remove
                        </Button>
                      </Paper>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Not part of any mixlists yet.
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Mixlist Selection Dialog */}
      <Dialog open={mixlistDialogOpen} onClose={() => setMixlistDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add to Mixlist</DialogTitle>
        <DialogContent>
          <List>
            {availableMixlists
              .filter(mixlist => !currentMixlists.some(current =>
                (current.id || current.Id) === (mixlist.id || mixlist.Id)
              ))
              .map((mixlist) => (
                <ListItem
                  key={mixlist.id || mixlist.Id}
                  button
                  onClick={() => {
                    handleMixlistAdd(mixlist.id || mixlist.Id);
                    setMixlistDialogOpen(false);
                  }}
                >
                  <ListItemText
                    primary={mixlist.name || mixlist.Name}
                    secondary={mixlist.description || mixlist.Description}
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMixlistDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

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

export default MediaProfilePage;
