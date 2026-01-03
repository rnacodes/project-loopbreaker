import React, { useMemo, useState } from 'react';
import { Box, CardMedia, Chip, Typography, Divider, Button } from '@mui/material';
import { Star } from '@mui/icons-material';

function MediaInfoCard({
  mediaItem,
  formatMediaType,
  formatStatus,
  getMediaTypeColor,
  getStatusColor,
  getRatingIcon,
  getRatingText
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const imageUrl = useMemo(() => {
    if (!mediaItem?.thumbnail) return '';
    return `/api/ListenNotes/image-proxy?imageUrl=${encodeURIComponent(mediaItem.thumbnail)}`;
  }, [mediaItem?.thumbnail]);

  const description = mediaItem?.description || mediaItem?.notes;

  // Function to count words in HTML content
  const countWords = (htmlString) => {
    if (!htmlString) return 0;
    // Remove HTML tags and count words
    const text = htmlString.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
  };

  // Function to truncate HTML content by word count
  const truncateDescription = (htmlString, maxWords) => {
    if (!htmlString) return '';
    // Remove HTML tags for word counting
    const text = htmlString.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/);
    
    if (words.length <= maxWords) return htmlString;
    
    // Truncate the plain text version
    const truncatedText = words.slice(0, maxWords).join(' ');
    return truncatedText + '...';
  };

  const wordCount = countWords(description);
  const DESCRIPTION_WORD_LIMIT = 500;
  const shouldTruncate = wordCount > DESCRIPTION_WORD_LIMIT;
  const displayDescription = shouldTruncate && !isDescriptionExpanded
    ? truncateDescription(description, DESCRIPTION_WORD_LIMIT)
    : description;

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: { xs: 3, md: 4 },
      alignItems: { xs: 'center', md: 'flex-start' }
    }}>
      {/* Thumbnail */}
      <Box sx={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        order: { xs: 1, md: 2 },
        width: { xs: '100%', md: 'auto' },
        minHeight: { xs: 200, sm: 300, md: 270 }
      }}>
        {imageUrl && (
          <CardMedia
            component="img"
            sx={{
              width: { xs: '100%', sm: 250, md: 220 },
              maxWidth: { xs: 300, sm: 250, md: 220 },
              height: 'auto',
              aspectRatio: (mediaItem.mediaType === 'Video' || mediaItem.mediaType === 'Movie' || mediaItem.mediaType === 'TVShow' || mediaItem.mediaType === 'Playlist')
                ? '16/9'
                : '1/1',
              objectFit: 'cover',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 2,
              boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
              mb: 2,
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            image={imageUrl}
            alt={mediaItem.title}
            loading="lazy"
            decoding="async"
          />
        )}
      </Box>

      {/* Media information (chips, description, and rating) */}
      <Box sx={{ flex: 1, width: '100%', order: { xs: 2, md: 1 } }}>
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2,
          justifyContent: { xs: 'center', md: 'flex-start' }
        }}>
          <Chip
            label={formatMediaType(mediaItem.mediaType) || 'Unknown'}
            sx={{
              backgroundColor: getMediaTypeColor(mediaItem.mediaType),
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          />
          {mediaItem.mediaType === 'Podcast' && mediaItem.podcastType !== undefined && (
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
          <Chip
            label={formatStatus(mediaItem.status) || 'Unknown'}
            sx={{
              backgroundColor: getStatusColor(mediaItem.status),
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          />
        </Box>

        {/* Rating Display - moved right below pills */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          justifyContent: { xs: 'center', md: 'flex-start' } 
        }}>
          <Typography variant="body1" sx={{ mr: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
            <strong>Rating:</strong>
          </Typography>
          {getRatingIcon(mediaItem.rating)}
          <Typography variant="body1" sx={{ ml: 1, fontSize: '0.875rem', fontWeight: 'bold' }}>
            {getRatingText(mediaItem.rating)}
          </Typography>
        </Box>

        {/* Description with truncation */}
        {description && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="body1" 
              color="text.primary" 
              sx={{ 
                lineHeight: 1.6,
                fontSize: { xs: '0.95rem', md: '1rem' },
                whiteSpace: 'pre-wrap',
                '& i': { fontStyle: 'italic' },
                '& b': { fontWeight: 'bold' }
              }}
              dangerouslySetInnerHTML={{ __html: displayDescription }}
            />
            {shouldTruncate && (
              <Button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default React.memo(MediaInfoCard);