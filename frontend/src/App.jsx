import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, AppBar, Toolbar, Typography, Button } from '@mui/material';

// --- Import your page components ---
import HomePage from './components/HomePage';
import AddMediaForm from './components/AddMediaForm';
import MediaItemProfile from './components/MediaItemProfile';
import AllMedia from './components/AllMedia';
import MixlistsPage from './components/MixlistsPage';
import CreateMixlistForm from './components/CreateMixlistForm';
import MixlistDetailPage from './components/MixlistDetailPage';
import ImportMediaPage from './components/ImportMediaPage';
import SearchByTopicOrGenre from './components/SearchByTopicOrGenre';
import SearchResults from './components/SearchResults';
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
            <Button color="inherit" component={Link} to="/mixlists">Mixlists</Button>
            <Button color="inherit" component={Link} to="/add-media">Add Media</Button>
            <Button color="inherit" component={Link} to="/import-media">Import Media</Button>
            <Button color="inherit" component={Link} to="/search-by-topic-genre">Search by Topic/Genre</Button>
            <Button color="inherit" component={Link} to="/demo">Demo</Button>
            {/* Add other navigation links here later */}
          </Toolbar>
        </AppBar>

        {/* Routes without outer container - each component handles its own layout */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add-media" element={<AddMediaForm />} />
          <Route path="/all-media" element={<AllMedia />} />
          <Route path="/mixlists" element={<MixlistsPage />} />
          <Route path="/mixlist/:id" element={<MixlistDetailPage />} />
          <Route path="/create-mixlist" element={<CreateMixlistForm />} />
          <Route path="/import-media" element={<ImportMediaPage />} />
          <Route path="/search-by-topic-genre" element={<SearchByTopicOrGenre />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/media/:id" element={<MediaItemProfile />} />
          <Route path="/demo" element={<DemoPage />} />
          {/* Catch-all route for 404 */}
          <Route path="*" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Typography variant="h4">Page Not Found</Typography>
              <Typography variant="body1">The page you're looking for doesn't exist.</Typography>
              <Button component={Link} to="/" variant="contained" sx={{ mt: 2 }}>
                Go Home
              </Button>
            </div>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;