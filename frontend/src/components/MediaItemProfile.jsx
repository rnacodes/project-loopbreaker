// In: /frontend/src/components/MediaItemProfile.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, Typography, Container, Box, CircularProgress, 
  Link, CardMedia, Chip, IconButton, Divider, Paper
} from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';
import { getMediaById } from '../services/apiService';

function MediaItemProfile() {
  const [mediaItem, setMediaItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Gets the 'id' from the URL
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        console.log('Fetching media with ID:', id);
        const response = await getMediaById(id);
        console.log('API response:', response);
        console.log('Response data:', response.data);
        setMediaItem(response.data);
      } catch (error) {
        console.error('Failed to fetch media item:', error);
        console.error('Error details:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Full error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMedia();
    } else {
      console.error('No ID provided to MediaItemProfile');
      setLoading(false);
    }
  }, [id]);

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

  const getMediaTypeColor = (mediaType) => {
    const colors = {
      'Podcast': '#9C27B0',
      'Book': '#2196F3',
      'Movie': '#FF5722',
      'Article': '#4CAF50',
      'Video': '#FF9800',
      'Music': '#E91E63',
      'VideoGame': '#673AB7',
      'TVShow': '#795548',
      'Website': '#607D8B',
      'Document': '#3F51B5',
      'Other': '#9E9E9E'
    };
    return colors[mediaType] || colors['Other'];
  };

  const getStatusColor = (status) => {
    const colors = {
      'Completed': '#4CAF50',
      'ActivelyExploring': '#FF9800',
      'Uncharted': '#9E9E9E',
      'Abandoned': '#F44336'
    };
    return colors[status] || colors['Uncharted'];
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        {/* Header with back button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Media Profile
          </Typography>
        </Box>

        <Card sx={{ overflow: 'hidden', borderRadius: 2 }}>
          {/* Thumbnail at the top */}
          {(mediaItem.thumbnail || mediaItem.Thumbnail) && (
            <CardMedia
              component="img"
              sx={{
                width: '100%',
                height: 300,
                objectFit: 'cover',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
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

            {/* Media Type Properties */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Properties
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                {/* Basic properties */}
                <Paper sx={{ p: 2, backgroundColor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {mediaItem.status || mediaItem.Status || 'N/A'}
                      </Typography>
                    </Box>
                    {(mediaItem.rating || mediaItem.Rating) && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Rating</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {mediaItem.rating || mediaItem.Rating}
                        </Typography>
                      </Box>
                    )}
                    {(mediaItem.ownershipStatus || mediaItem.OwnershipStatus) && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Ownership</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {mediaItem.ownershipStatus || mediaItem.OwnershipStatus}
                        </Typography>
                      </Box>
                    )}
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
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default MediaItemProfile;