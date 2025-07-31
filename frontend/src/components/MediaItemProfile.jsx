// In: /frontend/src/components/MediaItemProfile.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Typography, Container, Box, CircularProgress, Link } from '@mui/material';
import { getMediaById } from '../services/apiService';

function MediaItemProfile() {
  const [mediaItem, setMediaItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Gets the 'id' from the URL

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await getMediaById(id);
        setMediaItem(response.data);
      } catch (error) {
        console.error('Failed to fetch media item:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [id]);

  if (loading) {
    return <CircularProgress />;
  }

  if (!mediaItem) {
    return <Typography>Media item not found.</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" component="div" gutterBottom>
              {mediaItem.title}
            </Typography>
            <Typography sx={{ mb: 1.5 }}>
              Type: {mediaItem.mediaType}
            </Typography>
            {mediaItem.link && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                <Link 
                  href={mediaItem.link.startsWith('http') ? mediaItem.link : `https://${mediaItem.link}`}
                  target="_blank" 
                  rel="noopener"
                  sx={{ color: 'text.primary' }}
                >
                  View Source
                </Link>
              </Typography>
            )}
            <Typography variant="body1">
                <strong>Rating:</strong> {mediaItem.Rating || 'N/A'}
            </Typography>
            <Typography variant="body1">
                <strong>Consumed?</strong> {mediaItem.Consumed || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Notes:</strong> {mediaItem.notes || 'N/A'}
            </Typography>
             <Typography variant="caption" display="block" sx={{ mt: 3 }}>
              Added on: {new Date(mediaItem.dateAdded).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default MediaItemProfile;