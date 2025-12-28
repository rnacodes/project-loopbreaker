import React from 'react';
import { Box, CardMedia, Chip, Typography } from '@mui/material';
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
      </Box>

      {/* Media information (chips and rating) */}
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
              label={formatStatus(mediaItem.status)}
              sx={{
                backgroundColor: getStatusColor(mediaItem.status),
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            />
          )}
        </Box>

        {/* Rating Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
          <Typography variant="body1" sx={{ mr: 1, fontSize: '0.875rem' }}>
            <strong>Rating:</strong>
          </Typography>
          {getRatingIcon(mediaItem.rating)}
          <Typography variant="body1" sx={{ ml: 1, fontSize: '0.875rem' }}>
            {getRatingText(mediaItem.rating)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default React.memo(MediaInfoCard);