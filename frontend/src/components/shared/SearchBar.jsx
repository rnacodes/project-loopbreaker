import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Search,
  Clear,
  History,
  TrendingUp,
  Book,
  Movie,
  Tv,
  Article,
  LibraryMusic,
  Podcasts,
  SportsEsports,
  YouTube,
  Language
} from '@mui/icons-material';
import { commonStyles, COLORS } from './DesignSystem';

const SearchBar = ({
  onSearch,
  placeholder = "Search your media library...",
  suggestions = [],
  recentSearches = [],
  trendingSearches = [],
  loading = false,
  showSuggestions = true,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  sx = {},
  ...props
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [focused, setFocused] = useState(false);
  const anchorEl = useRef(null);

  // Media type icons for suggestions
  const mediaTypeIcons = {
    podcast: <Podcasts />,
    book: <Book />,
    movie: <Movie />,
    tv: <Tv />,
    article: <Article />,
    music: <LibraryMusic />,
    game: <SportsEsports />,
    video: <YouTube />,
    website: <Language />
  };

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setShowSuggestionsPanel(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestionsPanel(false);
    onSearch?.('');
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title || suggestion);
    handleSearch(suggestion.title || suggestion);
  };

  const handleFocus = () => {
    setFocused(true);
    if (showSuggestions && (suggestions.length > 0 || recentSearches.length > 0 || trendingSearches.length > 0)) {
      setShowSuggestionsPanel(true);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestionsPanel(false), 200);
  };

  // Filter suggestions based on query
  const filteredSuggestions = suggestions.filter(item =>
    item.title?.toLowerCase().includes(query.toLowerCase()) ||
    item.mediaType?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto', ...sx }}>
      <TextField
        ref={anchorEl}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        sx={{
          ...commonStyles.searchBar,
          '& .MuiOutlinedInput-root': {
            backgroundColor: COLORS.background.elevated,
            borderRadius: '24px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: COLORS.primary.light
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: COLORS.primary.main,
              borderWidth: '2px'
            }
          },
          '& .MuiInputBase-input': {
            fontSize: '1.1rem',
            padding: '12px 16px'
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                onClick={() => handleSearch()}
                edge="start"
                sx={{ color: COLORS.primary.main }}
              >
                {loading ? <CircularProgress size={20} /> : <Search />}
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                edge="end"
                sx={{ color: COLORS.text.hint }}
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          )
        }}
        {...props}
      />

      {/* Suggestions Panel */}
      {showSuggestionsPanel && (focused || showSuggestionsPanel) && (
        <Popper
          open={showSuggestionsPanel}
          anchorEl={anchorEl.current}
          placement="bottom-start"
          sx={{
            zIndex: 1300,
            width: anchorEl.current?.offsetWidth || '100%',
            mt: 1
          }}
        >
          <Paper
            elevation={8}
            sx={{
              backgroundColor: COLORS.background.paper,
              borderRadius: '16px',
              maxHeight: '400px',
              overflow: 'auto',
              border: `1px solid ${COLORS.primary.main}20`
            }}
          >
            {/* Search Suggestions */}
            {filteredSuggestions.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 1,
                    color: COLORS.text.secondary,
                    borderBottom: `1px solid ${COLORS.background.elevated}`
                  }}
                >
                  Search Results
                </Typography>
                <List dense>
                  {filteredSuggestions.slice(0, 5).map((item, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSuggestionClick(item)}
                      sx={{
                        '&:hover': {
                          backgroundColor: COLORS.background.elevated
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: COLORS.primary.main }}>
                        {mediaTypeIcons[item.mediaType?.toLowerCase()] || <Search />}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={item.mediaType}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: COLORS.text.primary
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: COLORS.text.secondary
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 1,
                    color: COLORS.text.secondary,
                    borderBottom: `1px solid ${COLORS.background.elevated}`
                  }}
                >
                  Recent Searches
                </Typography>
                <List dense>
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSuggestionClick(search)}
                      sx={{
                        '&:hover': {
                          backgroundColor: COLORS.background.elevated
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: COLORS.text.hint }}>
                        <History />
                      </ListItemIcon>
                      <ListItemText
                        primary={search}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: COLORS.text.primary
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Trending Searches */}
            {trendingSearches.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 2,
                    py: 1,
                    color: COLORS.text.secondary,
                    borderBottom: `1px solid ${COLORS.background.elevated}`
                  }}
                >
                  Trending
                </Typography>
                <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {trendingSearches.slice(0, 6).map((trend, index) => (
                    <Chip
                      key={index}
                      label={trend}
                      size="small"
                      icon={<TrendingUp />}
                      onClick={() => handleSuggestionClick(trend)}
                      sx={{
                        backgroundColor: COLORS.primary.main,
                        color: COLORS.primary.contrastText,
                        '&:hover': {
                          backgroundColor: COLORS.primary.dark
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* No results message */}
            {filteredSuggestions.length === 0 && recentSearches.length === 0 && trendingSearches.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color={COLORS.text.hint}>
                  No suggestions available
                </Typography>
              </Box>
            )}
          </Paper>
        </Popper>
      )}
    </Box>
  );
};

export default SearchBar;
