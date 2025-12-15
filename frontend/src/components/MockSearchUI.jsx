import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, InputAdornment, Grid, Card, CardContent,
    Chip, Button, ButtonGroup, Divider, Accordion, AccordionSummary, AccordionDetails,
    FormGroup, FormControlLabel, Checkbox, Select, MenuItem, FormControl, InputLabel,
    Paper, IconButton, ToggleButton, ToggleButtonGroup, Slider, Stack, Badge
} from '@mui/material';
import {
    Search, ViewModule, ViewList, FilterList, Clear, TuneRounded,
    ExpandMore, Star, StarBorder, OpenInNew, AccessTime, Update,
    ThumbUp, ThumbDown, Remove, Favorite
} from '@mui/icons-material';

// MOCK DATA
const mockSearchResults = [
    {
        id: 1,
        title: "The Psychology of Money",
        mediaType: "Book",
        status: "Actively Exploring",
        ratingType: "like", // superlike, like, neutral, dislike
        topics: ["finance", "psychology", "behavioral economics"],
        genres: ["non-fiction", "self-help"],
        author: "Morgan Housel",
        duration: "~6 hours read",
        dateAdded: "2024-01-15",
        notes: "Excellent insights on how people think about money and wealth. Very practical advice."
    },
    {
        id: 2,
        title: "Huberman Lab Podcast",
        mediaType: "Podcast",
        status: "Want to Explore",
        ratingType: "superlike",
        topics: ["neuroscience", "health", "productivity"],
        genres: ["science", "education"],
        author: "Andrew Huberman",
        duration: "90 min episodes",
        dateAdded: "2024-02-20",
        notes: "Deep dive into neuroscience and practical protocols for improving daily life."
    },
    {
        id: 3,
        title: "Atomic Habits",
        mediaType: "Book",
        status: "Explored",
        ratingType: "superlike",
        topics: ["habits", "productivity", "self-improvement"],
        genres: ["non-fiction", "self-help"],
        author: "James Clear",
        duration: "~5 hours read",
        dateAdded: "2023-11-10",
        notes: "Comprehensive guide to building good habits and breaking bad ones."
    },
    {
        id: 4,
        title: "The Social Dilemma",
        mediaType: "Movie",
        status: "Explored",
        ratingType: "like",
        topics: ["technology", "social media", "ethics"],
        genres: ["documentary", "technology"],
        author: "Jeff Orlowski",
        duration: "94 min",
        dateAdded: "2023-12-05",
        notes: "Eye-opening documentary about the dark side of social media."
    },
    {
        id: 5,
        title: "Build with ChatGPT APIs",
        mediaType: "Course",
        status: "Want to Explore",
        ratingType: null,
        topics: ["ai", "programming", "apis"],
        genres: ["technology", "education"],
        author: "DeepLearning.AI",
        duration: "3 hours",
        dateAdded: "2024-03-01",
        notes: "Learn to build applications with OpenAI's ChatGPT API."
    },
    {
        id: 6,
        title: "Interstellar",
        mediaType: "Movie",
        status: "Want to Explore",
        ratingType: "superlike",
        topics: ["space", "science fiction", "physics"],
        genres: ["sci-fi", "drama"],
        author: "Christopher Nolan",
        duration: "169 min",
        dateAdded: "2024-02-14",
        notes: "Epic science fiction film exploring time, space, and human survival."
    },
    {
        id: 7,
        title: "How to Take Smart Notes",
        mediaType: "Book",
        status: "Actively Exploring",
        ratingType: "like",
        topics: ["note-taking", "zettelkasten", "productivity"],
        genres: ["non-fiction", "education"],
        author: "Sönke Ahrens",
        duration: "~4 hours read",
        dateAdded: "2024-01-22",
        notes: "Introduction to the Zettelkasten method and effective note-taking."
    },
    {
        id: 8,
        title: "Lex Fridman Podcast",
        mediaType: "Podcast",
        status: "Actively Exploring",
        ratingType: "like",
        topics: ["ai", "philosophy", "science"],
        genres: ["technology", "interviews"],
        author: "Lex Fridman",
        duration: "2-3 hour episodes",
        dateAdded: "2023-10-30",
        notes: "Long-form conversations with leading thinkers in AI, science, and technology."
    },
    {
        id: 9,
        title: "The Witcher 3: Wild Hunt",
        mediaType: "VideoGame",
        status: "Explored",
        ratingType: "superlike",
        topics: ["fantasy", "rpg", "storytelling"],
        genres: ["action", "adventure", "rpg"],
        author: "CD Projekt Red",
        duration: "50-100 hours",
        dateAdded: "2023-09-15",
        notes: "Masterpiece of storytelling and world-building in gaming."
    },
    {
        id: 10,
        title: "3Blue1Brown YouTube Channel",
        mediaType: "Video",
        status: "Actively Exploring",
        ratingType: "superlike",
        topics: ["mathematics", "education", "visualization"],
        genres: ["education", "science"],
        author: "Grant Sanderson",
        duration: "10-20 min videos",
        dateAdded: "2024-01-05",
        notes: "Beautiful mathematical visualizations and explanations."
    },
    {
        id: 11,
        title: "Breaking Bad",
        mediaType: "TVShow",
        status: "Explored",
        ratingType: "superlike",
        topics: ["drama", "crime", "morality"],
        genres: ["drama", "thriller"],
        author: "Vince Gilligan",
        duration: "5 seasons",
        dateAdded: "2023-08-20",
        notes: "One of the greatest TV shows ever made. Perfect character development."
    },
    {
        id: 12,
        title: "Wait But Why",
        mediaType: "Website",
        status: "Actively Exploring",
        ratingType: "like",
        topics: ["science", "philosophy", "futurism"],
        genres: ["blog", "education"],
        author: "Tim Urban",
        duration: "Various",
        dateAdded: "2023-12-10",
        notes: "Long-form blog posts on fascinating topics with stick figure illustrations."
    }
];

