import React from 'react';
import {
    Button, Card, Box, Typography, Accordion, AccordionSummary, AccordionDetails, Link, Chip
} from '@mui/material';
import { ExpandMore, OpenInNew, Star } from '@mui/icons-material';

function getJustWatchUrl(title) {
  // Simple heuristic for generating a JustWatch search URL.
  // In a real application, you'd likely use a more robust integration (e.g., an API).
  return `https://www.justwatch.com/us/search?q=${encodeURIComponent(title)}`;
}

function MediaDetailAccordion({ mediaItem, navigate, videoPlaylists = [] }) {
  return (
    <Card sx={{ mt: 3, overflow: 'hidden', borderRadius: 2 }}>
      <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
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
            {mediaItem.podcastType !== undefined && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Type:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                  {mediaItem.podcastType === 'Series' || mediaItem.podcastType === 0 ? 'Podcast Series' : 'Podcast Episode'}
                </Typography>
              </Box>
            )}

            {mediaItem.series && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Parent Series:</strong>
                </Typography>
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => {
                    // Navigate to podcast series profile if it's a podcast series
                    if (mediaItem.mediaType === 'Podcast') {
                      navigate(`/podcast-series/${mediaItem.series.id}`);
                    } else {
                      navigate(`/media/${mediaItem.series.id}`);
                    }
                  }}
                  sx={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#ffffff',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: '#e3f2fd'
                    }
                  }}
                >
                  {mediaItem.series.title}
                </Link>
              </Box>
            )}
            
            {mediaItem.durationInSeconds !== undefined && mediaItem.durationInSeconds !== null && mediaItem.durationInSeconds > 0 && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Duration:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Publisher:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.publisher}</Typography>
              </Box>
            )}
            
            {mediaItem.audioLink && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 2 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Audio Link:</strong>
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  href={mediaItem.audioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<OpenInNew />}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  Play Audio
                </Button>
              </Box>
            )}
            
            {mediaItem.releaseDate && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Release Date:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
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
            {mediaItem.author && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Author:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.author}</Typography>
              </Box>
            )}

            {mediaItem.isbn && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>ISBN:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{mediaItem.isbn}</Typography>
              </Box>
            )}

            {mediaItem.asin && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>ASIN:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{mediaItem.asin}</Typography>
              </Box>
            )}

            {mediaItem.format && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Format:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.format}</Typography>
              </Box>
            )}

            {mediaItem.partOfSeries !== undefined && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Part of Series:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.partOfSeries ? 'Yes' : 'No'}</Typography>
              </Box>
            )}

            {mediaItem.goodreadsRating && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Your Rating:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.goodreadsRating} / 5</Typography>
              </Box>
            )}

            {mediaItem.averageRating && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Avg Rating:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.averageRating} / 5</Typography>
              </Box>
            )}

            {mediaItem.publisher && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Publisher:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.publisher}</Typography>
              </Box>
            )}

            {mediaItem.yearPublished && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Year Published:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.yearPublished}</Typography>
              </Box>
            )}

            {mediaItem.originalPublicationYear && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>First Published:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>{mediaItem.originalPublicationYear}</Typography>
              </Box>
            )}

            {mediaItem.dateRead && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '140px' }, fontSize: '1rem' }}>
                  <strong>Date Read:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                  {new Date(mediaItem.dateRead).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            )}

            {mediaItem.myReview && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                  <strong>My Review:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.9rem', pl: 2, fontStyle: 'italic' }}>
                  "{mediaItem.myReview}"
                </Typography>
              </Box>
            )}

            {mediaItem.goodreadsTags && mediaItem.goodreadsTags.length > 0 && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                <Typography variant="body1" sx={{ fontSize: '1rem' }}>
                  <strong>Goodreads Tags:</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', pl: 2 }}>
                  {mediaItem.goodreadsTags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'text.primary',
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Box>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Director:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.director}</Typography>
              </Box>
            )}
            
            {mediaItem.cast && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Cast:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.cast}</Typography>
              </Box>
            )}
            
            {mediaItem.releaseYear && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Release Year:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.releaseYear}</Typography>
              </Box>
            )}
            
            {mediaItem.runtimeMinutes && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Runtime:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.runtimeMinutes} minutes</Typography>
              </Box>
            )}
            
            {mediaItem.mpaaRating && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>MPAA Rating:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.mpaaRating}</Typography>
              </Box>
            )}
            
            {mediaItem.tmdbRating && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>TMDB Rating:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.tmdbRating}/10</Typography>
              </Box>
            )}
            
            {mediaItem.imdbId && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>IMDB ID:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{mediaItem.imdbId}</Typography>
              </Box>
            )}
            
            {mediaItem.tmdbId && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>TMDB ID:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{mediaItem.tmdbId}</Typography>
              </Box>
            )}
            
            {mediaItem.tagline && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Tagline:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>"{mediaItem.tagline}"</Typography>
              </Box>
            )}
            
            {mediaItem.homepage && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Homepage:</strong>
                </Typography>
                <Link
                  href={mediaItem.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '0.875rem',
                    color: '#ffffff',
                    '&:hover': {
                      color: '#e3f2fd'
                    }
                  }}
                >
                  {mediaItem.homepage}
                </Link>
              </Box>
            )}
            
            {/* JustWatch Link */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 0.5, sm: 0 }
            }}>
              <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                <strong>Where to Watch:</strong>
              </Typography>
              <Link
                href={getJustWatchUrl(mediaItem.title)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    color: '#e3f2fd'
                  }
                }}
              >
                <OpenInNew sx={{ fontSize: 16, mr: 0.5 }} />
                Search on JustWatch
              </Link>
            </Box>
            
            {mediaItem.originalLanguage && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Original Language:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.originalLanguage}</Typography>
              </Box>
            )}
            
            {mediaItem.originalTitle && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Original Title:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.originalTitle}</Typography>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Creator:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.creator}</Typography>
              </Box>
            )}
            
            {mediaItem.cast && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Cast:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.cast}</Typography>
              </Box>
            )}
            
            {mediaItem.firstAirYear && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>First Air Year:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.firstAirYear}</Typography>
              </Box>
            )}
            
            {mediaItem.lastAirYear && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Last Air Year:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.lastAirYear}</Typography>
              </Box>
            )}
            
            {mediaItem.numberOfSeasons && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Seasons:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.numberOfSeasons}</Typography>
              </Box>
            )}
            
            {mediaItem.numberOfEpisodes && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Episodes:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.numberOfEpisodes}</Typography>
              </Box>
            )}
            
            {mediaItem.contentRating && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Content Rating:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.contentRating}</Typography>
              </Box>
            )}
            
            
            {mediaItem.tmdbRating && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>TMDB Rating:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.tmdbRating}/10</Typography>
              </Box>
            )}
            
            {mediaItem.tmdbId && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>TMDB ID:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{mediaItem.tmdbId}</Typography>
              </Box>
            )}
            
            {mediaItem.tagline && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Tagline:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>"{mediaItem.tagline}"</Typography>
              </Box>
            )}
            
            {mediaItem.homepage && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Homepage:</strong>
                </Typography>
                <Link
                  href={mediaItem.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    fontSize: '0.875rem',
                    color: '#ffffff',
                    '&:hover': {
                      color: '#e3f2fd'
                    }
                  }}
                >
                  {mediaItem.homepage}
                </Link>
              </Box>
            )}
            
            {/* JustWatch Link */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 0.5, sm: 0 }
            }}>
              <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                <strong>Where to Watch:</strong>
              </Typography>
              <Link
                href={getJustWatchUrl(mediaItem.title)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    color: '#e3f2fd'
                  }
                }}
              >
                <OpenInNew sx={{ fontSize: 16, mr: 0.5 }} />
                Search on JustWatch
              </Link>
            </Box>
            
            {mediaItem.originalLanguage && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Original Language:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.originalLanguage}</Typography>
              </Box>
            )}
            
            {mediaItem.originalName && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Original Name:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.originalName}</Typography>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Platform:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.platform}</Typography>
              </Box>
            )}
            
            {mediaItem.videoType !== undefined && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Video Type:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Channel:</strong>
                </Typography>
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => navigate(`/youtube-channel/${mediaItem.channel.id}`)}
                  sx={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
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
                      sx={{ ml: 1, fontSize: '0.875rem' }}
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Duration:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>External ID:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{mediaItem.externalId}</Typography>
              </Box>
            )}
            
            {mediaItem.parentVideoId && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '120px' }, fontSize: '0.875rem' }}>
                  <strong>Parent Video ID:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{mediaItem.parentVideoId}</Typography>
              </Box>
            )}

            {videoPlaylists && videoPlaylists.length > 0 && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 0.5, sm: 1 }
              }}>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                  <strong>Playlists:</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: { sm: 2 } }}>
                  {videoPlaylists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      component="button"
                      variant="body2"
                      onClick={() => navigate(`/youtube-playlist/${playlist.id}`)}
                      sx={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#ffffff',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: '#e3f2fd'
                        }
                      }}
                    >
                      {playlist.title}
                      {playlist.videoCount && (
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1, fontSize: '0.75rem' }}
                        >
                          ({playlist.videoCount} videos)
                        </Typography>
                      )}
                    </Link>
                  ))}
                </Box>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: '0.875rem' }}>
                  <strong>Author:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.author}</Typography>
              </Box>
            )}
            
            {mediaItem.publication && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: '0.875rem' }}>
                  <strong>Publication:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.publication}</Typography>
              </Box>
            )}
            
            {mediaItem.publicationDate && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: '0.875rem' }}>
                  <strong>Publication Date:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: '0.875rem' }}>
                  <strong>Est. Reading Time:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
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
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: '0.875rem' }}>
                  <strong>Word Count:</strong>
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>{mediaItem.wordCount.toLocaleString()}</Typography>
              </Box>
            )}
            
            {mediaItem.isStarred && (
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 0.5, sm: 0 }
              }}>
                <Typography variant="body1" sx={{ mr: 1, minWidth: { sm: '180px' }, fontSize: '0.875rem' }}>
                  <strong>Starred:</strong>
                </Typography>
                <Star sx={{ color: '#FFD700', fontSize: 20 }} />
              </Box>
            )}
            
          </Box>
        )}
        
        {/* Show message if no specific properties are available */}
        {((mediaItem.mediaType === 'Podcast' && !mediaItem.podcastType && !mediaItem.durationInSeconds && !mediaItem.publisher && !mediaItem.audioLink && !mediaItem.releaseDate) ||
          (mediaItem.mediaType === 'Book' && !mediaItem.author && !mediaItem.isbn && !mediaItem.asin && !mediaItem.format && mediaItem.partOfSeries === undefined) ||
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
  );
}

export default React.memo(MediaDetailAccordion);