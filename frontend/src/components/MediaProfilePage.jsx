//TODO: Update to reflect latest changes to the API and frontend.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, Paper, Link, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemText, Collapse, Snackbar, Alert,
    CircularProgress, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
    ArrowBack, Edit, OpenInNew, FileDownload, 
    ExpandLess, ExpandMore, PlaylistAdd, 
    ChevronLeft, ChevronRight, ThumbDown, 
    ThumbUp, Help, Star, Notes
} from '@mui/icons-material';
import { 
    getMediaById, getAllMixlists, addMediaToMixlist, 
    removeMediaFromMixlist, getBookById, getPodcastSeriesById, getPodcastEpisodeById,
    getMovieById, getTvShowById, getVideoById, getArticleById
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
        
        // First get the basic media info to determine the type
        const mediaResponse = await getMediaById(id);
        console.log('Media response:', mediaResponse);
        const basicMedia = mediaResponse.data;
        console.log('Basic media data:', basicMedia);
        
        let detailedMedia = basicMedia;
        
        // If it's a book, podcast, movie, TV show, or video, fetch the detailed information
        if (basicMedia.mediaType === 'Book') {
          try {
            const bookResponse = await getBookById(id);
            detailedMedia = { ...basicMedia, ...bookResponse.data };
            console.log('Detailed book data:', detailedMedia);
          } catch (bookError) {
            console.warn('Could not fetch detailed book data, using basic data:', bookError);
          }
        } else if (basicMedia.mediaType === 'Podcast') {
          try {
            // Try to fetch as podcast series first
            try {
              const seriesResponse = await getPodcastSeriesById(id);
              detailedMedia = { ...basicMedia, ...seriesResponse.data, podcastType: 'Series' };
              console.log('Detailed podcast series data:', detailedMedia);
            } catch (seriesError) {
              // If series fetch fails, try as episode
              const episodeResponse = await getPodcastEpisodeById(id);
              detailedMedia = { ...basicMedia, ...episodeResponse.data, podcastType: 'Episode' };
              console.log('Detailed podcast episode data:', detailedMedia);
            }
          } catch (podcastError) {
            console.warn('Could not fetch detailed podcast data, using basic data:', podcastError);
          }
        } else if (basicMedia.mediaType === 'Movie') {
          try {
            const movieResponse = await getMovieById(id);
            detailedMedia = { ...basicMedia, ...movieResponse.data };
            console.log('Detailed movie data:', detailedMedia);
          } catch (movieError) {
            console.warn('Could not fetch detailed movie data, using basic data:', movieError);
          }
        } else if (basicMedia.mediaType === 'TVShow') {
          try {
            const tvShowResponse = await getTvShowById(id);
            detailedMedia = { ...basicMedia, ...tvShowResponse.data };
            console.log('Detailed TV show data:', detailedMedia);
          } catch (tvShowError) {
            console.warn('Could not fetch detailed TV show data, using basic data:', tvShowError);
          }
        } else if (basicMedia.mediaType === 'Video') {
          try {
            const videoResponse = await getVideoById(id);
            detailedMedia = { ...basicMedia, ...videoResponse.data };
            console.log('Detailed video data:', detailedMedia);
          } catch (videoError) {
            console.warn('Could not fetch detailed video data, using basic data:', videoError);
          }
        } else if (basicMedia.mediaType === 'Article') {
          try {
            const articleResponse = await getArticleById(id);
            console.log('Article API response:', articleResponse);
            // Check if response has .data property or if it's the data itself
            const articleData = articleResponse.data || articleResponse;
            detailedMedia = { ...basicMedia, ...articleData };
            console.log('Detailed article data:', detailedMedia);
          } catch (articleError) {
            console.warn('Could not fetch detailed article data, using basic data:', articleError);
          }
        }
        
        setMediaItem(detailedMedia);
        
        // Debug: Log all available fields
        console.log('Final media item fields:', Object.keys(detailedMedia));
        console.log('Book specific fields:', {
          author: detailedMedia.author,
          isbn: detailedMedia.isbn,
          asin: detailedMedia.asin,
          format: detailedMedia.format,
          partOfSeries: detailedMedia.partOfSeries
        });
        console.log('Podcast specific fields:', {
          podcastType: detailedMedia.podcastType,
          podcastTypeValue: detailedMedia.podcastType,
          durationInSeconds: detailedMedia.durationInSeconds,
          publisher: detailedMedia.publisher,
          audioLink: detailedMedia.audioLink,
          releaseDate: detailedMedia.releaseDate
        });
        console.log('Podcast type check:', {
          exists: !!detailedMedia.podcastType,
          value: detailedMedia.podcastType,
          isSeries: detailedMedia.podcastType === 'Series',
          isEpisode: detailedMedia.podcastType === 'Episode'
        });
        console.log('Video specific fields:', {
          platform: detailedMedia.platform,
          channelId: detailedMedia.channelId,
          channel: detailedMedia.channel,
          lengthInSeconds: detailedMedia.lengthInSeconds,
          videoType: detailedMedia.videoType,
          externalId: detailedMedia.externalId,
          parentVideoId: detailedMedia.parentVideoId
        });
        console.log('Article specific fields:', {
          author: detailedMedia.author,
          publication: detailedMedia.publication,
          publicationDate: detailedMedia.publicationDate,
          originalUrl: detailedMedia.originalUrl,
          readingProgress: detailedMedia.readingProgress,
          estimatedReadingTimeMinutes: detailedMedia.estimatedReadingTimeMinutes,
          wordCount: detailedMedia.wordCount,
          isStarred: detailedMedia.isStarred,
          savedToInstapaperDate: detailedMedia.savedToInstapaperDate,
          progressTimestamp: detailedMedia.progressTimestamp,
          instapaperBookmarkId: detailedMedia.instapaperBookmarkId
        });

        const mixlistIds = detailedMedia.mixlistIds || [];
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
        maxWidth: '900px',
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
                  
                  {/* Author for books */}
                  {mediaItem.mediaType === 'Book' && mediaItem.author && (
                    <Typography variant="h5" component="h3" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'normal' }}>
                      by {mediaItem.author}
                    </Typography>
                  )}
                  
                  {/* Author for articles */}
                  {mediaItem.mediaType === 'Article' && mediaItem.author && (
                    <Typography variant="h5" component="h3" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'normal' }}>
                      by {mediaItem.author}
                    </Typography>
                  )}
                  
                  {/* Director for movies */}
                  {mediaItem.mediaType === 'Movie' && mediaItem.director && (
                    <Typography variant="h5" component="h3" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'normal' }}>
                      Directed by {mediaItem.director}
                    </Typography>
                  )}
                  
                  {/* Creator for TV shows */}
                  {mediaItem.mediaType === 'TVShow' && mediaItem.creator && (
                    <Typography variant="h5" component="h3" sx={{ mb: 2, color: 'text.secondary', fontWeight: 'normal' }}>
                      Created by {mediaItem.creator}
                    </Typography>
                  )}
                  
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
                    {/* Podcast Type Display */}
                    {mediaItem.mediaType === 'Podcast' && mediaItem.podcastType && (
                      <Chip
                        label={mediaItem.podcastType === 'Series' || mediaItem.podcastType === 0 ? 'Series' : 'Episode'}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}
                      />
                    )}
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

        {/* Media Type Specific Properties Section */}
        <Card sx={{ mt: 3, overflow: 'hidden', borderRadius: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
              {mediaItem.mediaType} Details
            </Typography>
            
            {/* Podcast-specific properties */}
            {mediaItem.mediaType === 'Podcast' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.podcastType && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Type:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {mediaItem.podcastType === 'Series' || mediaItem.podcastType === 0 ? 'Podcast Series' : 'Podcast Episode'}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.durationInSeconds !== undefined && mediaItem.durationInSeconds !== null && mediaItem.durationInSeconds > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Duration:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {Math.floor(mediaItem.durationInSeconds / 60)}:{(mediaItem.durationInSeconds % 60).toString().padStart(2, '0')}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.publisher && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Publisher:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.publisher}</Typography>
                  </Box>
                )}
                
                {mediaItem.audioLink && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Audio Link:</strong>
                    </Typography>
                    <Link
                      href={mediaItem.audioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#ffffff',
                        textDecoration: 'none',
                        '&:hover': { 
                          textDecoration: 'underline',
                          color: '#e3f2fd'
                        }
                      }}
                    >
                      <OpenInNew sx={{ fontSize: 16, mr: 0.5 }} />
                      Listen
                    </Link>
                  </Box>
                )}
                
                {mediaItem.releaseDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Release Date:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {new Date(mediaItem.releaseDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Book-specific properties */}
            {mediaItem.mediaType === 'Book' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.isbn && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>ISBN:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{mediaItem.isbn}</Typography>
                  </Box>
                )}
                
                {mediaItem.asin && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>ASIN:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{mediaItem.asin}</Typography>
                  </Box>
                )}
                
                {mediaItem.format && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Format:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.format}</Typography>
                  </Box>
                )}
                
                {mediaItem.partOfSeries !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Part of Series:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.partOfSeries ? 'Yes' : 'No'}</Typography>
                  </Box>
                )}
                
                {mediaItem.goodreadsRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Goodreads Rating:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.goodreadsRating} / 5</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Movie-specific properties */}
            {mediaItem.mediaType === 'Movie' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.director && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Director:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.director}</Typography>
                  </Box>
                )}
                
                {mediaItem.cast && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Cast:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.cast}</Typography>
                  </Box>
                )}
                
                {mediaItem.releaseYear && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Release Year:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.releaseYear}</Typography>
                  </Box>
                )}
                
                {mediaItem.runtimeMinutes && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Runtime:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.runtimeMinutes} minutes</Typography>
                  </Box>
                )}
                
                {mediaItem.mpaaRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>MPAA Rating:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.mpaaRating}</Typography>
                  </Box>
                )}
                
                {mediaItem.tmdbRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>TMDB Rating:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.tmdbRating}/10</Typography>
                  </Box>
                )}
                
                {mediaItem.imdbId && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>IMDB ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{mediaItem.imdbId}</Typography>
                  </Box>
                )}
                
                {mediaItem.tmdbId && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>TMDB ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{mediaItem.tmdbId}</Typography>
                  </Box>
                )}
                
                {mediaItem.tagline && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Tagline:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>"{mediaItem.tagline}"</Typography>
                  </Box>
                )}
                
                {mediaItem.homepage && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Homepage:</strong>
                    </Typography>
                    <Link href={mediaItem.homepage} target="_blank" rel="noopener noreferrer">
                      {mediaItem.homepage}
                    </Link>
                  </Box>
                )}
                
                {mediaItem.originalLanguage && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Original Language:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.originalLanguage}</Typography>
                  </Box>
                )}
                
                {mediaItem.originalTitle && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Original Title:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.originalTitle}</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* TV Show-specific properties */}
            {mediaItem.mediaType === 'TVShow' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.creator && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Creator:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.creator}</Typography>
                  </Box>
                )}
                
                {mediaItem.cast && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Cast:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.cast}</Typography>
                  </Box>
                )}
                
                {mediaItem.firstAirYear && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>First Air Year:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.firstAirYear}</Typography>
                  </Box>
                )}
                
                {mediaItem.lastAirYear && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Last Air Year:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.lastAirYear}</Typography>
                  </Box>
                )}
                
                {mediaItem.numberOfSeasons && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Seasons:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.numberOfSeasons}</Typography>
                  </Box>
                )}
                
                {mediaItem.numberOfEpisodes && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Episodes:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.numberOfEpisodes}</Typography>
                  </Box>
                )}
                
                {mediaItem.contentRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Content Rating:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.contentRating}</Typography>
                  </Box>
                )}
                
                
                {mediaItem.tmdbRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>TMDB Rating:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.tmdbRating}/10</Typography>
                  </Box>
                )}
                
                {mediaItem.tmdbId && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>TMDB ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{mediaItem.tmdbId}</Typography>
                  </Box>
                )}
                
                {mediaItem.tagline && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Tagline:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>"{mediaItem.tagline}"</Typography>
                  </Box>
                )}
                
                {mediaItem.homepage && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Homepage:</strong>
                    </Typography>
                    <Link href={mediaItem.homepage} target="_blank" rel="noopener noreferrer">
                      {mediaItem.homepage}
                    </Link>
                  </Box>
                )}
                
                {mediaItem.originalLanguage && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Original Language:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.originalLanguage}</Typography>
                  </Box>
                )}
                
                {mediaItem.originalName && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Original Name:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.originalName}</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Video-specific properties */}
            {mediaItem.mediaType === 'Video' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.platform && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Platform:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.platform}</Typography>
                  </Box>
                )}
                
                {mediaItem.videoType !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Video Type:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {mediaItem.videoType === 'Series' || mediaItem.videoType === 0 ? 'Series' : 
                       mediaItem.videoType === 'Episode' || mediaItem.videoType === 1 ? 'Episode' : 
                       mediaItem.videoType === 'Channel' || mediaItem.videoType === 2 ? 'Channel' : 
                       mediaItem.videoType}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.channel && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Channel:</strong>
                    </Typography>
                    <Link
                      component="button"
                      variant="body1"
                      onClick={() => navigate(`/youtube-channel/${mediaItem.channel.id}`)}
                      sx={{ 
                        textAlign: 'left',
                        cursor: 'pointer',
                        '&:hover': { 
                          textDecoration: 'underline',
                          color: 'primary.light'
                        }
                      }}
                    >
                      {mediaItem.channel.title}
                      {mediaItem.channel.subscriberCount && (
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          ({(mediaItem.channel.subscriberCount / 1000000).toFixed(1)}M subscribers)
                        </Typography>
                      )}
                    </Link>
                  </Box>
                )}
                
                {mediaItem.lengthInSeconds !== undefined && mediaItem.lengthInSeconds !== null && mediaItem.lengthInSeconds > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Duration:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {Math.floor(mediaItem.lengthInSeconds / 3600) > 0 && `${Math.floor(mediaItem.lengthInSeconds / 3600)}:`}
                      {Math.floor((mediaItem.lengthInSeconds % 3600) / 60).toString().padStart(2, '0')}:
                      {(mediaItem.lengthInSeconds % 60).toString().padStart(2, '0')}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.externalId && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>External ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{mediaItem.externalId}</Typography>
                  </Box>
                )}
                
                {mediaItem.parentVideoId && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '120px' }}>
                      <strong>Parent Video ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{mediaItem.parentVideoId}</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Article-specific properties */}
            {mediaItem.mediaType === 'Article' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.author && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '180px' }}>
                      <strong>Author:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.author}</Typography>
                  </Box>
                )}
                
                {mediaItem.publication && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '180px' }}>
                      <strong>Publication:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.publication}</Typography>
                  </Box>
                )}
                
                {mediaItem.publicationDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '180px' }}>
                      <strong>Publication Date:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {new Date(mediaItem.publicationDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.estimatedReadingTimeMinutes > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '180px' }}>
                      <strong>Est. Reading Time:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {mediaItem.estimatedReadingTimeMinutes} {mediaItem.estimatedReadingTimeMinutes === 1 ? 'minute' : 'minutes'}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.wordCount > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '180px' }}>
                      <strong>Word Count:</strong>
                    </Typography>
                    <Typography variant="body1">{mediaItem.wordCount.toLocaleString()}</Typography>
                  </Box>
                )}
                
                {mediaItem.isStarred && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '180px' }}>
                      <strong>Starred:</strong>
                    </Typography>
                    <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                  </Box>
                )}
                
                {mediaItem.savedToInstapaperDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: '180px' }}>
                      <strong>Saved to Instapaper:</strong>
                    </Typography>
                    <Typography variant="body1">
                      {new Date(mediaItem.savedToInstapaperDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Show message if no specific properties are available */}
            {((mediaItem.mediaType === 'Podcast' && !mediaItem.podcastType && !mediaItem.durationInSeconds && !mediaItem.publisher && !mediaItem.audioLink && !mediaItem.releaseDate) ||
              (mediaItem.mediaType === 'Book' && !mediaItem.isbn && !mediaItem.asin && !mediaItem.format && mediaItem.partOfSeries === undefined) ||
              (mediaItem.mediaType === 'Movie' && !mediaItem.director && !mediaItem.cast && !mediaItem.releaseYear && !mediaItem.runtimeMinutes && !mediaItem.mpaaRating && !mediaItem.tmdbRating) ||
              (mediaItem.mediaType === 'TVShow' && !mediaItem.creator && !mediaItem.cast && !mediaItem.firstAirYear && !mediaItem.numberOfSeasons && !mediaItem.contentRating) ||
              (mediaItem.mediaType === 'Video' && !mediaItem.platform && !mediaItem.channel && !mediaItem.lengthInSeconds && mediaItem.videoType === undefined && !mediaItem.externalId) ||
              (mediaItem.mediaType === 'Article' && !mediaItem.author && !mediaItem.publication && !mediaItem.publicationDate && !mediaItem.originalUrl && !mediaItem.readingProgress && !mediaItem.estimatedReadingTimeMinutes && !mediaItem.wordCount)) && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No specific {mediaItem.mediaType.toLowerCase()} details available
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Related Notes Section */}
        <Card sx={{ mt: 3, overflow: 'hidden', borderRadius: 2 }}>
          <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="related-notes-content"
              id="related-notes-header"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Notes sx={{ mr: 1, color: '#ffffff' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                  Related Notes
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
              {mediaItem.relatedNotes && mediaItem.relatedNotes.trim() ? (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#ffffff',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {mediaItem.relatedNotes}
                </Typography>
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  No notes added
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
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
