import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, IconButton, Grid, Card, CardMedia, CardContent, Button, SpeedDial, SpeedDialIcon, SpeedDialAction, useTheme, CircularProgress } from '@mui/material';
import { 
    Search, Book, Movie, Tv, Article, LibraryMusic, Podcasts, SportsEsports, YouTube, Language, MenuBook, AutoAwesome, 
    AddCircleOutline, BookmarkAdd, CloudUpload, Settings, Info, Help, Share, AccountCircle, ArrowForwardIos, Forest, 
    PlaylistAdd, NoteAlt, ImportExport, Topic, FileDownload
} from '@mui/icons-material';
import { getAllMixlists, seedMixlists } from '../services/apiService';

// MOCK DATA
const mainMediaIcons = [
    { name: 'Articles', icon: <Article sx={{ fontSize: 40 }} />, key: 'articles' },
    { name: 'Books', icon: <Book sx={{ fontSize: 40 }} />, key: 'books' },
    { name: 'Documents and Notes', icon: <NoteAlt sx={{ fontSize: 40 }} />, key: 'articles' },
    { name: 'Movies', icon: <Movie sx={{ fontSize: 40 }} />, key: 'movies' },
    { name: 'Music', icon: <LibraryMusic sx={{ fontSize: 40 }} />, key: 'music' },
    { name: 'Online Videos', icon: <YouTube sx={{ fontSize: 40 }} />, key: 'online_videos' },
    { name: 'Podcasts', icon: <Podcasts sx={{ fontSize: 40 }} />, key: 'podcasts' },
    { name: 'TV Shows', icon: <Tv sx={{ fontSize: 40 }} />, key: 'tv' },
    { name: 'Video Games', icon: <SportsEsports sx={{ fontSize: 40 }} />, key: 'games' },
    { name: 'Websites', icon: <Language sx={{ fontSize: 40 }} />, key: 'websites' },
];

const specialMediaIcons = [
    { name: 'Commonplace ZK', icon: <MenuBook sx={{ fontSize: 40 }} />, key: 'zk' },
    { name: 'Panorama', icon: <AutoAwesome sx={{ fontSize: 40 }} />, key: 'panorama' },
];

const smartSearches = [
  'Medium-length online article',
  '20+ min YouTube video',
  'Quick summary podcast',
  'In-depth research paper',
];

const speedDialActions = [
    { icon: <AccountCircle />, name: 'Profile', key: 'account' },
    { icon: <Share />, name: 'Share', key: 'share' },
    { icon: <Help />, name: 'Help', key: 'help' },
    { icon: <Info />, name: 'About', key: 'info' },
    { icon: <Settings />, name: 'Settings', key: 'settings' },
];

// COMPONENTS
import SearchBar from './shared/SearchBar';

    const MixlistCard = ({ mixlist, onNavigate }) => (
  <Card 
    sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-4px) scale(1.02)',
        boxShadow: 8,
        '& .MuiCardMedia-root': {
          transform: 'scale(1.05)'
        }
      },
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}
    onClick={() => onNavigate(`/mixlist/${mixlist.id || mixlist.Id}`)}
  >
    <CardMedia
      component="img"
      sx={{ 
        flexShrink: 0, 
        height: 180,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
              image={mixlist.thumbnail || mixlist.Thumbnail}
        alt={mixlist.name || mixlist.Name}
      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/1e1e1e/fcfafa?text=Image+Error'; }}
    />
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
        {mixlist.name || mixlist.Name}
      </Typography>
      <Typography variant="body2" color="#ffffff">
        {mixlist.description || mixlist.Description}
      </Typography>
    </CardContent>
  </Card>
);

const Section = ({ title, children }) => (
    <Box sx={{ my: 6 }}>
        {title && <Typography variant="h4">{title}</Typography>}
        {children}
    </Box>
);

const UploadArea = () => {
    const theme = useTheme();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const files = [...e.dataTransfer.files]; console.log("Files dropped:", files);
    };

    return (
        <Box
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            sx={{
                border: `3px dashed ${isDragging ? theme.palette.primary.main : theme.palette.text.secondary}`,
                borderRadius: '16px', p: 4, textAlign: 'center',
                backgroundColor: isDragging ? 'rgba(54, 39, 89, 0.1)' : 'transparent',
                transition: 'border-color 0.3s ease, background-color 0.3s ease, transform 0.3s ease',
                cursor: 'pointer', '&:hover': { transform: 'scale(1.02)', borderColor: theme.palette.primary.main }
            }}
        >
            <CloudUpload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.primary">Upload new media list here</Typography>
            <Typography variant="body2" color="text.secondary">Drag & Drop a file or click to select</Typography>
        </Box>
    );
};

