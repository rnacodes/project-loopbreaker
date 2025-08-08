import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Paper
} from '@mui/material';
import {
  MediaCard,
  SearchBar,
  LoadingSpinner,
  MediaCarousel,
  commonStyles,
  COLORS
} from './shared';

// Mock data for demonstration
const mockMediaItems = [
  {
    id: 1,
    title: 'The Great Gatsby',
    mediaType: 'book',
    status: 'completed',
    rating: 4.5,
    notes: 'A classic American novel about the Jazz Age.',
    dateAdded: '2024-01-15',
    thumbnailUrl: 'https://placehold.co/600x400/474350/fcfafa?text=The+Great+Gatsby'
  },
  {
    id: 2,
    title: 'Inception',
    mediaType: 'movie',
    status: 'actively exploring',
    rating: 4.8,
    notes: 'Mind-bending sci-fi thriller about dreams within dreams.',
    dateAdded: '2024-01-20',
    thumbnailUrl: 'https://placehold.co/600x400/474350/fcfafa?text=Inception'
  },
  {
    id: 3,
    title: 'Breaking Bad',
    mediaType: 'tv',
    status: 'completed',
    rating: 5.0,
    notes: 'One of the greatest TV series ever made.',
    dateAdded: '2024-01-10',
    thumbnailUrl: 'https://placehold.co/600x400/474350/fcfafa?text=Breaking+Bad'
  },
  {
    id: 4,
    title: 'The Joe Rogan Experience',
    mediaType: 'podcast',
    status: 'uncharted',
    rating: 4.2,
    notes: 'Long-form conversations with interesting guests.',
    dateAdded: '2024-01-25',
    thumbnailUrl: 'https://placehold.co/600x400/474350/fcfafa?text=JRE'
  },
  {
    id: 5,
    title: 'Cyberpunk 2077',
    mediaType: 'game',
    status: 'abandoned',
    rating: 3.5,
    notes: 'Open-world RPG set in a dystopian future.',
    dateAdded: '2024-01-30',
    thumbnailUrl: 'https://placehold.co/600x400/474350/fcfafa?text=Cyberpunk+2077'
  },
  {
    id: 6,
    title: 'React Documentation',
    mediaType: 'document',
    status: 'actively exploring',
    rating: 4.7,
    notes: 'Official React documentation and tutorials.',
    dateAdded: '2024-02-01',
    thumbnailUrl: 'https://placehold.co/600x400/474350/fcfafa?text=React+Docs'
  }
];

const mockSuggestions = [
  { title: 'The Great Gatsby', mediaType: 'book' },
  { title: 'Inception', mediaType: 'movie' },
  { title: 'Breaking Bad', mediaType: 'tv' }
];

const mockRecentSearches = ['podcasts', 'sci-fi movies', 'classic books'];
const mockTrendingSearches = ['AI', 'cyberpunk', 'documentaries', 'comedy'];

const DemoPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const handleMediaClick = (media) => {
    setSelectedMedia(media);
    console.log('Selected media:', media);
  };

  const toggleLoading = () => {
    setLoading(!loading);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        Design System Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Showcasing the new shared components and consistent design system
      </Typography>

      {/* Search Bar Demo */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Search Bar Component
        </Typography>
        <SearchBar
          onSearch={handleSearch}
          suggestions={mockSuggestions}
          recentSearches={mockRecentSearches}
          trendingSearches={mockTrendingSearches}
          placeholder="Try searching for media..."
        />
        {searchQuery && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Search query: "{searchQuery}"
          </Typography>
        )}
      </Paper>

      {/* Loading Spinner Demo */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading Spinner Component
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="contained" onClick={toggleLoading}>
            Toggle Loading
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <LoadingSpinner size="small" message="Small spinner" />
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <LoadingSpinner size="medium" message="Medium spinner" />
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <LoadingSpinner size="large" message="Large spinner" />
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <LoadingSpinner variant="dots" message="Dots loader" />
            </Box>
          </Grid>
        </Grid>
        {loading && (
          <Box sx={{ mt: 2 }}>
            <LoadingSpinner variant="skeleton" message="Loading content..." />
          </Box>
        )}
      </Paper>

      {/* Media Cards Demo */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Media Card Component
        </Typography>
        <Grid container spacing={3}>
          {mockMediaItems.slice(0, 3).map((media) => (
            <Grid item xs={12} sm={6} md={4} key={media.id}>
              <MediaCard
                media={media}
                onClick={handleMediaClick}
              />
            </Grid>
          ))}
        </Grid>
        {selectedMedia && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: COLORS.background.elevated, borderRadius: 1 }}>
            <Typography variant="body2">
              Selected: {selectedMedia.title} ({selectedMedia.mediaType})
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Carousel Demo */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Media Carousel Component
        </Typography>
        <MediaCarousel
          mediaItems={mockMediaItems}
          title="Featured Media"
          subtitle="Swipe through our featured content"
          variant="coverflow"
          onMediaClick={handleMediaClick}
        />
      </Paper>

      {/* Design System Colors Demo */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Design System Colors
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Media Type Colors
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(COLORS.mediaTypes).map(([type, color]) => (
                <Chip
                  key={type}
                  label={type}
                  sx={{
                    backgroundColor: color,
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Status Colors
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['uncharted', 'actively exploring', 'completed', 'abandoned'].map((status) => (
                <Chip
                  key={status}
                  label={status}
                  sx={{
                    backgroundColor: COLORS.status[status === 'uncharted' ? 'uncharted' : status === 'actively exploring' ? 'activelyExploring' : status === 'completed' ? 'completed' : 'abandoned'],
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Spacing and Typography Demo */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Typography & Spacing
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h1">Heading 1</Typography>
          <Typography variant="h2">Heading 2</Typography>
          <Typography variant="h3">Heading 3</Typography>
          <Typography variant="h4">Heading 4</Typography>
          <Typography variant="h5">Heading 5</Typography>
          <Typography variant="h6">Heading 6</Typography>
        </Box>
        <Box>
          <Typography variant="body1">
            Body 1 text with normal line height and spacing.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Body 2 text with secondary color for less emphasis.
          </Typography>
          <Typography variant="caption" color="text.hint">
            Caption text for small details and metadata.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DemoPage;
