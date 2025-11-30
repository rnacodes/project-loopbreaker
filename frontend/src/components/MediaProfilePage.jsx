//TODO: Update to reflect latest changes to the API and frontend.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Box, Typography, Button, Card, CardContent, CardMedia,
    Chip, Divider, Paper, Link, IconButton, Fab,
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
    getMovieById, getTvShowById, getVideoById, getArticleById,
    getHighlightsByArticle, getHighlightsByBook
} from '../services/apiService';

function MediaProfilePage() {
  const [mediaItem, setMediaItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableMixlists, setAvailableMixlists] = useState([]);
  const [currentMixlists, setCurrentMixlists] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
              // Redirect to dedicated podcast series profile
              navigate(`/podcast-series/${id}`, { replace: true });
              return;
            } catch (seriesError) {
              // If series fetch fails, try as episode
              try {
                const episodeResponse = await getPodcastEpisodeById(id);
                // Redirect to dedicated podcast episode profile
                navigate(`/podcast-episode/${id}`, { replace: true });
                return;
              } catch (episodeError) {
                console.warn('Could not fetch detailed podcast data, using basic data:', episodeError);
              }
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

  // Fetch highlights when media item is loaded
  useEffect(() => {
    const fetchHighlights = async () => {
      if (!mediaItem) return;
      
      if (mediaItem.mediaType === 'Article' || mediaItem.mediaType === 'Book') {
        setHighlightsLoading(true);
        try {
          let highlightsData = [];
          if (mediaItem.mediaType === 'Article') {
            highlightsData = await getHighlightsByArticle(mediaItem.id);
          } else if (mediaItem.mediaType === 'Book') {
            highlightsData = await getHighlightsByBook(mediaItem.id);
          }
          setHighlights(highlightsData || []);
        } catch (error) {
          console.error('Failed to fetch highlights:', error);
          // Don't show error snackbar for highlights, just log it
          setHighlights([]);
        } finally {
          setHighlightsLoading(false);
        }
      }
    };

    fetchHighlights();
  }, [mediaItem]);

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
      py: { xs: 2, sm: 4 },
      px: { xs: 1, sm: 2 }
    }}>
      <Box sx={{ 
        width: '100%',
        maxWidth: '900px',
        backgroundColor: 'background.paper',
        borderRadius: { xs: '8px', sm: '16px' },
        p: { xs: 2, sm: 3, md: 4 },
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}>
        {/* Header with back button and edit button */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between', 
          gap: { xs: 2, sm: 0 },
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}
            >
              Media Profile
            </Typography>
          </Box>

          {!isMobile && (
            <Button
              onClick={() => navigate(`/media/${id}/edit`)}
              startIcon={<Edit />}
              variant="contained"
              size={isTablet ? "medium" : "large"}
            >
              Edit Media
            </Button>
          )}
        </Box>

        <Card sx={{ overflow: 'hidden', borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Main content with responsive layout */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 3, md: 4 }, 
              alignItems: { xs: 'center', md: 'flex-start' }
            }}>
              {/* Media information */}
              <Box sx={{ flex: 1, width: '100%', order: { xs: 2, md: 1 } }}>
                {/* Title and Type */}
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h3" 
                    component="h2" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 'bold', 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                      textAlign: { xs: 'center', md: 'left' }
                    }}
                  >
                    {mediaItem.title || 'Untitled Media'}
                  </Typography>
                  
                  {/* Author for books */}
                  {mediaItem.mediaType === 'Book' && mediaItem.author && (
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      sx={{ 
                        mb: 2, 
                        color: 'text.secondary', 
                        fontWeight: 'normal',
                        fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                        textAlign: { xs: 'center', md: 'left' }
                      }}
                    >
                      by {mediaItem.author}
                    </Typography>
                  )}
                  
                  {/* Author for articles */}
                  {mediaItem.mediaType === 'Article' && mediaItem.author && (
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      sx={{ 
                        mb: 2, 
                        color: 'text.secondary', 
                        fontWeight: 'normal',
                        fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                        textAlign: { xs: 'center', md: 'left' }
                      }}
                    >
                      by {mediaItem.author}
                    </Typography>
                  )}
                  
                  {/* Director for movies */}
                  {mediaItem.mediaType === 'Movie' && mediaItem.director && (
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      sx={{ 
                        mb: 2, 
                        color: 'text.secondary', 
                        fontWeight: 'normal',
                        fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                        textAlign: { xs: 'center', md: 'left' }
                      }}
                    >
                      Directed by {mediaItem.director}
                    </Typography>
                  )}
                  
                  {/* Creator for TV shows */}
                  {mediaItem.mediaType === 'TVShow' && mediaItem.creator && (
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      sx={{ 
                        mb: 2, 
                        color: 'text.secondary', 
                        fontWeight: 'normal',
                        fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                        textAlign: { xs: 'center', md: 'left' }
                      }}
                    >
                      Created by {mediaItem.creator}
                    </Typography>
                  )}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap', 
                    mb: 2,
                    justifyContent: { xs: 'center', md: 'flex-start' }
                  }}>
                    <Chip
                      label={mediaItem.mediaType || 'Unknown'}
                      sx={{
                        backgroundColor: getMediaTypeColor(mediaItem.mediaType),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.875rem', sm: '1rem' }
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
                          fontSize: { xs: '0.875rem', sm: '1rem' }
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
                          fontSize: { xs: '0.875rem', sm: '1rem' }
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

              {/* Thumbnail and dates - appears above content on mobile */}
              <Box sx={{ 
                flexShrink: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                order: { xs: 1, md: 2 },
                width: { xs: '100%', md: 'auto' }
              }}>
                {mediaItem.thumbnail && (
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: { xs: '100%', sm: 250, md: 180 },
                      maxWidth: { xs: 300, sm: 250, md: 180 },
                      height: { xs: 'auto', sm: 375, md: 270 },
                      aspectRatio: { 
                        xs: (mediaItem.mediaType === 'Video' || mediaItem.mediaType === 'Movie' || mediaItem.mediaType === 'TVShow' || mediaItem.mediaType === 'Playlist') 
                          ? '16/9' 
                          : '2/3', 
                        sm: 'auto' 
                      },
                      objectFit: 'contain',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 1,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      mb: 2
                    }}
                    image={mediaItem.thumbnail}
                    alt={mediaItem.title}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                {/* Date Information */}
                <Box sx={{ 
                  textAlign: 'center', 
                  width: '100%',
                  minWidth: { sm: 180 }
                }}>
                  {mediaItem.dateAdded && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 0.5,
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      <strong>Added:</strong> {new Date(mediaItem.dateAdded).toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        year: '2-digit' 
                      })}
                    </Typography>
                  )}
                  {mediaItem.dateCompleted && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
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
          <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }} defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="media-details-content"
              id="media-details-header"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                px: { xs: 2, sm: 3, md: 4 },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {mediaItem.mediaType === 'TVShow' ? 'TV Show Details' : `${mediaItem.mediaType} Details`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            
            {/* Podcast-specific properties */}
            {mediaItem.mediaType === 'Podcast' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.podcastType && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Type:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {mediaItem.podcastType === 'Series' || mediaItem.podcastType === 0 ? 'Podcast Series' : 'Podcast Episode'}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.durationInSeconds !== undefined && mediaItem.durationInSeconds !== null && mediaItem.durationInSeconds > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Duration:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {Math.floor(mediaItem.durationInSeconds / 60)}:{(mediaItem.durationInSeconds % 60).toString().padStart(2, '0')}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.publisher && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Publisher:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.publisher}</Typography>
                  </Box>
                )}
                
                {mediaItem.audioLink && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Audio Link:</strong>
                    </Typography>
                    <Link
                      href={mediaItem.audioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
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
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Release Date:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
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
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>ISBN:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.isbn}</Typography>
                  </Box>
                )}
                
                {mediaItem.asin && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>ASIN:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.asin}</Typography>
                  </Box>
                )}
                
                {mediaItem.format && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Format:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.format}</Typography>
                  </Box>
                )}
                
                {mediaItem.partOfSeries !== undefined && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Part of Series:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.partOfSeries ? 'Yes' : 'No'}</Typography>
                  </Box>
                )}
                
                {mediaItem.goodreadsRating && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Goodreads Rating:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.goodreadsRating} / 5</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Movie-specific properties */}
            {mediaItem.mediaType === 'Movie' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.director && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Director:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.director}</Typography>
                  </Box>
                )}
                
                {mediaItem.cast && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Cast:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.cast}</Typography>
                  </Box>
                )}
                
                {mediaItem.releaseYear && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Release Year:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.releaseYear}</Typography>
                  </Box>
                )}
                
                {mediaItem.runtimeMinutes && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Runtime:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.runtimeMinutes} minutes</Typography>
                  </Box>
                )}
                
                {mediaItem.mpaaRating && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>MPAA Rating:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.mpaaRating}</Typography>
                  </Box>
                )}
                
                {mediaItem.tmdbRating && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>TMDB Rating:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.tmdbRating}/10</Typography>
                  </Box>
                )}
                
                {mediaItem.imdbId && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>IMDB ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.imdbId}</Typography>
                  </Box>
                )}
                
                {mediaItem.tmdbId && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>TMDB ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.tmdbId}</Typography>
                  </Box>
                )}
                
                {mediaItem.tagline && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Tagline:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: { xs: '0.9rem', sm: '1rem' } }}>"{mediaItem.tagline}"</Typography>
                  </Box>
                )}
                
                {mediaItem.homepage && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Homepage:</strong>
                    </Typography>
                    <Link href={mediaItem.homepage} target="_blank" rel="noopener noreferrer" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {mediaItem.homepage}
                    </Link>
                  </Box>
                )}
                
                {mediaItem.originalLanguage && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Original Language:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.originalLanguage}</Typography>
                  </Box>
                )}
                
                {mediaItem.originalTitle && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Original Title:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.originalTitle}</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* TV Show-specific properties */}
            {mediaItem.mediaType === 'TVShow' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.creator && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Creator:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.creator}</Typography>
                  </Box>
                )}
                
                {mediaItem.cast && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Cast:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.cast}</Typography>
                  </Box>
                )}
                
                {mediaItem.firstAirYear && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>First Air Year:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.firstAirYear}</Typography>
                  </Box>
                )}
                
                {mediaItem.lastAirYear && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Last Air Year:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.lastAirYear}</Typography>
                  </Box>
                )}
                
                {mediaItem.numberOfSeasons && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Seasons:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.numberOfSeasons}</Typography>
                  </Box>
                )}
                
                {mediaItem.numberOfEpisodes && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Episodes:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.numberOfEpisodes}</Typography>
                  </Box>
                )}
                
                {mediaItem.contentRating && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Content Rating:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.contentRating}</Typography>
                  </Box>
                )}
                
                
                {mediaItem.tmdbRating && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>TMDB Rating:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.tmdbRating}/10</Typography>
                  </Box>
                )}
                
                {mediaItem.tmdbId && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>TMDB ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.tmdbId}</Typography>
                  </Box>
                )}
                
                {mediaItem.tagline && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Tagline:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: { xs: '0.9rem', sm: '1rem' } }}>"{mediaItem.tagline}"</Typography>
                  </Box>
                )}
                
                {mediaItem.homepage && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Homepage:</strong>
                    </Typography>
                    <Link href={mediaItem.homepage} target="_blank" rel="noopener noreferrer" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {mediaItem.homepage}
                    </Link>
                  </Box>
                )}
                
                {mediaItem.originalLanguage && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Original Language:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.originalLanguage}</Typography>
                  </Box>
                )}
                
                {mediaItem.originalName && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Original Name:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.originalName}</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Video-specific properties */}
            {mediaItem.mediaType === 'Video' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.platform && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Platform:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.platform}</Typography>
                  </Box>
                )}
                
                {mediaItem.videoType !== undefined && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Video Type:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {mediaItem.videoType === 'Series' || mediaItem.videoType === 0 ? 'Series' : 
                       mediaItem.videoType === 'Episode' || mediaItem.videoType === 1 ? 'Episode' : 
                       mediaItem.videoType === 'Channel' || mediaItem.videoType === 2 ? 'Channel' : 
                       mediaItem.videoType}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.channel && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Channel:</strong>
                    </Typography>
                    <Link
                      component="button"
                      variant="body1"
                      onClick={() => navigate(`/youtube-channel/${mediaItem.channel.id}`)}
                      sx={{ 
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
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
                          sx={{ ml: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          ({(mediaItem.channel.subscriberCount / 1000000).toFixed(1)}M subscribers)
                        </Typography>
                      )}
                    </Link>
                  </Box>
                )}
                
                {mediaItem.lengthInSeconds !== undefined && mediaItem.lengthInSeconds !== null && mediaItem.lengthInSeconds > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Duration:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {Math.floor(mediaItem.lengthInSeconds / 3600) > 0 && `${Math.floor(mediaItem.lengthInSeconds / 3600)}:`}
                      {Math.floor((mediaItem.lengthInSeconds % 3600) / 60).toString().padStart(2, '0')}:
                      {(mediaItem.lengthInSeconds % 60).toString().padStart(2, '0')}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.externalId && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>External ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.externalId}</Typography>
                  </Box>
                )}
                
                {mediaItem.parentVideoId && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Parent Video ID:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.parentVideoId}</Typography>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Article-specific properties */}
            {mediaItem.mediaType === 'Article' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mediaItem.author && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Author:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.author}</Typography>
                  </Box>
                )}
                
                {mediaItem.publication && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Publication:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.publication}</Typography>
                  </Box>
                )}
                
                {mediaItem.publicationDate && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Publication Date:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {new Date(mediaItem.publicationDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.estimatedReadingTimeMinutes > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Est. Reading Time:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {mediaItem.estimatedReadingTimeMinutes} {mediaItem.estimatedReadingTimeMinutes === 1 ? 'minute' : 'minutes'}
                    </Typography>
                  </Box>
                )}
                
                {mediaItem.wordCount > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Word Count:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{mediaItem.wordCount.toLocaleString()}</Typography>
                  </Box>
                )}
                
                {mediaItem.isStarred && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Starred:</strong>
                    </Typography>
                    <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                  </Box>
                )}
                
                {mediaItem.savedToInstapaperDate && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 0 }
                  }}>
                    <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      <strong>Saved to Instapaper:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
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
            </AccordionDetails>
          </Accordion>
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
                px: { xs: 2, sm: 3 },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Notes sx={{ mr: 1, color: '#ffffff', fontSize: { xs: 20, sm: 24 } }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#ffffff',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Related Notes
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              p: { xs: 2, sm: 3 }
            }}>
              {mediaItem.relatedNotes && mediaItem.relatedNotes.trim() ? (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#ffffff',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  {mediaItem.relatedNotes}
                </Typography>
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    fontSize: { xs: '0.85rem', sm: '0.875rem' }
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
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              mb: 3 
            }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Mixlists
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                width: { xs: '100%', sm: 'auto' }
              }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlaylistAdd />}
                  onClick={() => setAddToMixlistDialog(true)}
                  fullWidth={isMobile}
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
                  fullWidth={isMobile}
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
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollBehavior: 'smooth',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                      height: '8px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderRadius: '4px'
                    }
                  }}
                >
                  {currentMixlists.map((mixlist, index) => (
                    <Card 
                      key={mixlist.id} 
                      sx={{ 
                        minWidth: { xs: '85%', sm: 280 },
                        maxWidth: { xs: '85%', sm: 'none' },
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
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold', 
                            mb: 1,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }}
                        >
                          {mixlist.name || `Mixlist ${mixlist.id}`}
                        </Typography>
                        {mixlist.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              fontSize: { xs: '0.8rem', sm: '0.875rem' }
                            }}
                          >
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

        {/* Highlights Section */}
        {(mediaItem.mediaType === 'Article' || mediaItem.mediaType === 'Book') && (
          <Card
            sx={{
              width: '100%',
              maxWidth: '1200px',
              mt: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: { xs: '8px', sm: '16px' },
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 1
              }}>
                <Notes sx={{ fontSize: { xs: 24, sm: 32 }, mr: 1, color: '#FFD700' }} />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#ffffff',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  Highlights
                </Typography>
                {!highlightsLoading && highlights.length > 0 && (
                  <Chip
                    label={highlights.length}
                    size="small"
                    sx={{
                      ml: { xs: 0, sm: 2 },
                      backgroundColor: 'rgba(255, 215, 0, 0.2)',
                      color: '#FFD700',
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>

              {highlightsLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Loading highlights...
                  </Typography>
                </Box>
              ) : highlights.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {highlights.map((highlight, index) => (
                    <Paper
                      key={highlight.id || index}
                      elevation={2}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 215, 0, 0.2)',
                        borderLeft: { xs: '3px solid #FFD700', sm: '4px solid #FFD700' },
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          transform: { xs: 'none', sm: 'translateX(4px)' },
                          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
                        }
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: { xs: '0.95rem', sm: '1.05rem' },
                          lineHeight: 1.7,
                          color: '#ffffff',
                          mb: 2,
                          fontStyle: 'italic',
                          '&::before': {
                            content: '"""',
                            fontSize: { xs: '1.2rem', sm: '1.5rem' },
                            color: '#FFD700',
                            marginRight: '0.5rem'
                          },
                          '&::after': {
                            content: '"""',
                            fontSize: { xs: '1.2rem', sm: '1.5rem' },
                            color: '#FFD700',
                            marginLeft: '0.5rem'
                          }
                        }}
                      >
                        {highlight.text || highlight.highlightText}
                      </Typography>

                      {highlight.note && (
                        <Box
                          sx={{
                            mt: 2,
                            p: { xs: 1.5, sm: 2 },
                            backgroundColor: 'rgba(100, 150, 255, 0.1)',
                            borderLeft: '3px solid #6496FF',
                            borderRadius: 1
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#B0C4DE',
                              fontStyle: 'normal',
                              fontSize: { xs: '0.85rem', sm: '0.95rem' }
                            }}
                          >
                            <strong style={{ color: '#6496FF' }}>Note:</strong> {highlight.note}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignItems: 'center' }}>
                        {highlight.highlightedAt && (
                          <Chip
                            label={new Date(highlight.highlightedAt).toLocaleDateString()}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                        {highlight.location && (
                          <Chip
                            label={`Location: ${highlight.location}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                        {highlight.tags && highlight.tags.length > 0 && (
                          <>
                            {highlight.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Chip
                                key={tagIndex}
                                label={tag}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255, 215, 0, 0.15)',
                                  color: '#FFD700',
                                  fontSize: '0.75rem'
                                }}
                              />
                            ))}
                            {highlight.tags.length > 3 && (
                              <Chip
                                label={`+${highlight.tags.length - 3} more`}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                  color: '#FFD700',
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </>
                        )}
                      </Box>

                      {highlight.url && (
                        <Box sx={{ mt: 2 }}>
                          <Link
                            href={highlight.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: '#6496FF',
                              fontSize: '0.875rem',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            View in Readwise <OpenInNew sx={{ fontSize: 16 }} />
                          </Link>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No highlights found for this {mediaItem.mediaType.toLowerCase()}.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Visit the <Link href="/readwise-sync" sx={{ color: '#FFD700' }}>Readwise Sync page</Link> to import highlights.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

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

        {/* Floating Action Button for Edit on Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="edit"
            onClick={() => navigate(`/media/${id}/edit`)}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000
            }}
          >
            <Edit />
          </Fab>
        )}
      </Box>
    </Box>
  );
}

export default MediaProfilePage;
