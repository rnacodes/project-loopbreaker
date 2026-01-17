import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { getSimilarMedia } from '../api';
import { formatMediaType } from '../utils/formatters';

function SimilarItemsSection({ mediaItem, setSnackbar }) {
  const [similarItems, setSimilarItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasEmbedding, setHasEmbedding] = useState(true);

  const fetchSimilarItems = useCallback(async () => {
    if (!mediaItem?.id) return;

    setLoading(true);
    setError(null);

    try {
      const items = await getSimilarMedia(mediaItem.id, 8);
      setSimilarItems(items || []);
      setHasEmbedding(true);
    } catch (err) {
      console.error('Error fetching similar items:', err);
      // Check if error is due to missing embedding
      if (err.response?.status === 400 || err.response?.data?.message?.includes('embedding')) {
        setHasEmbedding(false);
        setSimilarItems([]);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load similar items');
      }
    } finally {
      setLoading(false);
    }
  }, [mediaItem?.id]);

  useEffect(() => {
    fetchSimilarItems();
  }, [fetchSimilarItems]);

  // Don't render if no embedding
  if (!hasEmbedding && !loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesomeIcon color="action" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Similar Items
            </Typography>
          </Box>
          <Alert severity="info">
            Generate embeddings in the AI Admin page to enable similar item recommendations.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Similar Items
            </Typography>
            <Chip label="AI" size="small" color="secondary" sx={{ ml: 1 }} />
          </Box>
          <Tooltip title="Refresh recommendations">
            <IconButton onClick={fetchSimilarItems} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && similarItems.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No similar items found
          </Typography>
        )}

        {!loading && !error && similarItems.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              pb: 1,
              '&::-webkit-scrollbar': {
                height: 6,
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'action.hover',
                borderRadius: 3,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'action.selected',
                borderRadius: 3,
              },
            }}
          >
            {similarItems.map((item) => (
              <Card
                key={item.id}
                component={RouterLink}
                to={`/media/${item.id}`}
                sx={{
                  minWidth: 160,
                  maxWidth: 160,
                  textDecoration: 'none',
                  flexShrink: 0,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {item.thumbnail && (
                  <CardMedia
                    component="img"
                    height="100"
                    image={item.thumbnail}
                    alt={item.title}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.3,
                      mb: 0.5,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={formatMediaType(item.mediaType)}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                    {item.similarityScore && (
                      <Chip
                        label={`${Math.round(item.similarityScore * 100)}%`}
                        size="small"
                        color="secondary"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(SimilarItemsSection);
