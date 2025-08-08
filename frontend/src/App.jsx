import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button } from '@mui/material';

// --- Import your page components ---
import HomePage from './components/HomePage';
import AddMediaForm from './components/AddMediaForm';
import MediaItemProfile from './components/MediaItemProfile';
import AllMedia from './components/AllMedia';
import PlaylistsPage from './components/PlaylistsPage';
import CreatePlaylistForm from './components/CreatePlaylistForm';
import MixlistDetailPage from './components/MixlistDetailPage';
import ImportMediaPage from './components/ImportMediaPage';
import DemoPage from './components/DemoPage';

// --- Import Design System ---
import { theme } from './components/shared/DesignSystem';

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
            <Button color="inherit" component={Link} to="/demo">Demo</Button>
            {/* Add other navigation links here later */}
          </Toolbar>
        </AppBar>

        {/* Routes without outer container - each component handles its own layout */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add-media" element={<AddMediaForm />} />
          <Route path="/all-media" element={<AllMedia />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlist/:id" element={<MixlistDetailPage />} />
          <Route path="/create-playlist" element={<CreatePlaylistForm />} />
          <Route path="/import-media" element={<ImportMediaPage />} />
          <Route path="/media/:id" element={<MediaItemProfile />} />
          <Route path="/demo" element={<DemoPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;