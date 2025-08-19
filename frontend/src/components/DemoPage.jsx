import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Paper,
  Card,
  CardContent,
  CardMedia,
  TextField,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
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
  Search
} from '@mui/icons-material';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TRANSITIONS, SimpleMediaCarousel } from './shared';
import SearchBar from './shared/SearchBar';

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

  const getMediaIcon = (mediaType) => {
    const type = mediaType?.toLowerCase();
    return mediaTypeIcons[type] || mediaTypeIcons.default;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'uncharted':
        return COLORS.status.uncharted;
      case 'actively exploring':
        return COLORS.status.activelyExploring;
      case 'completed':
        return COLORS.status.completed;
      case 'abandoned':
        return COLORS.status.abandoned;
      default:
        return COLORS.text.secondary;
    }
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
          Functional Search Bar Component
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Search through your media library and mixlists. Try searching for titles, descriptions, or media types.
        </Typography>
        <Box sx={{ maxWidth: '700px' }}>
          <SearchBar
            placeholder="Search media and mixlists..."
            onSearch={(query, results) => {
              console.log('Search results:', results);
              setSearchQuery(query);
            }}
            showSuggestions={true}
          />
        </Box>
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
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ mt: 1 }}>Small spinner</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ mt: 1 }}>Medium spinner</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography variant="body2" sx={{ mt: 1 }}>Large spinner</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                {[...Array(3)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: COLORS.primary.main,
                      animation: 'pulse 1.4s ease-in-out infinite both',
                      animationDelay: `${index * 0.16}s`
                    }}
                  />
                ))}
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>Dots loader</Typography>
            </Box>
          </Grid>
        </Grid>
        {loading && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Skeleton
                    variant="rectangular"
                    height={200}
                    sx={{
                      borderRadius: '16px',
                      backgroundColor: COLORS.background.elevated
                    }}
                  />
                  <Box sx={{ mt: 1 }}>
                    <Skeleton
                      variant="text"
                      width="80%"
                      sx={{ backgroundColor: COLORS.background.elevated }}
                    />
                    <Skeleton
                      variant="text"
                      width="60%"
                      sx={{ backgroundColor: COLORS.background.elevated }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
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
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: TRANSITIONS.normal,
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: SHADOWS.lg
                  }
                }}
                onClick={() => handleMediaClick(media)}
              >
                <CardMedia
                  component="img"
                  sx={{ height: 180, objectFit: 'cover' }}
                  image={media.thumbnailUrl}
                  alt={media.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getMediaIcon(media.mediaType)}
                    <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {media.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {media.notes}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={media.mediaType}
                      size="small"
                      sx={{
                        backgroundColor: COLORS.mediaTypes[media.mediaType] || COLORS.mediaTypes.document,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Chip
                      label={media.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(media.status),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
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
          Simple Media Carousel Component
        </Typography>
        <SimpleMediaCarousel
          mediaItems={mockMediaItems}
          title="Featured Media"
          subtitle="Simple carousel with navigation and pagination"
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
                    backgroundColor: getStatusColor(status),
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
