import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Typography, Button } from '@mui/material';

// --- Import your page components ---
import HomePage from './components/HomePage';
import AddMediaForm from './components/AddMediaForm';

import AllMedia from './components/AllMedia';
import MixlistsPage from './components/MixlistsPage';
import CreateMixlistForm from './components/CreateMixlistForm';
import MixlistProfilePage from './components/MixlistProfilePage';
import MediaProfilePage from './components/MediaProfilePage';
import EditMediaForm from './components/EditMediaForm';
import EditMixlistForm from './components/EditMixlistForm';
import ImportMediaPage from './components/ImportMediaPage';
import ImportMixlistPage from './components/ImportMixlistPage';
import SearchByTopicOrGenre from './components/SearchByTopicOrGenre';
import SearchResults from './components/SearchResults';
import DemoPage from './components/DemoPage';
import UploadMediaPage from './components/UploadMediaPage';
import YouTubeCallback from './pages/YouTubeCallback';

// --- Import Design System ---
import { theme } from './components/shared/DesignSystem';
import ResponsiveNavigation from './components/shared/ResponsiveNavigation';

function App() {
  return (
    // The ThemeProvider wraps the entire application
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {/* Responsive Navigation Component */}
        <ResponsiveNavigation />

        {/* Routes without outer container - each component handles its own layout */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add-media" element={<AddMediaForm />} />
          <Route path="/all-media" element={<AllMedia />} />
          <Route path="/mixlists" element={<MixlistsPage />} />
          <Route path="/mixlist/:id" element={<MixlistProfilePage />} />
          <Route path="/mixlist/:id/edit" element={<EditMixlistForm />} />
          <Route path="/create-mixlist" element={<CreateMixlistForm />} />
          <Route path="/import-media" element={<ImportMediaPage />} />
          <Route path="/import-mixlist" element={<ImportMixlistPage />} />
          <Route path="/upload-media" element={<UploadMediaPage />} />
          <Route path="/search-by-topic-genre" element={<SearchByTopicOrGenre />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/media/:id" element={<MediaProfilePage />} />
          <Route path="/media/:id/edit" element={<EditMediaForm />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/youtube/callback" element={<YouTubeCallback />} />
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