const FloatingMenu = () => (
    <SpeedDial
        ariaLabel="SpeedDial menu"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon />}
    >
        {speedDialActions.map((action) => (
            <SpeedDialAction
                key={action.key}
                icon={action.icon}
                tooltipTitle={action.name}
            />
        ))}
    </SpeedDial>
);

// MAIN HOMEPAGE COMPONENT
export default function HomePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mixlists, setMixlists] = useState([]);
  const [mixlistsLoading, setMixlistsLoading] = useState(true);
  const [mixlistsError, setMixlistsError] = useState(null);

  useEffect(() => {
    const fetchMixlists = async () => {
      try {
        setMixlistsLoading(true);
        setMixlistsError(null);
        
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          setMixlistsLoading(false);
          setMixlistsError("Request timed out. Please check your connection.");
        }, 10000); // 10 second timeout
        
        const response = await getAllMixlists();
        clearTimeout(timeoutId);
        setMixlists(response.data);
      } catch (error) {
        console.error("Error fetching mixlists:", error);
        setMixlistsError("Failed to load mixlists");
      } finally {
        setMixlistsLoading(false);
      }
    };
    fetchMixlists();
  }, []);

  const handleCreateMixlist = () => {
                            navigate('/create-mixlist');
  };

  const handleImportMedia = () => {
    navigate('/import-media');
  };

  const handleSearchByTopicOrGenre = () => {
    navigate('/search-by-topic-genre');
  };

  const handleAddMedia = () => {
    navigate('/add-media');
  };

  const handleSeedMixlists = async () => {
    try {
      setMixlistsLoading(true);
      await seedMixlists();
      // Refresh the mixlists after seeding
      const response = await getAllMixlists();
      setMixlists(response.data);
    } catch (error) {
      console.error("Error seeding mixlists:", error);
    } finally {
      setMixlistsLoading(false);
    }
  };
  
  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', width: '100%' }}>
      {mixlistsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Loading MediaVerse...</Typography>
          </Box>
        </Box>
      ) : mixlistsError ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>{mixlistsError}</Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Box>
        </Box>
      ) : (
        <Container maxWidth="lg" sx={{ py: 4, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        
        {/* Header and Search Section */}
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h1">MediaVerse</Typography>
          <SearchBar 
            placeholder="Your next adventure awaits..."
            onSearch={(query, results) => {
              console.log('Search results:', results);
              // You can add navigation logic here based on results
            }}
            showSuggestions={true}
          />
        </Box>

        {/* Media Icons and Actions Section */}
        <Section title="">
            {/* Alphabetized Icons */}
            <Grid container spacing={2} justifyContent="center" sx={{ mt: 4, mb: 2, maxWidth: '900px', margin: 'auto' }}>
              {mainMediaIcons.map((item) => (
                  <Grid item xs={4} sm={3} md={2} key={item.key} sx={{ textAlign: 'center' }}>
                      <Box 
                          onClick={() => {
                              if (item.key === 'podcasts') {
                                  navigate('/all-media?mediaType=Podcast');
                              } else if (item.key === 'books') {
                                  navigate('/all-media?mediaType=Book');
                              } else {
                                  // For other media types, you can add navigation logic here
                                  console.log(`Clicked on ${item.name}`);
                              }
                          }}
                          sx={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              cursor: 'pointer', 
                              color: 'text.secondary', 
                              '&:hover': { 
                                  color: 'text.primary',
                                  transform: 'scale(1.05)',
                                  transition: 'transform 0.2s ease'
                              } 
                          }}
                      >
                          {item.icon}
                          <Typography variant="caption" sx={{ mt: 0.5 }}>{item.name}</Typography>
                      </Box>
                  </Grid>
              ))}
            </Grid>
            {/* Special, larger icons */}
            <Grid container spacing={2} justifyContent="center" sx={{ mb: 4, maxWidth: '900px', margin: 'auto' }}>
                {specialMediaIcons.map((item) => (
                    <Grid item xs={6} sm={4} md={3} key={item.key} sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                            {React.cloneElement(item.icon, { sx: { fontSize: 50 } })}
                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 'bold' }}>{item.name}</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 4, p: 3, backgroundColor: 'background.paper', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <Grid container spacing={3} alignItems="center" justifyContent="center">
                    <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center' }}>
                        <Box 
                            onClick={handleCreateMixlist}
                            sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                color: 'text.primary', 
                                p: 2,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s ease'
                                }
                            }}
                        >
                            <AddCircleOutline sx={{ fontSize: 70, color: '#695a8c' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Create a Mixlist</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center' }}>
                        <Box 
                            onClick={handleImportMedia}
                            sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                color: 'text.primary', 
                                p: 2,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s ease'
                                }
                            }}
                        >
                            <ImportExport sx={{ fontSize: 70, color: '#695a8c' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Import Media</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center' }}>
                        <Box 
                            onClick={handleSearchByTopicOrGenre}
                            sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                color: 'text.primary', 
                                p: 2,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s ease'
                                }
                            }}
                        >
                            <Topic sx={{ fontSize: 70, color: '#695a8c' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Browse Topics/Genres</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center' }}>
                        <Box 
                            onClick={handleAddMedia}
                            sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                color: 'text.primary', 
                                p: 2,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s ease'
                                }
                            }}
                        >
                            <BookmarkAdd sx={{ fontSize: 70, color: '#695a8c' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Add Media</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center' }}>
                        <Box 
                            onClick={() => window.open('/api/media/export', '_blank')}
                            sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                color: 'text.primary', 
                                p: 2,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s ease'
                                }
                            }}
                        >
                            <FileDownload sx={{ fontSize: 70, color: '#695a8c' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Export All Media</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ textAlign: 'center' }}>
                        <Box 
                            onClick={() => window.open('/api/mixlist/export', '_blank')}
                            sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                cursor: 'pointer', 
                                color: 'text.primary', 
                                p: 2,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.2s ease'
                                }
                            }}
                        >
                            <FileDownload sx={{ fontSize: 70, color: '#695a8c' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Export All Mixlists</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Section>

        {/* Mixlists Section */}
        <Section title="Recent Mixlists">
          {mixlistsLoading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary">Loading mixlists...</Typography>
            </Box>
          ) : mixlists.length > 6 && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Showing 6 of {mixlists.length} mixlists
            </Typography>
          )}
          <Grid container spacing={4}>
              {mixlists.length === 0 ? (
                  <Grid item xs={12} sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">No mixlists found. Create one to get started!</Typography>
                      <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleCreateMixlist}
                          sx={{ mt: 2 }}
                      >
                          Create New Mixlist
                      </Button>
                      <Button 
                          variant="outlined" 
                          color="secondary" 
                          onClick={handleSeedMixlists}
                          sx={{ mt: 2 }}
                      >
                          Seed Mixlists (Development)
                      </Button>
                  </Grid>
              ) : (
                  mixlists.slice(0, 6).map((item, index) => (
                      <Grid item key={index} xs={12} sm={6} md={4}>
                          <MixlistCard mixlist={item} onNavigate={navigate} />
                      </Grid>
                  ))
              )}
          </Grid>
        </Section>

        {/* View More Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
            <Button 
                variant="contained" 
                color="secondary" 
                size="large"
                endIcon={<ArrowForwardIos />}
                onClick={() => navigate('/mixlists')}
                sx={{ 
                    fontSize: '1.2rem', 
                    padding: '12px 30px', 
                    mb: 4, 
                    minWidth: '300px',
                    color: theme.palette.background.default,
                    backgroundColor: theme.palette.text.primary
                }}
            >
                View More Mixlists
            </Button>
        </Box>

        {/* Smart Search Section */}
        <Section title="Smart Search and Recommendations">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                {smartSearches.map((search, index) => (
                    <Button key={index} variant="contained" color="primary">{search}</Button>
                ))}
                <Button key="topics-tree" variant="contained" color="primary" startIcon={<Forest />}>
                    View Topics Tree
                </Button>
                <IconButton key="add-list" sx={{ backgroundColor: 'primary.main', color: 'white', '&:hover': { backgroundColor: 'primary.dark' } }}>
                    <PlaylistAdd />
                </IconButton>
            </Box>
        </Section>
        
        {/* Upload Section */}
        <Section title="Upload Media">
            <UploadArea />
        </Section>
        
        {/* Action Buttons Section */}
        <Box sx={{ textAlign: 'center', my: 6 }}>
            <Button 
                variant="contained" color="secondary" size="large"
                sx={{ 
                    fontSize: '1.2rem', 
                    padding: '12px 30px', 
                    mb: 4, 
                    minWidth: '300px',
                    color: theme.palette.background.default,
                    backgroundColor: theme.palette.text.primary
                }}
            >
                I'm Feeling Lucky
            </Button>
            <Card 
                elevation={8}
                sx={{
                    backgroundColor: 'primary.main',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    width: 250,
                    height: 200,
                    mx: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 25px rgba(252, 250, 250, 0.3)',
                    }
                }}
            >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                        Productivity Portal
                    </Typography>
                </CardContent>
            </Card>
        </Box>

      </Container>
      )}
      <FloatingMenu />
    </Box>
  );
}