const mediaTypeOptions = [
    { value: 'all', label: 'All Media Types', count: 12 },
    { value: 'Book', label: 'Books', count: 3 },
    { value: 'Podcast', label: 'Podcasts', count: 2 },
    { value: 'Movie', label: 'Movies', count: 2 },
    { value: 'Course', label: 'Courses', count: 1 },
    { value: 'TVShow', label: 'TV Shows', count: 1 },
    { value: 'Video', label: 'Videos', count: 1 },
    { value: 'VideoGame', label: 'Video Games', count: 1 },
    { value: 'Website', label: 'Websites', count: 1 }
];

const topicOptions = [
    'ai', 'psychology', 'productivity', 'finance', 'neuroscience', 
    'philosophy', 'science', 'mathematics', 'technology', 'habits',
    'note-taking', 'programming', 'space', 'fantasy'
];

const genreOptions = [
    'non-fiction', 'self-help', 'science', 'education', 'technology',
    'documentary', 'sci-fi', 'drama', 'interviews', 'action', 'adventure'
];

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Want to Explore', label: 'Want to Explore' },
    { value: 'Actively Exploring', label: 'Actively Exploring' },
    { value: 'Explored', label: 'Explored' },
    { value: 'Reference', label: 'Reference' }
];

const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'dateAdded', label: 'Recently Added' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'title', label: 'Title (A-Z)' }
];

// HELPER FUNCTIONS
const getRatingIcon = (ratingType) => {
    switch (ratingType) {
        case 'superlike':
            return <Favorite sx={{ fontSize: 18, color: '#e91e63' }} />;
        case 'like':
            return <ThumbUp sx={{ fontSize: 18, color: '#4caf50' }} />;
        case 'neutral':
            return <Remove sx={{ fontSize: 18, color: '#9e9e9e' }} />;
        case 'dislike':
            return <ThumbDown sx={{ fontSize: 18, color: '#f44336' }} />;
        default:
            return null;
    }
};

