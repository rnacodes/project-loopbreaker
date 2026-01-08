import React, { useState } from 'react';
import {
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    Alert,
    Snackbar,
    Box,
    Switch,
    FormControlLabel,
    Divider
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import { useDemoAdmin } from '../contexts/DemoAdminContext';

const DemoAdminPage = () => {
    const { isAdminMode, enableAdminMode, disableAdminMode } = useDemoAdmin();
    const [keyInput, setKeyInput] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [showKeyInput, setShowKeyInput] = useState(false);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleToggle = () => {
        if (isAdminMode) {
            disableAdminMode();
            setSnackbar({
                open: true,
                message: 'Admin mode disabled. Write operations are now blocked.',
                severity: 'info'
            });
        } else {
            setShowKeyInput(true);
        }
    };

    const handleEnableAdminMode = () => {
        const result = enableAdminMode(keyInput);
        if (result.success) {
            setSnackbar({
                open: true,
                message: 'Admin mode enabled. All write operations are now allowed.',
                severity: 'success'
            });
            setKeyInput('');
            setShowKeyInput(false);
        } else {
            setSnackbar({
                open: true,
                message: result.error,
                severity: 'error'
            });
        }
    };

    const handleCancelKeyInput = () => {
        setShowKeyInput(false);
        setKeyInput('');
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AdminPanelSettingsIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                    Demo Admin
                </Typography>
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isAdminMode ? (
                                <LockOpenIcon sx={{ mr: 1, color: 'success.main' }} />
                            ) : (
                                <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            )}
                            <Typography variant="h6">
                                Admin Mode
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isAdminMode}
                                    onChange={handleToggle}
                                    color="success"
                                />
                            }
                            label={isAdminMode ? 'Enabled' : 'Disabled'}
                            labelPlacement="start"
                        />
                    </Box>

                    <Alert severity={isAdminMode ? 'success' : 'info'} sx={{ mb: 2 }}>
                        {isAdminMode
                            ? 'Write operations (create, update, delete) are currently ALLOWED.'
                            : 'The demo site is in read-only mode. Enable admin mode to allow write operations.'}
                    </Alert>

                    {showKeyInput && !isAdminMode && (
                        <Box sx={{ mt: 2 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Enter the admin key to enable write operations:
                            </Typography>
                            <TextField
                                fullWidth
                                type="password"
                                label="Admin Key"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleEnableAdminMode()}
                                sx={{ mb: 2 }}
                                autoFocus
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleEnableAdminMode}
                                    disabled={!keyInput.trim()}
                                >
                                    Enable Admin Mode
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleCancelKeyInput}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        How It Works
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        When admin mode is enabled, all API requests will include your admin key in the headers. This bypasses the demo site's read-only restrictions.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        The key is stored in your browser's session storage and will be cleared when you close the browser tab.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Remember to disable admin mode when you're done making changes to restore the read-only demo experience for other users.
                    </Typography>
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
