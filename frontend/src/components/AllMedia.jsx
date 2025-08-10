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
            No media items found. <Link to="/add-media">Add your first media item!</Link>
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
                      {item.title || item.Title}
                    </Typography>
                    <Chip 
                      label={item.mediaType || item.MediaType} 
                      size="small" 
                      sx={{ mb: 1 }}
                    />
                    {(item.rating || item.Rating) && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Rating: {item.rating || item.Rating}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {item.status || item.Status || 'No status set'}
                    </Typography>
                    
                    {/* Topics and Genres */}
                    {((item.topics?.length > 0) || (item.Topics?.length > 0) || (item.genres?.length > 0) || (item.Genres?.length > 0)) && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(item.topics || item.Topics || []).map((topic, index) => (
                          <Chip
                            key={`topic-${index}`}
                            label={typeof topic === 'string' ? topic : topic.name || topic.Name}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        ))}
                        {(item.genres || item.Genres || []).map((genre, index) => (
                          <Chip
                            key={`genre-${index}`}
                            label={typeof genre === 'string' ? genre : genre.name || genre.Name}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    {(item.notes || item.Notes) && (
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
                        {item.notes || item.Notes}
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