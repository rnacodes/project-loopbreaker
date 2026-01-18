import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    Snackbar,
    Box,
    Switch,
    FormControlLabel,
    CircularProgress,
    Chip,
    Divider
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    getFeatureFlag,
    enableFeatureFlag,
    disableFeatureFlag
} from '../api';

const DEMO_WRITE_FLAG = 'demo_write_enabled';

const DemoAdminPage = () => {
    const [isWriteEnabled, setIsWriteEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [error, setError] = useState(null);

    const fetchFlagStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const flag = await getFeatureFlag(DEMO_WRITE_FLAG);
            setIsWriteEnabled(flag.isEnabled);
            setLastUpdated(flag.updatedAt || flag.createdAt);
        } catch (err) {
            // Flag might not exist yet - that's okay, it means it's disabled
            if (err.response?.status === 404) {
                setIsWriteEnabled(false);
                setLastUpdated(null);
            } else {
                setError('Failed to fetch feature flag status. The server may be unavailable.');
                console.error('Error fetching feature flag:', err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFlagStatus();
    }, [fetchFlagStatus]);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleToggle = async () => {
        setToggling(true);
        setError(null);
        try {
            if (isWriteEnabled) {
                await disableFeatureFlag(DEMO_WRITE_FLAG, 'Demo write mode disabled via admin UI');
                setIsWriteEnabled(false);
                setSnackbar({
                    open: true,
                    message: 'Write operations are now BLOCKED for all demo users.',
                    severity: 'info'
                });
            } else {
                await enableFeatureFlag(DEMO_WRITE_FLAG, 'Demo write mode enabled via admin UI');
                setIsWriteEnabled(true);
                setSnackbar({
                    open: true,
                    message: 'Write operations are now ALLOWED for all demo users.',
                    severity: 'success'
                });
            }
            setLastUpdated(new Date().toISOString());
        } catch (err) {
            setError('Failed to toggle feature flag. Please try again.');
            setSnackbar({
                open: true,
                message: err.response?.data?.error || 'Failed to update feature flag',
                severity: 'error'
            });
        } finally {
            setToggling(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AdminPanelSettingsIcon sx={{ fontSize: 40, mr: 2, color: '#9c27b0' }} />
                <Typography variant="h4" component="h1">
                    Demo Admin
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isWriteEnabled ? (
                                <LockOpenIcon sx={{ mr: 1, color: 'success.main' }} />
                            ) : (
                                <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            )}
                            <Typography variant="h6">
                                Demo Write Mode
                            </Typography>
                        </Box>
                        {loading ? (
                            <CircularProgress size={24} />
                        ) : (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isWriteEnabled}
                                        onChange={handleToggle}
                                        disabled={toggling}
                                        color="success"
                                    />
                                }
                                label={toggling ? 'Updating...' : (isWriteEnabled ? 'Enabled' : 'Disabled')}
                                labelPlacement="start"
                            />
                        )}
                    </Box>

                    <Alert severity={isWriteEnabled ? 'success' : 'info'} sx={{ mb: 2 }}>
                        {isWriteEnabled
                            ? 'Write operations (create, update, delete) are currently ALLOWED for all demo users.'
                            : 'The demo site is in read-only mode. Enable write mode to allow all users to make changes.'}
                    </Alert>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                label={isWriteEnabled ? 'WRITE ENABLED' : 'READ ONLY'}
                                color={isWriteEnabled ? 'success' : 'default'}
                                size="small"
                            />
                            {lastUpdated && (
                                <Typography variant="caption" color="text.secondary">
                                    Last updated: {formatDate(lastUpdated)}
                                </Typography>
                            )}
                        </Box>
                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={fetchFlagStatus}
                            disabled={loading}
                            sx={{
                                color: '#9c27b0',
                                '&:hover': {
                                    backgroundColor: 'rgba(156, 39, 176, 0.1)'
                                }
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        How It Works
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Database-Backed Feature Flags:</strong> This toggle controls a feature flag stored in the database. Changes take effect immediately without requiring a server restart.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Global Effect:</strong> When enabled, ALL users can perform write operations on the demo site. When disabled, the demo site returns to read-only mode for everyone.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Instant Updates:</strong> The server checks the database on each request, so toggling this switch has immediate effect across all sessions.
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Remember:</strong> Disable write mode after making changes to restore the read-only demo experience for visitors.
                        </Typography>
                    </Alert>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DemoAdminPage;
