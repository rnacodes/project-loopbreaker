//TODO: Include YouTube channel and any playlists it is a part of in the video details section for YouTube videos
//TODO: Add description cutoff at 500 characters that has "View More" button that expands the description to view the full description

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Box, Card, CardContent,
    Divider, Link, Fab,
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemText, Collapse, Snackbar, Alert,
    CircularProgress,
    TextField, InputAdornment,
    IconButton, Typography, Button
} from '@mui/material';
import {
    PlaylistAdd,
    Search, Close,
} from '@mui/icons-material';
import MediaHeader from './MediaHeader';
import MixlistCarousel from './MixlistCarousel';
import MediaInfoCard from './MediaInfoCard';
import MediaDetailAccordion from './MediaDetailAccordion';
import HighlightsSection from './HighlightsSection';
import TopicsGenresSection from './TopicsGenresSection';
import RelatedNotesSection from './RelatedNotesSection';
import SimilarItemsSection from './SimilarItemsSection';
import { formatMediaType, formatStatus, getMediaTypeColor, getStatusColor, getRatingIcon, getRatingText } from '../utils/formatters';
import {
    getMediaById, getAllMixlists,
    getBookById, getPodcastSeriesById, getPodcastEpisodeById, getEpisodesBySeriesId,
    getMovieById, getTvShowById, getVideoById, getArticleById,
    getHighlightsByArticle, getHighlightsByBook, getPlaylistsForVideo,
} from '../api';

function MediaProfilePage() {
  const [mediaItem, setMediaItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableMixlists, setAvailableMixlists] = useState([]);
  const [currentMixlists, setCurrentMixlists] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);
  const [selectedMixlistId, setSelectedMixlistId] = useState(null);
  const [mixlistSearchQuery, setMixlistSearchQuery] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [videoPlaylists, setVideoPlaylists] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
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

        // Redirect to specialized profile pages for certain media types
        // MediaType enum: Article=0, Book=1, Channel=2, Document=3, Movie=4, Music=5, Other=6, Playlist=7, Podcast=8, TVShow=9, Video=10, VideoGame=11, Website=12
        const mediaType = basicMedia.mediaType;
        console.log('MediaType value:', mediaType, 'Type:', typeof mediaType);

        if (mediaType === 'Playlist' || mediaType === 7) {
          console.log('Redirecting to YouTube playlist profile');
          navigate(`/youtube-playlist/${id}`, { replace: true });
          return;
        }
        if (mediaType === 'Channel' || mediaType === 2) {
          console.log('Redirecting to YouTube channel profile');
          navigate(`/youtube-channel/${id}`, { replace: true });
          return;
        }

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
              detailedMedia = { ...basicMedia, ...seriesResponse.data };
              console.log('Detailed podcast series data:', detailedMedia);
              
              // Fetch episodes for the series
              try {
                const episodesResponse = await getEpisodesBySeriesId(id);
                detailedMedia.episodes = episodesResponse.data || [];
              } catch (episodesError) {
                console.warn('Could not fetch episodes for series:', episodesError);
              }
            } catch (seriesError) {
              // If series fetch fails, try as episode
              try {
                const episodeResponse = await getPodcastEpisodeById(id);
                detailedMedia = { ...basicMedia, ...episodeResponse.data };
                console.log('Detailed podcast episode data:', detailedMedia);
                
                // If it's an episode, try to fetch the parent series info
                if (detailedMedia.seriesId) {
                  try {
                    const parentSeriesResponse = await getPodcastSeriesById(detailedMedia.seriesId);
                    detailedMedia.series = parentSeriesResponse.data;
                  } catch (parentSeriesError) {
                    console.warn('Could not fetch parent series data:', parentSeriesError);
                  }
                }
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
          progressTimestamp: detailedMedia.progressTimestamp
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
  }, [id, refreshKey]);

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

  // Fetch playlists for videos
  useEffect(() => {
    const fetchVideoPlaylists = async () => {
      if (!mediaItem) return;

      if (mediaItem.mediaType === 'Video') {
        try {
          const playlists = await getPlaylistsForVideo(mediaItem.id);
          setVideoPlaylists(playlists || []);
        } catch (error) {
          console.error('Failed to fetch playlists for video:', error);
          setVideoPlaylists([]);
        }
      }
    };

    fetchVideoPlaylists();
  }, [mediaItem]);


  const handleAddToMixlist = async () => {
    if (!selectedMixlistId) {
      setSnackbar({ open: true, message: 'Please select a mixlist first', severity: 'warning' });
      return;
    }
    
    try {
      console.log('Adding media to mixlist:', { mixlistId: selectedMixlistId, mediaId: id });
      await addMediaToMixlist(selectedMixlistId, id);
      setSnackbar({ open: true, message: 'Media added to mixlist successfully!', severity: 'success' });
      setAddToMixlistDialog(false);
      setSelectedMixlistId(null);
      setMixlistSearchQuery('');
      
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
      console.error('Error details:', error.response || error);
      setSnackbar({ 
        open: true, 
        message: `Failed to add media to mixlist: ${error.response?.data?.message || error.message || 'Unknown error'}`, 
        severity: 'error' 
      });
    }
  };

  const handleCloseMixlistDialog = () => {
    setAddToMixlistDialog(false);
    setSelectedMixlistId(null);
    setMixlistSearchQuery('');
  };

  const filteredAvailableMixlists = availableMixlists
    .filter(mixlist => !currentMixlists.some(current => current.id === mixlist.id))
    .filter(mixlist => 
      mixlist.name?.toLowerCase().includes(mixlistSearchQuery.toLowerCase()) ||
      mixlist.description?.toLowerCase().includes(mixlistSearchQuery.toLowerCase())
    );

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
        <MediaHeader title={mediaItem?.title} mediaId={id} />

        <Card sx={{ overflow: 'hidden', borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Main content with responsive layout */}
            <MediaInfoCard 
              mediaItem={mediaItem}
              formatMediaType={formatMediaType}
              formatStatus={formatStatus}
              getMediaTypeColor={getMediaTypeColor}
              getStatusColor={getStatusColor}
              getRatingIcon={getRatingIcon}
              getRatingText={getRatingText}
            />


        <MediaDetailAccordion mediaItem={mediaItem} navigate={navigate} videoPlaylists={videoPlaylists} />

        <HighlightsSection mediaItem={mediaItem} highlights={highlights} highlightsLoading={highlightsLoading} />

        <TopicsGenresSection
          mediaItem={mediaItem}
          setSnackbar={setSnackbar}
          onUpdate={() => setRefreshKey(k => k + 1)}
        />

        <RelatedNotesSection
          mediaItem={mediaItem}
          setSnackbar={setSnackbar}
          onUpdate={() => setRefreshKey(k => k + 1)}
        />

        <SimilarItemsSection
          mediaItem={mediaItem}
          setSnackbar={setSnackbar}
        />

        <MixlistCarousel 
          mediaItem={mediaItem}
          currentMixlists={currentMixlists}
          availableMixlists={availableMixlists}
          setCurrentMixlists={setCurrentMixlists}
          setAvailableMixlists={setAvailableMixlists}
          setSnackbar={setSnackbar}
          isMobile={isTablet}
        />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default MediaProfilePage;
