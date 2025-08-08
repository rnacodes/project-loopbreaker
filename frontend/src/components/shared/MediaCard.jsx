import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  Rating,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Book,
  Movie,
  Tv,
  Article,
  LibraryMusic,
  Podcasts,
  SportsEsports,
  YouTube,
  Language,
  MenuBook,
  AutoAwesome,
  MoreVert
} from '@mui/icons-material';
import { getMediaTypeColor, getStatusColor, commonStyles } from './DesignSystem';

// Media type icons mapping
const mediaTypeIcons = {
  podcast: <Podcasts />,
  book: <Book />,
  movie: <Movie />,
  tv: <Tv />,
  article: <Article />,
  music: <LibraryMusic />,
  game: <SportsEsports />,
  video: <YouTube />,
  website: <Language />,
  document: <MenuBook />,
  default: <AutoAwesome />
};

const MediaCard = ({
  media,
  variant = 'default', // 'default', 'compact', 'featured'
  showActions = true,
  onClick,
  className,
  ...props
}) => {
  const getMediaIcon = (mediaType) => {
    const type = mediaType?.toLowerCase();
    return mediaTypeIcons[type] || mediaTypeIcons.default;
  };

  const handleCardClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(media);
    }
  };

  const cardContent = (
    <Card
      sx={{
        ...commonStyles.card,
        ...(variant === 'compact' && {
          height: 'auto',
          minHeight: '120px'
        }),
        ...(variant === 'featured' && {
          height: '400px',
          background: 'linear-gradient(135deg, rgba(105, 90, 140, 0.1) 0%, rgba(71, 67, 80, 0.1) 100%)'
        })
      }}
      className={className}
      {...props}
    >
      {/* Media Image */}
      <CardMedia
        component="img"
        sx={{
          height: variant === 'compact' ? 120 : variant === 'featured' ? 200 : 180,
          objectFit: 'cover',
          position: 'relative'
        }}
        image={media.thumbnailUrl || media.imageUrl || 'https://placehold.co/600x400/474350/fcfafa?text=No+Image'}
        alt={media.title}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://placehold.co/600x400/474350/fcfafa?text=No+Image';
        }}
      />

      {/* Overlay with media type icon */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '50%',
          p: 0.5,
          color: getMediaTypeColor(media.mediaType)
        }}
      >
        {getMediaIcon(media.mediaType)}
      </Box>

      {/* Actions overlay */}
      {showActions && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.5
          }}
        >
          <Tooltip title="Play">
            <IconButton
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
              }}
            >
              <PlayArrow />
            </IconButton>
          </Tooltip>
          <Tooltip title="More options">
            <IconButton
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
              }}
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Card Content */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: variant === 'compact' ? 1.5 : 2
        }}
      >
        {/* Title */}
        <Typography
          variant={variant === 'compact' ? 'body2' : 'h6'}
          component="div"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: variant === 'compact' ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3
          }}
        >
          {media.title}
        </Typography>

        {/* Media Type and Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            label={media.mediaType}
            size="small"
            sx={{
              backgroundColor: getMediaTypeColor(media.mediaType),
              color: 'white',
              fontSize: '0.75rem'
            }}
          />
          {media.status && (
            <Chip
              label={media.status}
              size="small"
              sx={{
                backgroundColor: getStatusColor(media.status),
                color: 'white',
                fontSize: '0.75rem'
              }}
            />
          )}
        </Box>

        {/* Rating */}
        {media.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating
              value={media.rating}
              readOnly
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {media.rating}/5
            </Typography>
          </Box>
        )}

        {/* Description/Notes */}
        {media.notes && variant !== 'compact' && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4
            }}
          >
            {media.notes}
          </Typography>
        )}

        {/* Date Added */}
        {media.dateAdded && (
          <Typography
            variant="caption"
            color="text.hint"
            sx={{ mt: 'auto', pt: 1 }}
          >
            Added {new Date(media.dateAdded).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Wrap in Link if onClick is not provided
  if (!onClick) {
    return (
      <Link
        to={`/media/${media.id}`}
        style={{ textDecoration: 'none' }}
        onClick={handleCardClick}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <Box onClick={handleCardClick} sx={{ cursor: 'pointer' }}>
      {cardContent}
    </Box>
  );
};

export default MediaCard;
