import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails,
    List, ListItem, ListItemText, ListItemButton, Chip, CircularProgress,
    Alert, Grid, Card, CardContent, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, DialogContentText
} from '@mui/material';
import { ExpandMore, Topic as TopicIcon, Category as GenreIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getAllTopics, getAllGenres, createTopic, createGenre, deleteTopic, deleteGenre } from '../api';

function SearchByTopicOrGenre() {
    const [expanded, setExpanded] = useState(false);
    const [topics, setTopics] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Dialog states
    const [openTopicDialog, setOpenTopicDialog] = useState(false);
    const [openGenreDialog, setOpenGenreDialog] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [newGenreName, setNewGenreName] = useState('');
    const [creating, setCreating] = useState(false);
    
    // Delete dialog states
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'topic' | 'genre', id, name }
    const [deleting, setDeleting] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [topicsResponse, genresResponse] = await Promise.all([
                    getAllTopics(),
                    getAllGenres()
                ]);
                
                setTopics(topicsResponse.data.sort((a, b) => (a.name || a.Name).localeCompare(b.name || b.Name)));
                setGenres(genresResponse.data.sort((a, b) => (a.name || a.Name).localeCompare(b.name || b.Name)));
            } catch (err) {
                console.error('Error loading topics and genres:', err);
                setError('Failed to load topics and genres');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const handleTopicClick = (topic) => {
        // Navigate to unified search with topic filter
        navigate(`/search?topics=${encodeURIComponent(topic.name || topic.Name)}`);
    };

    const handleGenreClick = (genre) => {
        // Navigate to unified search with genre filter
        navigate(`/search?genres=${encodeURIComponent(genre.name || genre.Name)}`);
    };

    const handleCreateTopic = async () => {
        if (!newTopicName.trim()) {
            setError('Topic name cannot be empty');
            return;
        }

        setCreating(true);
        setError('');
        setSuccess('');

        try {
            const response = await createTopic({ name: newTopicName.trim() });
            setSuccess(`Topic "${newTopicName}" created successfully!`);
            setNewTopicName('');
            setOpenTopicDialog(false);
            
            // Refresh the topics list
            const topicsResponse = await getAllTopics();
            setTopics(topicsResponse.data.sort((a, b) => (a.name || a.Name).localeCompare(b.name || b.Name)));
        } catch (err) {
            console.error('Error creating topic:', err);
            setError(err.response?.data?.message || 'Failed to create topic');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateGenre = async () => {
        if (!newGenreName.trim()) {
            setError('Genre name cannot be empty');
            return;
        }

        setCreating(true);
        setError('');
        setSuccess('');

        try {
            const response = await createGenre({ name: newGenreName.trim() });
            setSuccess(`Genre "${newGenreName}" created successfully!`);
            setNewGenreName('');
            setOpenGenreDialog(false);
            
            // Refresh the genres list
            const genresResponse = await getAllGenres();
            setGenres(genresResponse.data.sort((a, b) => (a.name || a.Name).localeCompare(b.name || b.Name)));
        } catch (err) {
            console.error('Error creating genre:', err);
            setError(err.response?.data?.message || 'Failed to create genre');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (type, item) => {
        setDeleteTarget({
            type,
            id: item.id || item.Id,
            name: item.name || item.Name,
            mediaItemCount: (item.mediaItemIds || item.MediaItemIds || []).length
        });
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);
        setError('');
        setSuccess('');

        try {
            if (deleteTarget.type === 'topic') {
                await deleteTopic(deleteTarget.id);
                setSuccess(`Topic "${deleteTarget.name}" deleted successfully!`);
                
                // Refresh the topics list
                const topicsResponse = await getAllTopics();
                setTopics(topicsResponse.data.sort((a, b) => (a.name || a.Name).localeCompare(b.name || b.Name)));
            } else {
                await deleteGenre(deleteTarget.id);
                setSuccess(`Genre "${deleteTarget.name}" deleted successfully!`);
                
                // Refresh the genres list
                const genresResponse = await getAllGenres();
                setGenres(genresResponse.data.sort((a, b) => (a.name || a.Name).localeCompare(b.name || b.Name)));
            }
            
            setOpenDeleteDialog(false);
            setDeleteTarget(null);
        } catch (err) {
            console.error(`Error deleting ${deleteTarget.type}:`, err);
            const errorMessage = err.response?.data?.message || err.response?.data || `Failed to delete ${deleteTarget.type}`;
            setError(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
        setDeleteTarget(null);
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}>
                    📚 Topics & Genres Directory
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Browse, create, and manage all your topics and genres. Click any to see related media, or{' '}
                    <Button 
                        variant="text" 
                        onClick={() => navigate('/search')}
                        sx={{ p: 0, minWidth: 'auto', textTransform: 'none', verticalAlign: 'baseline' }}
                    >
                        go to advanced search
                    </Button>
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {/* Topics Section */}
                <Accordion 
                    expanded={expanded === 'topics'} 
                    onChange={handleAccordionChange('topics')}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                        aria-controls="topics-content"
                        id="topics-header"
                        sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                            '& .MuiTypography-root': {
                                color: 'white',
                                fontWeight: 'bold'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <TopicIcon />
                            <Typography variant="h6">
                                Topics ({topics.length})
                            </Typography>
                            <Box sx={{ ml: 'auto' }}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenTopicDialog(true);
                                    }}
                                    sx={{ 
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {topics.length === 0 ? (
                            <Typography color="text.secondary">
                                No topics found. Topics will appear here after you add media items with topics.
                            </Typography>
                        ) : (
                            <Grid container spacing={1}>
                                {topics.map((topic) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={topic.id || topic.Id}>
                                        <Card 
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: 2
                                                },
                                                transition: 'all 0.2s ease-in-out',
                                                position: 'relative'
                                            }}
                                            onClick={() => handleTopicClick(topic)}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick('topic', topic);
                                                }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    zIndex: 1,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    '&:hover': {
                                                        backgroundColor: 'error.light',
                                                        color: 'white'
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                            <CardContent sx={{ p: 2 }}>
                                                <Chip
                                                    label={topic.name || topic.Name}
                                                    color="primary"
                                                    variant="filled"
                                                    sx={{ 
                                                        width: '100%',
                                                        backgroundColor: 'primary.main',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.9rem',
                                                        '& .MuiChip-label': {
                                                            display: 'block',
                                                            whiteSpace: 'normal',
                                                            textAlign: 'center',
                                                            color: 'white'
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: 'primary.dark'
                                                        }
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </AccordionDetails>
                </Accordion>

                {/* Genres Section */}
                <Accordion 
                    expanded={expanded === 'genres'} 
                    onChange={handleAccordionChange('genres')}
                    sx={{ mb: 2 }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                        aria-controls="genres-content"
                        id="genres-header"
                        sx={{
                            backgroundColor: '#4b6aa2',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#3d5a8a',
                            },
                            '& .MuiTypography-root': {
                                color: 'white',
                                fontWeight: 'bold'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <GenreIcon />
                            <Typography variant="h6">
                                Genres ({genres.length})
                            </Typography>
                            <Box sx={{ ml: 'auto' }}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenGenreDialog(true);
                                    }}
                                    sx={{ 
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {genres.length === 0 ? (
                            <Typography color="text.secondary">
                                No genres found. Genres will appear here after you add media items with genres.
                            </Typography>
                        ) : (
                            <Grid container spacing={1}>
                                {genres.map((genre) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={genre.id || genre.Id}>
                                        <Card 
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: 2
                                                },
                                                transition: 'all 0.2s ease-in-out',
                                                position: 'relative'
                                            }}
                                            onClick={() => handleGenreClick(genre)}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick('genre', genre);
                                                }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    zIndex: 1,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    '&:hover': {
                                                        backgroundColor: 'error.light',
                                                        color: 'white'
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                            <CardContent sx={{ p: 2 }}>
                                                <Chip
                                                    label={genre.name || genre.Name}
                                                    color="secondary"
                                                    variant="filled"
                                                    sx={{ 
                                                        width: '100%',
                                                        backgroundColor: '#4b6aa2',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.9rem',
                                                        '& .MuiChip-label': {
                                                            display: 'block',
                                                            whiteSpace: 'normal',
                                                            textAlign: 'center',
                                                            color: 'white'
                                                        },
                                                        '&:hover': {
                                                            backgroundColor: '#3d5a8a'
                                                        }
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </AccordionDetails>
                </Accordion>

                {/* Create Topic Dialog */}
                <Dialog 
                    open={openTopicDialog} 
                    onClose={() => !creating && setOpenTopicDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Create New Topic</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Topic Name"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            disabled={creating}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !creating) {
                                    handleCreateTopic();
                                }
                            }}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => setOpenTopicDialog(false)} 
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateTopic} 
                            variant="contained"
                            disabled={creating || !newTopicName.trim()}
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Create Genre Dialog */}
                <Dialog 
                    open={openGenreDialog} 
                    onClose={() => !creating && setOpenGenreDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Create New Genre</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Genre Name"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={newGenreName}
                            onChange={(e) => setNewGenreName(e.target.value)}
                            disabled={creating}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !creating) {
                                    handleCreateGenre();
                                }
                            }}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => setOpenGenreDialog(false)} 
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateGenre} 
                            variant="contained"
                            disabled={creating || !newGenreName.trim()}
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog 
                    open={openDeleteDialog} 
                    onClose={() => !deleting && handleCancelDelete()}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        Delete {deleteTarget?.type === 'topic' ? 'Topic' : 'Genre'}?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
                        </DialogContentText>
                        {deleteTarget && deleteTarget.mediaItemCount > 0 && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                This {deleteTarget.type} is currently attached to {deleteTarget.mediaItemCount} media item{deleteTarget.mediaItemCount !== 1 ? 's' : ''}. 
                                You may not be able to delete it. Consider removing it from all media items first.
                            </Alert>
                        )}
                        {deleteTarget && deleteTarget.mediaItemCount === 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                This {deleteTarget.type} is not attached to any media items and can be safely deleted.
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={handleCancelDelete} 
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmDelete} 
                            variant="contained"
                            color="error"
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
}

export default SearchByTopicOrGenre;
