import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

// --- Import your page components ---
import HomePage from './components/HomePage';
import AddMediaForm from './components/AddMediaForm';
import MediaItemProfile from './components/MediaItemProfile';
import AllMedia from './components/AllMedia';
import PlaylistsPage from './components/PlaylistsPage';
import CreatePlaylistForm from './components/CreatePlaylistForm';
import ImportMediaPage from './components/ImportMediaPage';

// 1. THEME AND STYLING
// Define the custom color palette for Dark Mode
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#695a8c', // ultra-violet
    },
    secondary: {
      main: '#fcfafa', // seasalt
    },
    background: {
      default: '#1B1B1B', // Updated to match HomePage
      paper: '#474350', // davys-gray
    },
    text: {
      primary: '#fcfafa', // seasalt
      secondary: '#695a8c', // Updated to match HomePage
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: {
      fontSize: '3rem', // Updated to match HomePage
      fontWeight: 700,
      color: '#fcfafa',
      textAlign: 'center',
      marginBottom: '1rem',
    },
    h4: {
      fontWeight: 600,
      color: '#fcfafa',
      borderBottom: '2px solid #695a8c',
      paddingBottom: '0.5rem',
      marginBottom: '1.5rem',
    },
    body1: {
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#474350', // davys-gray
          borderRadius: '16px',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 8px 25px rgba(252, 250, 250, 0.2)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    // The ThemeProvider wraps the entire application
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* The AppBar is now part of the main layout */}
        <AppBar position="static" sx={{ backgroundColor: 'background.paper' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <Button color="inherit" component={Link} to="/">
                Project Loopbreaker
              </Button>
            </Typography>
            <Button color="inherit" component={Link} to="/all-media">All Media</Button>
            <Button color="inherit" component={Link} to="/playlists">Mixlists</Button>
            <Button color="inherit" component={Link} to="/add-media">Add Media</Button>
            <Button color="inherit" component={Link} to="/import-media">Import Media</Button>
            {/* Add other navigation links here later */}
          </Toolbar>
        </AppBar>

        {/* Routes without outer container - each component handles its own layout */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add-media" element={<AddMediaForm />} />
          <Route path="/all-media" element={<AllMedia />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/create-playlist" element={<CreatePlaylistForm />} />
          <Route path="/import-media" element={<ImportMediaPage />} />
          <Route path="/media/:id" element={<MediaItemProfile />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;