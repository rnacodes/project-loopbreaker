import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Card, CardContent, CardActions,
    Grid, Button, Chip, Divider
} from '@mui/material';
import {
    Podcasts, MenuBook, MovieFilter, VideoLibrary, Article,
    ArrowForward, CheckCircle, OpenInNew
} from '@mui/icons-material';
import WhiteOutlineButton from './shared/WhiteOutlineButton';

function SourceDirectoryPage() {
    const navigate = useNavigate();

    // Define all available import sources
    const importSources = [
        {
            id: 'podcasts',
            name: 'Podcasts',
            provider: 'ListenNotes',
            providerUrl: 'https://www.listennotes.com',
            icon: <Podcasts sx={{ fontSize: 48 }} />,
            description: 'Search and import podcasts from the largest podcast database. Import individual episodes or entire series.',
            color: '#9C27B0',
            available: true,
            connected: false,
            action: () => navigate('/import-media'),
            features: [
                'Import episodes or series',
                'Auto-fetch metadata & artwork',
                'Episode tracking',
                'Background sync of new episodes',
                'Import listening history from Podcasts app and Apple Podcasts'
            ]
        },
        {
            id: 'books',
            name: 'Books',
            provider: 'Open Library',
            providerUrl: 'https://openlibrary.org',
            icon: <MenuBook sx={{ fontSize: 48 }} />,
            description: 'Import books from Open Library\'s extensive catalog. Search by title, author, or ISBN.',
            color: '#FF9800',
            available: true,
            connected: false,
            action: () => navigate('/import-media'),
            features: [
                'Search millions of books',
                'Import by ISBN or title',
                'Author information',
                'Cover images & descriptions'
            ]
        },

        //TODO: Add TMDB credit and logo here like it is on the ImportMediaPage.jsx
        {
            id: 'movies-tv',
            name: 'Movies & TV Shows',
            provider: 'TMDB',
            providerUrl: 'https://www.themoviedb.org',
            icon: <MovieFilter sx={{ fontSize: 48 }} />,
            description: 'Use MediaVerse as your primary tracker for movies & TV shows.',
            color: '#01D277',
            available: true,
            connected: false,
            action: () => navigate('/import-media'),
            features: [
                'Import: Search movies & TV shows on TMDB',
                'Upload: Export your watchlist from external providers and upload your spreadsheet',
                'Metadata from uploaded lists will be filled in during daily update'
            ]
        },
        {
            id: 'youtube',
            name: 'YouTube Videos',
            provider: 'YouTube',
            providerUrl: 'https://www.youtube.com',
            icon: <VideoLibrary sx={{ fontSize: 48 }} />,
            description: 'Import YouTube videos, playlists, or entire channels to organize your video content.',
            color: '#FF0000',
            available: true,
            connected: false,
            action: () => navigate('/import-media'),
            features: [
                'Import videos by URL',
                'Search YouTube content',
                'Import playlists',
                'Channel subscriptions'
            ]
        },
        {
            id: 'instapaper',
            name: 'Articles',
            provider: 'Instapaper',
            providerUrl: 'https://www.instapaper.com',
            icon: <Article sx={{ fontSize: 48 }} />,
            description: 'Connect your Instapaper account to import saved articles with reading progress and metadata.',
            color: '#428BCA',
            available: true,
            connected: false,
            action: () => navigate('/instapaper/auth'),
            features: [
                'Import from folders',
                'Preserve reading progress',
                'Article metadata',
                'Automatic sync'
            ]
        }
    ];

    return (
        <Box sx={{ minHeight: '100vh', py: 4, px: 2 }}>
            <Container maxWidth="lg">
                {/* Header Section */}
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography 
                        variant="h3" 
                        gutterBottom 
                        fontWeight="bold"
                        sx={{ 
                            background: 'linear-gradient(45deg, #9C27B0 30%, #FF9800 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 2
                        }}
                    >
                        Source Directory
                    </Typography>
                    <Typography 
                        variant="h6" 
                        color="text.secondary" 
                        sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}
                    >
                        Connect your favorite media sources to automatically import and organize your content
                    </Typography>
                    <Divider sx={{ maxWidth: '200px', mx: 'auto', borderWidth: 2, borderColor: 'primary.main' }} />
                </Box>

                {/* Import Sources Grid */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {importSources.map((source) => (
                        <Grid item xs={12} sm={6} md={4} key={source.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease',
                                    border: `2px solid transparent`,
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: `0 12px 24px ${source.color}40`,
                                        borderColor: source.color
                                    }
                                }}
                            >
                                <CardContent sx={{ flex: 1, p: 3 }}>
                                    {/* Icon and Status */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'flex-start',
                                        mb: 2 
                                    }}>
                                        <Box sx={{ 
                                            color: source.color,
                                            p: 1.5,
                                            borderRadius: '12px',
                                            bgcolor: `${source.color}20`,
                                            display: 'flex'
                                        }}>
                                            {source.icon}
                                        </Box>
                                        {source.connected && (
                                            <Chip
                                                icon={<CheckCircle />}
                                                label="Connected"
                                                color="success"
                                                size="small"
                                            />
                                        )}
                                        {!source.available && (
                                            <Chip
                                                label="Coming Soon"
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>

                                    {/* Service Name and Provider */}
                                    <Typography 
                                        variant="h5" 
                                        gutterBottom 
                                        fontWeight="bold"
                                        sx={{ color: source.color }}
                                    >
                                        {source.name}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Powered by
                                        </Typography>
                                        <Button
                                            variant="text"
                                            size="small"
                                            href={source.providerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            endIcon={<OpenInNew sx={{ fontSize: 12 }} />}
                                            sx={{ 
                                                minWidth: 'auto',
                                                textTransform: 'none',
                                                fontSize: '0.75rem',
                                                p: 0.25,
                                                color: 'text.secondary',
                                                '&:hover': { 
                                                    backgroundColor: 'transparent', 
                                                    color: source.color,
                                                    textDecoration: 'underline' 
                                                }
                                            }}
                                        >
                                            {source.provider}
                                        </Button>
                                    </Box>

                                    {/* Description */}
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ mb: 2, minHeight: '60px' }}
                                    >
                                        {source.description}
                                    </Typography>

                                    {/* Features List */}
                                    <Box component="ul" sx={{ 
                                        pl: 2, 
                                        m: 0,
                                        '& li': { 
                                            mb: 0.5,
                                            fontSize: '0.875rem',
                                            color: 'text.secondary'
                                        }
                                    }}>
                                        {source.features.map((feature, idx) => (
                                            <li key={idx}>
                                                <Typography variant="body2" component="span">
                                                    {feature}
                                                </Typography>
                                            </li>
                                        ))}
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 3, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        endIcon={<ArrowForward />}
                                        onClick={source.action}
                                        disabled={!source.available}
                                        sx={{
                                            bgcolor: source.color,
                                            '&:hover': {
                                                bgcolor: source.color,
                                                filter: 'brightness(0.9)'
                                            }
                                        }}
                                    >
                                        {source.connected ? 'Manage Import' : 'Start Importing'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Info Section */}
                <Card sx={{ 
                    mt: 6, 
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                    border: '1px solid rgba(156, 39, 176, 0.3)'
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" gutterBottom fontWeight="bold">
                            How It Works
                        </Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        borderRadius: '50%', 
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2,
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}>
                                        1
                                    </Box>
                                    <Typography variant="h6" gutterBottom>
                                        Choose a Source
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Select from our integrated media sources above
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        borderRadius: '50%', 
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2,
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}>
                                        2
                                    </Box>
                                    <Typography variant="h6" gutterBottom>
                                        Search & Select
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Find the content you want to add to your library
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        borderRadius: '50%', 
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 2,
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold'
                                    }}>
                                        3
                                    </Box>
                                    <Typography variant="h6" gutterBottom>
                                        Import & Organize
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        All metadata is automatically imported and organized
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <WhiteOutlineButton 
                        onClick={() => navigate('/')}
                    >
                        Back to Home
                    </WhiteOutlineButton>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/all-media')}
                    >
                        View My Library
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}

export default SourceDirectoryPage;
