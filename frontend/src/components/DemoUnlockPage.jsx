import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Grid,
    Chip,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    LockOpen as LockOpenIcon,
    Lock as LockIcon,
    Timer as TimerIcon,
    Key as KeyIcon,
    ExpandMore as ExpandMoreIcon,
    PhoneAndroid as PhoneIcon,
    QrCode as QrCodeIcon,
    Numbers as NumbersIcon,
} from '@mui/icons-material';
import {
    getDemoStatus,
    unlockDemoWriteAccess,
    lockDemoWriteAccess
} from '../api';

const DemoUnlockPage = () => {
    // State for status
    const [status, setStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState(null);

    // State for unlock form
    const [totpCode, setTotpCode] = useState('');
    const [unlocking, setUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState(null);
    const [unlockSuccess, setUnlockSuccess] = useState(null);

    // State for lock action
    const [locking, setLocking] = useState(false);
    const [lockError, setLockError] = useState(null);

    // Fetch status on mount
    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        setStatusLoading(true);
        setStatusError(null);

        try {
            const result = await getDemoStatus();
            setStatus(result);
        } catch (error) {
            setStatusError(error.response?.data?.message || error.message || 'Failed to fetch demo status');
            setStatus(null);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleUnlock = async () => {
        if (totpCode.length !== 6) {
            setUnlockError('Please enter a 6-digit code');
            return;
        }

        setUnlocking(true);
        setUnlockError(null);
        setUnlockSuccess(null);

        try {
            const result = await unlockDemoWriteAccess(totpCode);
            setUnlockSuccess(result.message || 'Write access unlocked successfully!');
            setTotpCode('');
            // Refresh status
            await fetchStatus();
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to unlock';
            setUnlockError(errorMessage);
        } finally {
            setUnlocking(false);
        }
    };

    const handleLock = async () => {
        setLocking(true);
        setLockError(null);

        try {
            await lockDemoWriteAccess();
            setUnlockSuccess(null);
            // Refresh status
            await fetchStatus();
        } catch (error) {
            setLockError(error.response?.data?.message || error.message || 'Failed to lock');
        } finally {
            setLocking(false);
        }
    };

    const handleTotpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setTotpCode(value);
        setUnlockError(null);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && totpCode.length === 6) {
            handleUnlock();
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
                Demo Mode Administration
            </Typography>

            {/* Status Section */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Current Status
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={fetchStatus}
                        disabled={statusLoading}
                        sx={{
                            backgroundColor: '#9c27b0',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#7b1fa2'
                            }
                        }}
                    >
                        Refresh
                    </Button>
                </Box>

                {statusLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress />
                    </Box>
                )}

                {statusError && (
                    <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                        <strong>Status Check Failed:</strong> {statusError}
                    </Alert>
                )}

                {status && (
                    <Grid container spacing={2}>
                        {/* Demo Environment Status */}
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{
                                bgcolor: status.isDemoEnvironment ? 'info.light' : 'grey.100',
                                height: '100%'
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <KeyIcon sx={{ fontSize: 40, color: status.isDemoEnvironment ? 'info.main' : 'grey.500' }} />
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                Demo Environment
                                            </Typography>
                                            <Chip
                                                label={status.isDemoEnvironment ? 'Active' : 'Not Active'}
                                                color={status.isDemoEnvironment ? 'info' : 'default'}
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Write Access Status */}
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined" sx={{
                                bgcolor: status.writeAccessEnabled ? 'success.light' : 'warning.light',
                                height: '100%'
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {status.writeAccessEnabled ? (
                                            <LockOpenIcon sx={{ fontSize: 40, color: 'success.main' }} />
                                        ) : (
                                            <LockIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                                        )}
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                Write Access
                                            </Typography>
                                            <Chip
                                                label={status.writeAccessEnabled ? 'Enabled' : 'Disabled (Read-Only)'}
                                                color={status.writeAccessEnabled ? 'success' : 'warning'}
                                                size="small"
                                            />
                                        </Box>
                                    </Box>
                                    {status.writeAccessEnabled && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                            <TimerIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Access expires in ~20 minutes from unlock
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {/* Unlock Section - Only show if in demo mode and not unlocked */}
            {status?.isDemoEnvironment && !status?.writeAccessEnabled && (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Unlock Write Access
                    </Typography>

                    <Alert severity="info" sx={{ mb: 3 }}>
                        Enter a 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) to temporarily enable write operations.
                    </Alert>

                    {unlockError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {unlockError}
                        </Alert>
                    )}

                    {unlockSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {unlockSuccess}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <TextField
                            label="TOTP Code"
                            value={totpCode}
                            onChange={handleTotpChange}
                            onKeyPress={handleKeyPress}
                            placeholder="123456"
                            variant="outlined"
                            inputProps={{
                                maxLength: 6,
                                pattern: '[0-9]*',
                                inputMode: 'numeric',
                                style: { letterSpacing: '0.5em', fontSize: '1.2em', textAlign: 'center' }
                            }}
                            sx={{ width: 180 }}
                            disabled={unlocking}
                        />
                        <Button
                            variant="contained"
                            startIcon={unlocking ? <CircularProgress size={20} color="inherit" /> : <LockOpenIcon />}
                            onClick={handleUnlock}
                            disabled={unlocking || totpCode.length !== 6}
                            sx={{
                                backgroundColor: '#4caf50',
                                color: 'white',
                                height: 56,
                                '&:hover': {
                                    backgroundColor: '#388e3c'
                                }
                            }}
                        >
                            {unlocking ? 'Unlocking...' : 'Unlock'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* Lock Section - Only show if unlocked */}
            {status?.isDemoEnvironment && status?.writeAccessEnabled && (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Revoke Write Access
                    </Typography>

                    <Alert severity="success" sx={{ mb: 3 }}>
                        Write access is currently enabled. You can create, edit, and delete data. Click the button below to revoke access early.
                    </Alert>

                    {lockError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {lockError}
                        </Alert>
                    )}

                    <Button
                        variant="contained"
                        startIcon={locking ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                        onClick={handleLock}
                        disabled={locking}
                        sx={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: '#d32f2f'
                            }
                        }}
                    >
                        {locking ? 'Locking...' : 'Lock (Revoke Access)'}
                    </Button>
                </Paper>
            )}

            {/* Setup Instructions */}
            {status?.isDemoEnvironment && (
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Setup Instructions
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            To unlock write access, you need a TOTP (Time-based One-Time Password) authenticator app configured with the demo secret.
                        </Typography>

                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <PhoneIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Step 1: Install an authenticator app"
                                    secondary="Download Google Authenticator, Authy, or any TOTP-compatible app on your phone"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <QrCodeIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Step 2: Add the demo account"
                                    secondary="Scan the QR code or manually enter the secret key provided by the administrator"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <NumbersIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Step 3: Enter the code"
                                    secondary="Enter the 6-digit code shown in your authenticator app above to unlock write access for 20 minutes"
                                />
                            </ListItem>
                        </List>

                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <strong>Note:</strong> Write access automatically expires after 20 minutes. You'll need to enter a new code to continue making changes.
                        </Alert>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Not in demo mode message */}
            {status && !status.isDemoEnvironment && (
                <Alert severity="info">
                    This page is only functional in the demo environment. The current environment does not have demo restrictions enabled.
                </Alert>
            )}
        </Container>
    );
};

export default DemoUnlockPage;