// COMPONENTS
const MediaCard = ({ item }) => (
    <Card 
        sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 8,
                '& .card-title': {
                    color: 'primary.main'
                }
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
    >
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography 
                    variant="h6" 
                    className="card-title"
                    sx={{ 
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        transition: 'color 0.2s'
                    }}
                >
                    {item.title}
                </Typography>
                {item.ratingType && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                        {getRatingIcon(item.ratingType)}
                    </Box>
                )}
            </Box>

            <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip 
                    label={item.mediaType} 
                    size="small" 
                    sx={{ 
                        backgroundColor: 'rgba(105, 90, 140, 0.2)',
                        color: '#b39ddb',
                        fontWeight: 'bold'
                    }}
                />
                <Chip 
                    label={item.status} 
                    size="small" 
                    color={
                        item.status === 'Actively Exploring' ? 'success' :
                        item.status === 'Want to Explore' ? 'info' :
                        'default'
                    }
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {item.author} • {item.duration}
            </Typography>

            {item.notes && (
                <Typography 
                    variant="body2" 
                    sx={{ 
                        mb: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: 'text.secondary'
                    }}
                >
                    {item.notes}
                </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {item.topics.slice(0, 3).map((topic, index) => (
                    <Chip
                        key={`topic-${index}`}
                        label={topic}
                        size="small"
                        sx={{ 
                            fontSize: '0.75rem', 
                            height: '24px',
                            backgroundColor: 'rgba(54, 39, 89, 0.3)',
                            color: '#ce93d8'
                        }}
                    />
                ))}
                {item.topics.length > 3 && (
                    <Chip
                        label={`+${item.topics.length - 3}`}
                        size="small"
                        sx={{ fontSize: '0.75rem', height: '24px' }}
                    />
                )}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                <AccessTime sx={{ fontSize: 12 }} />
                Added {new Date(item.dateAdded).toLocaleDateString()}
            </Typography>
        </CardContent>
    </Card>
);

const MediaListItem = ({ item }) => (
    <Paper 
        sx={{ 
            p: 2.5,
            mb: 2,
            cursor: 'pointer',
            '&:hover': {
                boxShadow: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
            },
            transition: 'all 0.2s'
        }}
    >
        <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {item.title}
                    </Typography>
                    {item.ratingType && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getRatingIcon(item.ratingType)}
                        </Box>
                    )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {item.author} • {item.duration}
                </Typography>
                {item.notes && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            color: 'text.secondary'
                        }}
                    >
                        {item.notes}
                    </Typography>
                )}
            </Grid>
            <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {item.topics.slice(0, 4).map((topic, index) => (
                        <Chip
                            key={`topic-${index}`}
                            label={topic}
                            size="small"
                            sx={{ 
                                fontSize: '0.75rem', 
                                height: '24px',
                                backgroundColor: 'rgba(54, 39, 89, 0.3)',
                                color: '#ce93d8'
                            }}
                        />
                    ))}
                    {item.topics.length > 4 && (
                        <Chip
                            label={`+${item.topics.length - 4}`}
                            size="small"
                            sx={{ fontSize: '0.75rem', height: '24px' }}
                        />
                    )}
                </Box>
            </Grid>
            <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Chip 
                        label={item.mediaType} 
                        size="small" 
                        sx={{ 
                            backgroundColor: 'rgba(105, 90, 140, 0.2)',
                            color: '#b39ddb',
                            fontWeight: 'bold'
                        }}
                    />
                    <Chip 
                        label={item.status} 
                        size="small" 
                        color={
                            item.status === 'Actively Exploring' ? 'success' :
                            item.status === 'Want to Explore' ? 'info' :
                            'default'
                        }
                        variant="outlined"
                    />
                </Box>
            </Grid>
        </Grid>
    </Paper>
);

