import React, { useState } from 'react';
import { Container, Box, Typography, TextField, IconButton, Grid, Card, CardMedia, CardContent, Button, SpeedDial, SpeedDialIcon, SpeedDialAction, useTheme } from '@mui/material';
import { 
    Search, Book, Movie, Tv, Article, LibraryMusic, Podcasts, SportsEsports, YouTube, Language, MenuBook, AutoAwesome, 
    AddCircleOutline, BookmarkAdd, CloudUpload, Settings, Info, Help, Share, AccountCircle, ArrowForwardIos, Forest, 
    PlaylistAdd, NoteAlt
} from '@mui/icons-material';

// MOCK DATA
const mainMediaIcons = [
    { name: 'Articles & Docs', icon: <Article sx={{ fontSize: 40 }} />, key: 'articles' },
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

const playlists = [
  {
    title: 'Cyberpunk Dystopia',
    description: 'Neon-drenched streets and high-tech, low-life stories.',
    imageUrl: 'https://placehold.co/600x400/1B1B1B/695a8c.png',
  },
  {
    title: 'Ancient Empires',
    description: 'The rise and fall of civilizations, from Rome to the Nile.',
    imageUrl: 'https://placehold.co/600x400/474350/fcfafa.png',
  },
  {
    title: 'Cosmic Wonders',
    description: 'Explore black holes, distant galaxies, and the mysteries of space.',
    imageUrl: 'https://placehold.co/600x400/300a70/fcfafa.png',
  },
  {
    title: 'Mindful Moments',
    description: 'Podcasts and music for focus, meditation, and calm.',
    imageUrl: 'https://placehold.co/600x400/695a8c/1B1B1B.png',
  },
  {
    title: 'Fantasy Realms',
    description: 'Epic quests, magical creatures, and worlds beyond imagination.',
    imageUrl: 'https://placehold.co/600x400/1E1E1E/300a70.png',
  },
  {
    title: 'Code & Coffee',
    description: 'Deep work playlists and tech podcasts to fuel your projects.',
    imageUrl: 'https://placehold.co/600x400/fcfafa/474350.png',
  },
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
const SearchBar = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '700px', margin: 'auto', backgroundColor: 'background.paper', borderRadius: '30px', padding: '5px 15px' }}>
      <TextField
        fullWidth
        variant="standard"
        placeholder="Your next adventure awaits..."
        InputProps={{
          disableUnderline: true,
          style: {
            color: theme.palette.text.primary,
            fontSize: '1.2rem',
          },
        }}
        sx={{ 
          ml: 1, 
          flex: 1,
          '& .MuiInputBase-input::placeholder': {
            color: '#ffffff',
            opacity: 1
          }
        }}
      />
      <IconButton type="submit" sx={{ p: '10px', color: 'primary.main' }} aria-label="search">
        <Search sx={{ fontSize: 30 }} />
      </IconButton>
    </Box>
  );
};

const PlaylistCard = ({ playlist }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardMedia
      component="img"
      sx={{ flexShrink: 0, height: 180 }}
      image={playlist.imageUrl}
      alt={playlist.title}
      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/1e1e1e/fcfafa?text=Image+Error'; }}
    />
    <CardContent sx={{ flexGrow: 1 }}>
      <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
        {playlist.title}
      </Typography>
      <Typography variant="body2" color="#ffffff">
        {playlist.description}
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
                backgroundColor: isDragging ? 'rgba(105, 90, 140, 0.1)' : 'transparent',
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
  
  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', width: '100%' }}>
      <Container maxWidth="lg" sx={{ py: 4, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        
        {/* Header and Search Section */}
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h1">MediaVerse</Typography>
          <SearchBar />
        </Box>

        {/* Media Icons and Actions Section */}
        <Section title="">
            {/* Alphabetized Icons */}
            <Grid container spacing={2} justifyContent="center" sx={{ mt: 4, mb: 2, maxWidth: '900px', margin: 'auto' }}>
              {mainMediaIcons.map((item) => (
                  <Grid item xs={4} sm={3} md={2} key={item.key} sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
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
                <Grid container spacing={4} alignItems="center" justifyContent="center">
                    <Grid item xs={12} sm={6} sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'text.primary', p: 2 }}>
                            <AddCircleOutline sx={{ fontSize: 70, color: 'primary.main' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Create a Mixlist</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'text.primary', p: 2 }}>
                            <BookmarkAdd sx={{ fontSize: 70, color: 'primary.main' }} />
                            <Typography variant="h5" sx={{ mt: 1 }}>Add Media</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Section>

        {/* Mixlists Section */}
        <Section title="My Mixlists">
          <Grid container spacing={4}>
              {playlists.map((item, index) => (
                  <Grid item key={index} xs={12} sm={6} md={4}>
                      <PlaylistCard playlist={item} />
                  </Grid>
              ))}
          </Grid>
        </Section>

        {/* View More Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Button 
                variant="outlined" 
                color="secondary" 
                endIcon={<ArrowForwardIos />}
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
      <FloatingMenu />
    </Box>
  );
}