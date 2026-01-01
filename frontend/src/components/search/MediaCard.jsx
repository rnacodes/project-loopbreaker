import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { Star, AccessTime } from '@mui/icons-material';
import { formatMediaType, formatStatus, getRatingIcon } from '../../utils/formatters';

export const MediaCard = React.memo(({ item }) => {
    const navigate = useNavigate();
    
    // Determine navigation path based on item type
    const handleClick = () => {
        if (item.isMixlist) {
            navigate(`/mixlist/${item.id}`);
        } else if (item.mediaType === 'Podcast' && !item.seriesId) {
            // Navigate podcast series to their dedicated profile page
            // Podcast episodes have seriesId, series don't
            navigate(`/podcast-series/${item.id}`);
        } else if (item.mediaType === 'Channel') {
            // Navigate YouTube channels to their dedicated profile page
            navigate(`/youtube-channel/${item.id}`);
        } else {
            navigate(`/media/${item.id}`);
        }
    };
    
    // Helper function to get the primary creator/author/maker
    const getPrimaryCredit = () => {
        switch (item.mediaType) {
            case 'Book':
            case 'Article':
                return item.author;
            case 'Movie':
                return item.director ? `Dir: ${item.director}` : null;
            case 'TVShow':
                return item.creator ? `Created by ${item.creator}` : null;
            case 'Video':
                return item.channel || item.platform;
            case 'Podcast':
                return item.publisher;
            case 'Mixlist':
                return null; // Mixlists don't have a primary credit
            default:
                return item.creator || item.author || null;
        }
    };

    // Helper function to get meaningful metadata line
    const getMetadataLine = () => {
        const parts = [];
        
        switch (item.mediaType) {
            case 'Book':
                if (item.goodreadsRating) parts.push(`${item.goodreadsRating}★`);
                break;
            case 'Movie':
                if (item.releaseYear) parts.push(item.releaseYear);
                if (item.runtimeMinutes) parts.push(`${item.runtimeMinutes} min`);
                if (item.tmdbRating) parts.push(`${item.tmdbRating}★`);
                break;
            case 'TVShow':
                if (item.tmdbRating) parts.push(`${item.tmdbRating}★`);
                break;
            case 'Video':
                if (item.lengthInSeconds) {
                    const hours = Math.floor(item.lengthInSeconds / 3600);
                    const minutes = Math.floor((item.lengthInSeconds % 3600) / 60);
                    parts.push(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
                }
                if (item.platform) parts.push(item.platform);
                break;
            case 'Podcast':
                if (item.podcastType) parts.push(item.podcastType === 'Series' ? 'Series' : 'Episode');
                if (item.durationInSeconds) {
                    const minutes = Math.floor(item.durationInSeconds / 60);
                    parts.push(`${minutes} min`);
                }
                break;
            case 'Article':
                if (item.publication) parts.push(item.publication);
                if (item.estimatedReadingTimeMinutes) parts.push(`${item.estimatedReadingTimeMinutes} min read`);
                if (item.wordCount) parts.push(`${(item.wordCount / 1000).toFixed(1)}k words`);
                break;
            case 'Mixlist':
                return null; // Handled separately with item count
            default:
                break;
        }
        
        return parts.length > 0 ? parts.join(' • ') : null;
    };
    
    return (
        <Card 
            onClick={handleClick}
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
            {/* HEADER ROW: Title + Rating Icon */}
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
                {(item.ratingType || item.rating !== undefined) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                        {getRatingIcon(item.ratingType || item.rating)}
                    </Box>
                )}
            </Box>

            {/* CHIPS ROW: Media Type + Status + Optional Extras */}
            <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip 
                    label={formatMediaType(item.mediaType)} 
                    size="small" 
                    sx={{ 
                        backgroundColor: 'rgba(105, 90, 140, 0.2)',
                        color: '#b39ddb',
                        fontWeight: 'bold'
                    }}
                />
                {item.status && (
                    <Chip 
                        label={formatStatus(item.status)} 
                        size="small" 
                        color={
                            item.status === 'ActivelyExploring' ? 'success' :
                            item.status === 'Uncharted' ? 'info' :
                            item.status === 'Completed' ? 'default' :
                            'warning'
                        }
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                    />
                )}
                
                {/* Conditional extra chips */}
                {item.mediaType === 'Podcast' && item.podcastType && (
                    <Chip 
                        label={item.podcastType === 'Series' ? 'Series' : 'Episode'} 
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                    />
                )}
                {item.mediaType === 'Video' && item.videoType && (
                    <Chip 
                        label={item.videoType} 
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                    />
                )}
                {item.mediaType === 'Article' && item.isStarred && (
                    <Chip 
                        icon={<Star sx={{ fontSize: 14 }} />} 
                        label="Starred" 
                        size="small"
                        sx={{ fontSize: '0.7rem' }}
                    />
                )}
            </Box>

            {/* PRIMARY CREDIT (Author/Director/Creator/Channel) */}
            {getPrimaryCredit() && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    {getPrimaryCredit()}
                </Typography>
            )}

            {/* METADATA LINE (Year, duration, rating, etc) */}
            {getMetadataLine() && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.85rem' }}>
                    {getMetadataLine()}
                </Typography>
            )}

            {/* DESCRIPTION/NOTES - Truncated */}
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

            {/* TOPICS - First 3 with overflow indicator */}
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

            {/* FOOTER: Date Added */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.7rem' }}>
                <AccessTime sx={{ fontSize: 12 }} />
                Added {new Date(item.dateAdded).toLocaleDateString()}
            </Typography>
        </CardContent>
    </Card>
    );
});