// MAIN COMPONENT
export default function MockSearchUI() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('card');
    const [sortBy, setSortBy] = useState('relevance');
    const [selectedMediaTypes, setSelectedMediaTypes] = useState(['all']);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [ratingRange, setRatingRange] = useState([0, 5]);
    const [showFilters, setShowFilters] = useState(true);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    const [topicSearchQuery, setTopicSearchQuery] = useState('');
    const [genreSearchQuery, setGenreSearchQuery] = useState('');
    const [showAllTopics, setShowAllTopics] = useState(false);
    const [showAllGenres, setShowAllGenres] = useState(false);

    // Mock filtering logic (just for demonstration)
    const filteredResults = mockSearchResults;

    const handleMediaTypeToggle = (value) => {
        if (value === 'all') {
            setSelectedMediaTypes(['all']);
        } else {
            const newSelection = selectedMediaTypes.includes('all') 
                ? [value]
                : selectedMediaTypes.includes(value)
                    ? selectedMediaTypes.filter(t => t !== value)
                    : [...selectedMediaTypes.filter(t => t !== 'all'), value];
            
            setSelectedMediaTypes(newSelection.length === 0 ? ['all'] : newSelection);
        }
    };

    const handleTopicToggle = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const handleGenreToggle = (genre) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const handleClearFilters = () => {
        setSelectedMediaTypes(['all']);
        setSelectedTopics([]);
        setSelectedGenres([]);
        setSelectedStatus('all');
        setRatingRange([0, 5]);
        setSearchQuery('');
        setTopicSearchQuery('');
        setGenreSearchQuery('');
        setShowAllTopics(false);
        setShowAllGenres(false);
    };

    return (
        <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 'bold',
                            mb: 1,
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                        }}
                    >
                        Search MediaVerse
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Search across all your media with powerful filters and instant results
                    </Typography>
                </Box>

                {/* Search Bar */}
                <Paper 
                    elevation={3}
                    sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        mb: 4,
                        backgroundColor: 'background.paper',
                        borderRadius: 3
                    }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by title, author, topic, or any keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ fontSize: 28, color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setSearchQuery('')} size="small">
                                        <Clear />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { 
                                fontSize: '1.1rem',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)'
                                }
                            }
                        }}
                    />
                    
                    {/* Quick Filters */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                            Quick filters:
                        </Typography>
                        {['ai', 'productivity', 'science', 'philosophy'].map((topic) => (
                            <Chip
                                key={topic}
                                label={topic}
                                onClick={() => handleTopicToggle(topic)}
                                color={selectedTopics.includes(topic) ? 'primary' : 'default'}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Box>
                </Paper>

                <Grid container spacing={3}>
                    {/* Filters Sidebar */}
                    {showFilters && (
                        <Grid item xs={12} md={3}>
                            <Paper 
                                elevation={2}
                                sx={{ 
                                    p: 2.5, 
                                    position: 'sticky',
                                    top: 16,
                                    backgroundColor: 'background.paper',
                                    borderRadius: 2
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TuneRounded /> Filters
                                    </Typography>
                                    <Button 
                                        size="small" 
                                        onClick={handleClearFilters}
                                        startIcon={<Clear />}
                                    >
                                        Clear All
                                    </Button>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                {/* Media Type Filter */}
                                <Accordion defaultExpanded disableGutters elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Media Type
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <FormGroup>
                                            {mediaTypeOptions.map((option) => (
                                                <FormControlLabel
                                                    key={option.value}
                                                    control={
                                                        <Checkbox
                                                            checked={selectedMediaTypes.includes(option.value)}
                                                            onChange={() => handleMediaTypeToggle(option.value)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                            <Typography variant="body2">{option.label}</Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {option.count}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{ 
                                                        mb: 0.5,
                                                        '& .MuiFormControlLabel-label': { width: '100%' }
                                                    }}
                                                />
                                            ))}
                                        </FormGroup>
                                    </AccordionDetails>
                                </Accordion>

                                <Divider sx={{ my: 1 }} />

                                {/* Topics Filter */}
                                <Accordion disableGutters elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Topics {selectedTopics.length > 0 && `(${selectedTopics.length})`}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search topics..."
                                            value={topicSearchQuery}
                                            onChange={(e) => setTopicSearchQuery(e.target.value)}
                                            sx={{ mb: 1.5 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search sx={{ fontSize: 18 }} />
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                        <FormGroup>
                                            {topicOptions
                                                .filter(topic => topic.toLowerCase().includes(topicSearchQuery.toLowerCase()))
                                                .slice(0, showAllTopics ? undefined : 10)
                                                .map((topic) => (
                                                    <FormControlLabel
                                                        key={topic}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedTopics.includes(topic)}
                                                                onChange={() => handleTopicToggle(topic)}
                                                                size="small"
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{topic}</Typography>}
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                        </FormGroup>
                                        {topicOptions.filter(topic => topic.toLowerCase().includes(topicSearchQuery.toLowerCase())).length > 10 && !showAllTopics && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllTopics(true)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show More
                                            </Button>
                                        )}
                                        {showAllTopics && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllTopics(false)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show Less
                                            </Button>
                                        )}
                                        <Divider sx={{ my: 1.5 }} />
                                        <Button
                                            size="small"
                                            fullWidth
                                            variant="text"
                                            onClick={() => navigate('/search-by-topic-genre')}
                                            sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                                        >
                                            Browse all topics →
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>

                                <Divider sx={{ my: 1 }} />

                                {/* Genres Filter */}
                                <Accordion disableGutters elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Search genres..."
                                            value={genreSearchQuery}
                                            onChange={(e) => setGenreSearchQuery(e.target.value)}
                                            sx={{ mb: 1.5 }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search sx={{ fontSize: 18 }} />
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                        <FormGroup>
                                            {genreOptions
                                                .filter(genre => genre.toLowerCase().includes(genreSearchQuery.toLowerCase()))
                                                .slice(0, showAllGenres ? undefined : 10)
                                                .map((genre) => (
                                                    <FormControlLabel
                                                        key={genre}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedGenres.includes(genre)}
                                                                onChange={() => handleGenreToggle(genre)}
                                                                size="small"
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{genre}</Typography>}
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                ))}
                                        </FormGroup>
                                        {genreOptions.filter(genre => genre.toLowerCase().includes(genreSearchQuery.toLowerCase())).length > 10 && !showAllGenres && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllGenres(true)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show More
                                            </Button>
                                        )}
                                        {showAllGenres && (
                                            <Button
                                                size="small"
                                                onClick={() => setShowAllGenres(false)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                            >
                                                Show Less
                                            </Button>
                                        )}
                                        <Divider sx={{ my: 1.5 }} />
                                        <Button
                                            size="small"
                                            fullWidth
                                            variant="text"
                                            onClick={() => navigate('/search-by-topic-genre')}
                                            sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                                        >
                                            Browse all genres →
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>

                                <Divider sx={{ my: 1 }} />

                                {/* Status Filter */}
                                <Accordion disableGutters elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Status
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                {statusOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </AccordionDetails>
                                </Accordion>

                                <Divider sx={{ my: 1 }} />

                                {/* Rating Filter */}
                                <Accordion disableGutters elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            Rating
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0 }}>
                                        <Box sx={{ px: 1 }}>
                                            <Slider
                                                value={ratingRange}
                                                onChange={(e, newValue) => setRatingRange(newValue)}
                                                valueLabelDisplay="auto"
                                                min={0}
                                                max={5}
                                                step={0.5}
                                                marks={[
                                                    { value: 0, label: '0' },
                                                    { value: 5, label: '5' }
                                                ]}
                                            />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                                {ratingRange[0]} - {ratingRange[1]} stars
                                            </Typography>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            </Paper>
                        </Grid>
                    )}

                    {/* Results Section */}
                    <Grid item xs={12} md={showFilters ? 9 : 12}>
                        {/* Results Header */}
                        <Box sx={{ 
                            mb: 3, 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between', 
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 2
                        }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {filteredResults.length} Results
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {searchQuery && `Showing results for "${searchQuery}"`}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Sort */}
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <InputLabel>Sort by</InputLabel>
                                    <Select
                                        value={sortBy}
                                        label="Sort by"
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        {sortOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* View Mode Toggle */}
                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(e, newMode) => newMode && setViewMode(newMode)}
                                    size="small"
                                >
                                    <ToggleButton value="card">
                                        <ViewModule />
                                    </ToggleButton>
                                    <ToggleButton value="list">
                                        <ViewList />
                                    </ToggleButton>
                                </ToggleButtonGroup>

                                {/* Toggle Filters Button (mobile) */}
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowFilters(!showFilters)}
                                    startIcon={<FilterList />}
                                    sx={{ display: { xs: 'flex', md: 'none' } }}
                                >
                                    {showFilters ? 'Hide' : 'Show'} Filters
                                </Button>
                            </Box>
                        </Box>

                        {/* Active Filters Display */}
                        {(selectedTopics.length > 0 || selectedGenres.length > 0 || !selectedMediaTypes.includes('all')) && (
                            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Active filters:
                                </Typography>
                                {selectedTopics.map((topic) => (
                                    <Chip
                                        key={`filter-topic-${topic}`}
                                        label={topic}
                                        size="small"
                                        onDelete={() => handleTopicToggle(topic)}
                                        color="primary"
                                    />
                                ))}
                                {selectedGenres.map((genre) => (
                                    <Chip
                                        key={`filter-genre-${genre}`}
                                        label={genre}
                                        size="small"
                                        onDelete={() => handleGenreToggle(genre)}
                                        color="secondary"
                                    />
                                ))}
                                {!selectedMediaTypes.includes('all') && selectedMediaTypes.map((type) => (
                                    <Chip
                                        key={`filter-type-${type}`}
                                        label={mediaTypeOptions.find(o => o.value === type)?.label || type}
                                        size="small"
                                        onDelete={() => handleMediaTypeToggle(type)}
                                    />
                                ))}
                            </Box>
                        )}

                        {/* Results Display */}
                        {viewMode === 'card' ? (
                            <Grid container spacing={3}>
                                {filteredResults.map((item) => (
                                    <Grid item xs={12} sm={6} lg={4} key={item.id}>
                                        <MediaCard item={item} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box>
                                {filteredResults.map((item) => (
                                    <MediaListItem key={item.id} item={item} />
                                ))}
                            </Box>
                        )}

                        {/* Pagination */}
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                            <ButtonGroup variant="outlined">
                                <Button disabled>Previous</Button>
                                <Button variant="contained">1</Button>
                                <Button>2</Button>
                                <Button>3</Button>
                                <Button>Next</Button>
                            </ButtonGroup>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

