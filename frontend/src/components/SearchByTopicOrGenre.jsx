import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails,
    List, ListItem, ListItemText, ListItemButton, Chip, CircularProgress,
    Alert, Grid, Card, CardContent
} from '@mui/material';
import { ExpandMore, Topic as TopicIcon, Category as GenreIcon } from '@mui/icons-material';
import { getAllTopics, getAllGenres } from '../services/apiService';

function SearchByTopicOrGenre() {
    const [expanded, setExpanded] = useState(false);
    const [topics, setTopics] = useState([]);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
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
        // Navigate to media search page with topic filter
        navigate(`/search-results?type=topic&value=${encodeURIComponent(topic.name || topic.Name)}&id=${topic.id || topic.Id}`);
    };

    const handleGenreClick = (genre) => {
        // Navigate to media search page with genre filter
        navigate(`/search-results?type=genre&value=${encodeURIComponent(genre.name || genre.Name)}&id=${genre.id || genre.Id}`);
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
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                    Search by Topic or Genre
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TopicIcon />
                            <Typography variant="h6">
                                Topics ({topics.length})
                            </Typography>
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
                                                transition: 'all 0.2s ease-in-out'
                                            }}
                                            onClick={() => handleTopicClick(topic)}
                                        >
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GenreIcon />
                            <Typography variant="h6">
                                Genres ({genres.length})
                            </Typography>
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
                                                transition: 'all 0.2s ease-in-out'
                                            }}
                                            onClick={() => handleGenreClick(genre)}
                                        >
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
            </Box>
        </Container>
    );
}

export default SearchByTopicOrGenre;
