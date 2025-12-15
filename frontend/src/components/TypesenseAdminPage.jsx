import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { typesenseReindex, typesenseHealth, typesenseSearch } from '../services/apiService';

const TypesenseAdminPage = () => {
  // State for reindexing
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState(null);
  const [reindexError, setReindexError] = useState(null);

  // State for health check
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  // State for search testing
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Check health on component mount
  useEffect(() => {
    checkHealth();
  }, []);

  // Handler for bulk reindex
  const handleReindex = async () => {
    setReindexing(true);
    setReindexResult(null);
    setReindexError(null);

    try {
      const result = await typesenseReindex();
      setReindexResult(result);
    } catch (error) {
      setReindexError(error.response?.data?.message || error.message || 'Failed to reindex');
    } finally {
      setReindexing(false);
    }
  };

  // Handler for health check
  const checkHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);

    try {
      const result = await typesenseHealth();
      setHealthStatus(result);
    } catch (error) {
      setHealthError(error.response?.data?.message || error.message || 'Failed to check health');
      setHealthStatus(null);
    } finally {
      setHealthLoading(false);
    }
  };

  // Handler for search test
  const handleSearchTest = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const result = await typesenseSearch(searchQuery, searchType);
      setSearchResults(result);
    } catch (error) {
      setSearchError(error.response?.data?.message || error.message || 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const mediaTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'Book', label: 'Books' },
    { value: 'Article', label: 'Articles' },
    { value: 'Movie', label: 'Movies' },
    { value: 'TVShow', label: 'TV Shows' },
    { value: 'Video', label: 'Videos' },
    { value: 'Podcast', label: 'Podcasts' },
    { value: 'Website', label: 'Websites' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Typesense Administration
      </Typography>

      {/* Health Status Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            System Health
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={checkHealth}
            disabled={healthLoading}
          >
            Refresh
          </Button>
        </Box>

        {healthLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {healthError && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
            <strong>Health Check Failed:</strong> {healthError}
          </Alert>
        )}

        {healthStatus && (
          <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {healthStatus.status?.toUpperCase() || 'HEALTHY'}
                  </Typography>
                  <Typography variant="body2">
                    {healthStatus.message || 'Typesense integration is operational.'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>

      {/* Bulk Reindex Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Bulk Reindex
        </Typography>
        
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          This will reindex all media items in your database. This operation may take several minutes depending on the size of your media library.
        </Alert>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={reindexing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={handleReindex}
          disabled={reindexing}
          sx={{ mb: 2 }}
        >
          {reindexing ? 'Reindexing...' : 'Start Bulk Reindex'}
        </Button>

        {reindexError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Reindex Failed:</strong> {reindexError}
          </Alert>
        )}

        {reindexResult && (
          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                ✓ Reindex Complete
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {reindexResult.indexed_count || reindexResult.indexedCount || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Items Indexed
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {reindexResult.successful_count || reindexResult.successfulCount || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Successful
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {reindexResult.failed_count || reindexResult.failedCount || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Failed
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {reindexResult.duration_seconds || reindexResult.durationSeconds || 'N/A'}s
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Duration
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {reindexResult.message && (
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                  {reindexResult.message}
                </Typography>
              )}

              {reindexResult.errors && reindexResult.errors.length > 0 && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography color="error">
                      View Errors ({reindexResult.errors.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {reindexResult.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={error}
                            sx={{ color: 'error.main' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}
      </Paper>

      {/* Search Testing Section */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Search Testing
        </Typography>
        
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          Test your Typesense search functionality by entering a query below. This uses the same search API as your application.
        </Alert>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search Query"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearchTest();
                }
              }}
              placeholder="Enter search terms..."
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Media Type</InputLabel>
              <Select
                value={searchType}
                label="Media Type"
                onChange={(e) => setSearchType(e.target.value)}
              >
                {mediaTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          startIcon={searchLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          onClick={handleSearchTest}
          disabled={searchLoading || !searchQuery.trim()}
        >
          {searchLoading ? 'Searching...' : 'Test Search'}
        </Button>

        {searchError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Search Failed:</strong> {searchError}
          </Alert>
        )}

        {searchResults && (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Search Results
                </Typography>
                <Chip
                  label={`${searchResults.found || 0} results`}
                  color="primary"
                  size="small"
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {searchResults.hits && searchResults.hits.length > 0 ? (
                <List>
                  {searchResults.hits.slice(0, 10).map((hit, index) => {
                    const doc = hit.document;
                    return (
                      <ListItem
                        key={doc.id || index}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {doc.title}
                          </Typography>
                          <Chip label={doc.media_type} size="small" color="secondary" />
                        </Box>

                        {doc.description && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {doc.description.substring(0, 150)}
                            {doc.description.length > 150 ? '...' : ''}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {doc.author && (
                            <Chip label={`Author: ${doc.author}`} size="small" variant="outlined" />
                          )}
                          {doc.director && (
                            <Chip label={`Director: ${doc.director}`} size="small" variant="outlined" />
                          )}
                          {doc.creator && (
                            <Chip label={`Creator: ${doc.creator}`} size="small" variant="outlined" />
                          )}
                          {doc.status && (
                            <Chip label={doc.status} size="small" variant="outlined" />
                          )}
                          {doc.rating && (
                            <Chip label={doc.rating} size="small" variant="outlined" color="primary" />
                          )}
                          {hit.text_match && (
                            <Chip
                              label={`Match Score: ${Math.round(hit.text_match / 1000000)}`}
                              size="small"
                              color="info"
                            />
                          )}
                        </Box>

                        {(doc.topics && doc.topics.length > 0) && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Topics: {doc.topics.join(', ')}
                            </Typography>
                          </Box>
                        )}

                        {(doc.genres && doc.genres.length > 0) && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="textSecondary">
                              Genres: {doc.genres.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Alert severity="info">
                  No results found for "{searchQuery}"
                </Alert>
              )}

              {searchResults.hits && searchResults.hits.length > 10 && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                  Showing first 10 of {searchResults.found} results
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Paper>
    </Container>
  );
};

export default TypesenseAdminPage;

