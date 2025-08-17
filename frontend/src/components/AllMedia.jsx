import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  CircularProgress,
  Chip,
  Button,
  ButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import { ViewModule, ViewList, OpenInNew } from '@mui/icons-material';
import { getAllMedia, getMediaByType } from '../services/apiService';

function AllMedia() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const mediaType = searchParams.get('mediaType');
        
        let response;
        if (mediaType) {
          response = await getMediaByType(mediaType);
        } else {
          response = await getAllMedia();
        }
        
        setMediaItems(response.data);
      } catch (error) {
        console.error('Failed to fetch media items:', error);
        setError('Failed to load media items');
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [searchParams]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const renderCardView = () => (
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
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4
              },
              transition: 'all 0.2s ease-in-out'
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
  );

  const renderListView = () => (
    <List sx={{ mt: 2 }}>
      {mediaItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <ListItem 
            component={Link} 
            to={`/media/${item.id}`}
            sx={{ 
              textDecoration: 'none',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" component="div">
                    {item.title || item.Title}
                  </Typography>
                  <Chip 
                    label={item.mediaType || item.MediaType} 
                    size="small" 
                  />
                </Box>
              }
              secondary={
                <Box>
                  {(item.rating || item.Rating) && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Rating: {item.rating || item.Rating}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {item.status || item.Status || 'No status set'}
                  </Typography>
                  
                  {/* Topics and Genres */}
                  {((item.topics?.length > 0) || (item.Topics?.length > 0) || (item.genres?.length > 0) || (item.Genres?.length > 0)) && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
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
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" color="primary">
                <OpenInNew />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          {index < mediaItems.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );

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

  const mediaType = searchParams.get('mediaType');
  const pageTitle = mediaType ? `${mediaType} Media` : 'All Media';

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        {/* Header with View Toggle */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {pageTitle}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {mediaItems.length} media item{mediaItems.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
          
          {/* View Mode Toggle */}
          <ButtonGroup variant="outlined" aria-label="view mode">
            <Button
              onClick={() => handleViewModeChange('card')}
              variant={viewMode === 'card' ? 'contained' : 'outlined'}
              startIcon={<ViewModule />}
            >
              Cards
            </Button>
            <Button
              onClick={() => handleViewModeChange('list')}
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ViewList />}
            >
              List
            </Button>
          </ButtonGroup>
        </Box>
        
        {mediaItems.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 4 }}>
            {mediaType ? `No ${mediaType.toLowerCase()} items found.` : 'No media items found.'} <Link to="/add-media">Add your first media item!</Link>
          </Typography>
        ) : (
          viewMode === 'card' ? renderCardView() : renderListView()
        )}
      </Box>
    </Container>
  );
}

export default AllMedia;