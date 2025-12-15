import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Typography, Button } from '@mui/material';

// --- Import Auth Context ---
import { AuthProvider } from './contexts/AuthContext';

// --- Import your page components ---
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
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
import ImportGenresTopicsPage from './components/ImportGenresTopicsPage';
import SearchByTopicOrGenre from './components/SearchByTopicOrGenre';
import SearchResults from './components/SearchResults';
import MockSearchUI from './components/MockSearchUI';
import DemoPage from './components/DemoPage';
import UploadMediaPage from './components/UploadMediaPage';
import YouTubeCallback from './pages/YouTubeCallback';
import InstapaperAuthPage from './components/InstapaperAuthPage';
import InstapaperImportPage from './components/InstapaperImportPage';
import ReadwiseSyncPage from './components/ReadwiseSyncPage';
import ArticlesPage from './components/ArticlesPage';
import SourceDirectoryPage from './components/SourceDirectoryPage';
import YouTubeChannelList from './components/YouTubeChannelList';
import YouTubeChannelProfile from './components/YouTubeChannelProfile';
import YouTubePlaylistProfile from './components/YouTubePlaylistProfile';
import PodcastSeriesProfile from './components/PodcastSeriesProfile';
import PodcastEpisodeProfile from './components/PodcastEpisodeProfile';
import CleanupManagementPage from './components/CleanupManagementPage';
import WebsiteImportPage from './components/WebsiteImportPage';
import WebsitesPage from './components/WebsitesPage';
import TypesenseAdminPage from './components/TypesenseAdminPage';

// --- Import Design System ---
import { theme } from './components/shared/DesignSystem';
import ResponsiveNavigation from './components/shared/ResponsiveNavigation';

function App() {
  return (
    // The ThemeProvider wraps the entire application
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          {/* Responsive Navigation Component */}
          <ResponsiveNavigation />

          {/* Routes without outer container - each component handles its own layout */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
          <Route path="/add-media" element={<AddMediaForm />} />
          <Route path="/all-media" element={<AllMedia />} />
          <Route path="/mixlists" element={<MixlistsPage />} />
          <Route path="/mixlist/:id" element={<MixlistProfilePage />} />
          <Route path="/mixlist/:id/edit" element={<EditMixlistForm />} />
          <Route path="/create-mixlist" element={<CreateMixlistForm />} />
          <Route path="/import-media" element={<ImportMediaPage />} />
          <Route path="/import-mixlist" element={<ImportMixlistPage />} />
          <Route path="/import-genres-topics" element={<ImportGenresTopicsPage />} />
          <Route path="/upload-media" element={<UploadMediaPage />} />
          <Route path="/search-by-topic-genre" element={<SearchByTopicOrGenre />} />
          <Route path="/search-results" element={<SearchResults />} />
          <Route path="/search" element={<MockSearchUI />} />
          <Route path="/media/:id" element={<MediaProfilePage />} />
          <Route path="/media/:id/edit" element={<EditMediaForm />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/youtube/callback" element={<YouTubeCallback />} />
          <Route path="/instapaper/auth" element={<InstapaperAuthPage />} />
          <Route path="/instapaper/import" element={<InstapaperImportPage />} />
          <Route path="/readwise-sync" element={<ReadwiseSyncPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/sources" element={<SourceDirectoryPage />} />
          <Route path="/youtube-channels" element={<YouTubeChannelList />} />
          <Route path="/youtube-channel/:id" element={<YouTubeChannelProfile />} />
          <Route path="/youtube-playlist/:id" element={<YouTubePlaylistProfile />} />
          <Route path="/podcast-series/:id" element={<PodcastSeriesProfile />} />
          <Route path="/podcast-episode/:id" element={<PodcastEpisodeProfile />} />
          <Route path="/cleanup" element={<CleanupManagementPage />} />
          <Route path="/import-website" element={<WebsiteImportPage />} />
          <Route path="/websites" element={<WebsitesPage />} />
          <Route path="/typesense-admin" element={<TypesenseAdminPage />} />
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
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;