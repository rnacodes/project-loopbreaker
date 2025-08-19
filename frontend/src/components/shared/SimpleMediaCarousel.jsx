import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardMedia, IconButton, Chip
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const SimpleMediaCarousel = ({
  mediaItems = [],
  title = 'Featured Media',
  subtitle,
  onMediaClick,
  sx = {},
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!mediaItems || mediaItems.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No media items to display
        </Typography>
      </Box>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const handleMediaClick = (media) => {
    if (onMediaClick) {
      onMediaClick(media);
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

  // Show current item and 2 items on each side (5 total)
  const getVisibleItems = () => {
    if (mediaItems.length <= 5) {
      return mediaItems;
    }
    
    const visible = [];
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + mediaItems.length) % mediaItems.length;
      visible.push({ ...mediaItems[index], offset: i });
    }
    return visible;
  };

  const visibleItems = getVisibleItems();

  return (
    <Box sx={{ width: '100%', ...sx }} {...props}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Carousel */}
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Previous Button */}
        {mediaItems.length > 1 && (
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: -20,
              zIndex: 2,
              backgroundColor: 'background.paper',
              boxShadow: 2,
              '&:hover': { backgroundColor: 'background.default' }
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}

        {/* Media Items */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: 2,
          overflow: 'hidden',
          px: 6
        }}>
          {visibleItems.map((media, index) => {
            const isCenter = media.offset === 0;
            const scale = isCenter ? 1 : 0.8;
            const opacity = Math.abs(media.offset) > 1 ? 0.3 : 1;
            
            return (
              <Card
                key={`${media.id || media.Id}-${index}`}
                sx={{
                  minWidth: 280, // Increased from 220
                  maxWidth: 350, // Increased from 280
                  transform: `scale(${scale})`,
                  opacity: opacity,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: `scale(${scale * 1.05})`,
                    zIndex: 1
                  }
                }}
                onClick={() => handleMediaClick(media)}
              >
                {(media.thumbnailUrl || media.thumbnail || media.Thumbnail) && (
                  <CardMedia
                    component="img"
                    height="200" // Increased from 170
                    image={media.thumbnailUrl || media.thumbnail || media.Thumbnail}
                    alt={media.title || media.Title}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ p: 3 }}> {/* Increased padding from 2 to 3 */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: isCenter ? '1.3rem' : '1.1rem', // Increased from 1.1rem/1rem
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {media.title || media.Title}
                  </Typography>
                  <Chip
                    label={media.mediaType || media.MediaType}
                    size="small"
                    sx={{
                      backgroundColor: getMediaTypeColor(media.mediaType || media.MediaType),
                      color: 'white',
                      fontSize: '0.9rem', // Increased from 0.8rem
                      mt: 1.5
                    }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Next Button */}
        {mediaItems.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: -20,
              zIndex: 2,
              backgroundColor: 'background.paper',
              boxShadow: 2,
              '&:hover': { backgroundColor: 'background.default' }
            }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>

      {/* Pagination Dots */}
      {mediaItems.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
          {mediaItems.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: index === currentIndex ? 'primary.main' : 'grey.300',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: index === currentIndex ? 'primary.dark' : 'grey.400'
                }
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SimpleMediaCarousel;
