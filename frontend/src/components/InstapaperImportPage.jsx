import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Paper, Alert,
    CircularProgress, Select, MenuItem, FormControl,
    InputLabel, TextField, Card, CardContent, Chip,
    Grid, LinearProgress, Divider, IconButton, Tooltip
} from '@mui/material';
import {
    ArrowBack, CloudDownload, Sync, CheckCircle,
    Article as ArticleIcon, BookmarkAdd, Star,
    Archive, Inbox
} from '@mui/icons-material';
import { importFromInstapaper, syncWithInstapaper } from '../api';

function InstapaperImportPage() {
    const navigate = useNavigate();
    const [accessToken, setAccessToken] = useState('');
    const [accessTokenSecret, setAccessTokenSecret] = useState('');
    const [username, setUsername] = useState('');
    const [folderId, setFolderId] = useState('unread');
    const [limit, setLimit] = useState(50);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [importedArticles, setImportedArticles] = useState([]);
    const [importProgress, setImportProgress] = useState(0);

    useEffect(() => {
        // Check if user has authenticated
        const token = sessionStorage.getItem('instapaperAccessToken');
        const secret = sessionStorage.getItem('instapaperAccessTokenSecret');
        const user = sessionStorage.getItem('instapaperUsername');

        if (!token || !secret) {
            navigate('/instapaper/auth');
        } else {
            setAccessToken(token);
            setAccessTokenSecret(secret);
            setUsername(user || '');
        }
    }, [navigate]);

    const handleImport = async () => {
        if (!accessToken || !accessTokenSecret) {
            setError('Not authenticated. Please authenticate first.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setImportProgress(0);
        setImportedArticles([]);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setImportProgress(prev => Math.min(prev + 10, 90));
            }, 300);

            const response = await importFromInstapaper(accessToken, accessTokenSecret, limit, folderId);

            clearInterval(progressInterval);
            setImportProgress(100);

            if (response.success) {
                setSuccess(response.message || `Successfully imported ${response.importedCount} articles`);
                setImportedArticles(response.articles || []);
            } else {
                setError(response.message || 'Import failed');
            }
        } catch (err) {
            console.error('Import error details:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                message: err.message
            });
            
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.Message ||
                                err.response?.data?.title ||
                                (typeof err.response?.data === 'string' ? err.response?.data : null) ||
                                err.message || 
                                'Failed to import articles from Instapaper';
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!accessToken || !accessTokenSecret) {
            setError('Not authenticated. Please authenticate first.');
            return;
        }

        setSyncing(true);
        setError('');
        setSuccess('');

        try {
            const response = await syncWithInstapaper(accessToken, accessTokenSecret);

            if (response.success) {
                setSuccess(response.message || `Successfully synced ${response.updatedCount} articles`);
            } else {
                setError(response.message || 'Sync failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to sync with Instapaper');
        } finally {
            setSyncing(false);
        }
    };

    const handleViewArticles = () => {
        navigate('/articles');
    };

    const folderOptions = [
        { value: 'unread', label: 'Unread', icon: <Inbox /> },
        { value: 'starred', label: 'Starred', icon: <Star /> },
        { value: 'archive', label: 'Archive', icon: <Archive /> }
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                px: 2
            }}
        >
            <Container maxWidth="md">
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/')}
                    sx={{
                        mb: 3
                    }}
                >
                    Back to Home
                </Button>

                <Paper
                    elevation={8}
                    sx={{
                        p: 4,
                        borderRadius: '16px',
                        backgroundColor: 'background.paper',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <ArticleIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom fontWeight="bold">
                            Import from Instapaper
                        </Typography>
                        {username && (
                            <Chip
                                label={`Connected as: ${username}`}
                                color="success"
                                icon={<CheckCircle />}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Box>

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

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Folder</InputLabel>
                                <Select
                                    value={folderId}
                                    onChange={(e) => setFolderId(e.target.value)}
                                    label="Folder"
                                    disabled={loading || syncing}
                                >
                                    {folderOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {option.icon}
                                                {option.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Number of Articles"
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
                                inputProps={{ min: 1, max: 500 }}
                                disabled={loading || syncing}
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} /> : <CloudDownload />}
                            onClick={handleImport}
                            disabled={loading || syncing}
                            sx={{
                                flex: 1,
                                minWidth: '200px',
                                py: 1.5,
                                fontSize: '1rem'
                            }}
                        >
                            {loading ? 'Importing...' : 'Import Articles'}
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
                            onClick={handleSync}
                            disabled={loading || syncing}
                            sx={{
                                flex: 1,
                                minWidth: '200px',
                                py: 1.5,
                                fontSize: '1rem'
                            }}
                        >
                            {syncing ? 'Syncing...' : 'Sync Existing'}
                        </Button>
                    </Box>

                    {loading && (
                        <Box sx={{ mt: 3 }}>
                            <LinearProgress variant="determinate" value={importProgress} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                                Importing articles... {importProgress}%
                            </Typography>
                        </Box>
                    )}

                    {importedArticles.length > 0 && (
                        <>
                            <Divider sx={{ my: 4 }} />
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Imported Articles ({importedArticles.length})
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<ArticleIcon />}
                                    onClick={handleViewArticles}
                                    sx={{ mb: 2 }}
                                >
                                    View All Articles
                                </Button>
                            </Box>

                            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {importedArticles.map((article, index) => (
                                    <Card
                                        key={article.id || index}
                                        sx={{
                                            mb: 2,
                                            '&:hover': {
                                                boxShadow: 4,
                                                cursor: 'pointer'
                                            }
                                        }}
                                        onClick={() => navigate(`/media/${article.id}`)}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                                <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                                                    {article.title}
                                                </Typography>
                                                {article.isStarred && (
                                                    <Star sx={{ color: 'warning.main', ml: 1 }} />
                                                )}
                                            </Box>
                                            
                                            {article.author && (
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    By {article.author}
                                                </Typography>
                                            )}
                                            
                                            {article.publication && (
                                                <Chip
                                                    label={article.publication}
                                                    size="small"
                                                    sx={{ mr: 1, mb: 1 }}
                                                />
                                            )}
                                            
                                            {article.estimatedReadingTimeMinutes > 0 && (
                                                <Chip
                                                    label={`${article.estimatedReadingTimeMinutes} min read`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mb: 1 }}
                                                />
                                            )}
                                            
                                            {article.readingProgress > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Reading Progress: {Math.round(article.readingProgress * 100)}%
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={article.readingProgress * 100}
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </>
                    )}

                    <Divider sx={{ my: 4 }} />

                    <Card sx={{ bgcolor: 'info.light' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <BookmarkAdd sx={{ verticalAlign: 'middle', mr: 1 }} />
                                About Instapaper Import
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Import articles from your Instapaper folders. The system will:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                <li>
                                    <Typography variant="body2">
                                        Skip duplicate articles (won't import the same article twice)
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Extract metadata (author, publication, reading time)
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Preserve reading progress from Instapaper
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Sync status will update existing articles with latest progress
                                    </Typography>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </Paper>
            </Container>
        </Box>
    );
}

export default InstapaperImportPage;

