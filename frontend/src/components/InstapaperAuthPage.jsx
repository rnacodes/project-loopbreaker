//TODO: Change floating label text to white
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button, Paper,
    Alert, CircularProgress, Card, CardContent, InputAdornment,
    IconButton
} from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff, Article as ArticleIcon } from '@mui/icons-material';
import { authenticateInstapaper } from '../api';

function InstapaperAuthPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuthenticate = async (e) => {
        e.preventDefault();
        
        if (!username.trim()) {
            setError('Username (email) is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await authenticateInstapaper(username, password);
            
            if (response.success) {
                // Store tokens in sessionStorage for use in import page
                sessionStorage.setItem('instapaperAccessToken', response.accessToken);
                sessionStorage.setItem('instapaperAccessTokenSecret', response.accessTokenSecret);
                sessionStorage.setItem('instapaperUsername', username);
                
                // Navigate to import page
                navigate('/instapaper/import');
            } else {
                setError(response.message || 'Authentication failed');
            }
        } catch (err) {
            console.error('Full error object:', err);
            console.error('Response data:', err.response?.data);
            
            // Extract the most detailed error message available
            const errorMessage = 
                err.response?.data?.message || 
                err.response?.data?.Message ||
                err.response?.data?.title ||
                err.response?.data?.detail ||
                (typeof err.response?.data === 'string' ? err.response?.data : null) ||
                err.message || 
                'Failed to authenticate with Instapaper';
                
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                px: 2
            }}
        >
            <Container maxWidth="sm">
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/')}
                    sx={{
                        mb: 3,
                        color: 'white'
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
                        <ArticleIcon sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                        <Typography variant="h4" gutterBottom fontWeight="bold">
                            Connect to Instapaper
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to import your saved articles
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Card sx={{ mb: 3, bgcolor: 'info.light', borderLeft: 4, borderColor: 'info.main' }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                <strong>Note:</strong> Enter your Instapaper email and password. 
                                If your account doesn't have a password (signed up with a provider), 
                                leave the password field empty.
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                <strong>Setup Required:</strong> If you see a "Bad Request" or "Consumer Key" error, 
                                the backend needs Instapaper API credentials configured. 
                                See <code>temp-docs/instapaper-setup-guide.md</code> for setup instructions.
                            </Typography>
                        </CardContent>
                    </Card>

                    <Box component="form" onSubmit={handleAuthenticate}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                            disabled={loading}
                            placeholder="your.email@example.com"
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Password (Optional)"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            disabled={loading}
                            placeholder="Leave empty if you don't have a password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                            disabled={loading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            {loading ? (
                                <>
                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                    Authenticating...
                                </>
                            ) : (
                                'Connect to Instapaper'
                            )}
                        </Button>
                    </Box>
                </Paper>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Don't have an Instapaper account?{' '}
                        <a
                            href="https://www.instapaper.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}
                        >
                            Sign up here
                        </a>
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}

export default InstapaperAuthPage;

