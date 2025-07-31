import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  CircularProgress,
  Chip
} from '@mui/material';
import { getAllMedia } from '../services/apiService';

function AllMedia() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllMedia = async () => {
      try {
        const response = await getAllMedia();
        setMediaItems(response.data);
      } catch (error) {
        console.error('Failed to fetch media items:', error);
        setError('Failed to load media items');
      } finally {
        setLoading(false);
      }
    };

    fetchAllMedia();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          All Media
        </Typography>
        
        {mediaItems.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 4 }}>
            No media items found. <Link to="/add">Add your first media item!</Link>
          </Typography>
        ) : (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {mediaItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card 
                  component={Link} 
                  to={`/media/${item.id}`}
                  sx={{ 
                    textDecoration: 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {item.title}
                    </Typography>
                    <Chip 
                      label={item.mediaType} 
                      size="small" 
                      sx={{ mb: 1 }}
                    />
                    {item.rating && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Rating: {item.rating}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {item.consumed ? 'Consumed' : 'Not consumed yet'}
                    </Typography>
                    {item.notes && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default AllMedia;