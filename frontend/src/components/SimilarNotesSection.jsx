import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  Note as NoteIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { getSimilarNotes } from '../api';

// Vault color mapping
const vaultColors = {
  general: '#4caf50',
  programming: '#2196f3',
};

function SimilarNotesSection({ note, setSnackbar }) {
  const [similarNotes, setSimilarNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasEmbedding, setHasEmbedding] = useState(true);

  const getVaultColor = (vaultName) => {
    return vaultColors[vaultName?.toLowerCase()] || '#9e9e9e';
  };

  const fetchSimilarNotes = useCallback(async () => {
    if (!note?.id) return;

    setLoading(true);
    setError(null);

    try {
      const notes = await getSimilarNotes(note.id, 6);
      setSimilarNotes(notes || []);
      setHasEmbedding(true);
    } catch (err) {
      console.error('Error fetching similar notes:', err);
      // Check if error is due to missing embedding
      if (err.response?.status === 400 || err.response?.data?.message?.includes('embedding')) {
        setHasEmbedding(false);
        setSimilarNotes([]);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load similar notes');
      }
    } finally {
      setLoading(false);
    }
  }, [note?.id]);

  useEffect(() => {
    fetchSimilarNotes();
  }, [fetchSimilarNotes]);

  // Don't render if no embedding
  if (!hasEmbedding && !loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesomeIcon color="action" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Similar Notes
            </Typography>
          </Box>
          <Alert severity="info">
            Generate embeddings in the AI Admin page to enable similar note recommendations.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Similar Notes
            </Typography>
            <Chip label="AI" size="small" color="secondary" sx={{ ml: 1 }} />
          </Box>
          <Tooltip title="Refresh recommendations">
            <IconButton onClick={fetchSimilarNotes} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && similarNotes.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No similar notes found
          </Typography>
        )}

        {!loading && !error && similarNotes.length > 0 && (
          <List disablePadding>
            {similarNotes.map((similarNote) => (
              <ListItem
                key={similarNote.id}
                component={RouterLink}
                to={`/note/${similarNote.id}`}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  textDecoration: 'none',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <NoteIcon sx={{ mr: 2, color: 'text.secondary' }} />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {similarNote.title}
                      </Typography>
                      <Chip
                        icon={<FolderIcon sx={{ fontSize: '0.8rem !important' }} />}
                        label={similarNote.vaultName}
                        size="small"
                        sx={{
                          bgcolor: getVaultColor(similarNote.vaultName),
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 22,
                        }}
                      />
                      {similarNote.similarityScore && (
                        <Chip
                          label={`${Math.round(similarNote.similarityScore * 100)}%`}
                          size="small"
                          color="secondary"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    similarNote.description || similarNote.aiDescription ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {similarNote.description || similarNote.aiDescription}
                      </Typography>
                    ) : null
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(SimilarNotesSection);
