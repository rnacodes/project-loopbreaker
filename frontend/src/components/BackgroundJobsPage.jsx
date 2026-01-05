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
    Slider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    PlayArrow as PlayIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    MenuBook as BookIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import {
    getBookEnrichmentStatus,
    runBookEnrichment,
    runBookEnrichmentAll
} from '../api';

const BackgroundJobsPage = () => {
    // Book Enrichment State
    const [enrichmentStatus, setEnrichmentStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState(null);

    // Single batch run state
    const [runningBatch, setRunningBatch] = useState(false);
    const [batchResult, setBatchResult] = useState(null);
    const [batchError, setBatchError] = useState(null);

    // Run all state
    const [runningAll, setRunningAll] = useState(false);
    const [runAllResult, setRunAllResult] = useState(null);
    const [runAllError, setRunAllError] = useState(null);

    // Configuration state
    const [batchSize, setBatchSize] = useState(50);
    const [delayMs, setDelayMs] = useState(1000);
    const [maxBooks, setMaxBooks] = useState(500);
    const [pauseBetweenBatches, setPauseBetweenBatches] = useState(30);

    // Fetch status on mount
    useEffect(() => {
        fetchEnrichmentStatus();
    }, []);

    const fetchEnrichmentStatus = async () => {
        setStatusLoading(true);
        setStatusError(null);

        try {
            const status = await getBookEnrichmentStatus();
            setEnrichmentStatus(status);
        } catch (error) {
            setStatusError(error.response?.data?.error || error.message || 'Failed to fetch enrichment status');
            setEnrichmentStatus(null);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleRunBatch = async () => {
        setRunningBatch(true);
        setBatchResult(null);
        setBatchError(null);

        try {
            const result = await runBookEnrichment({
                batchSize,
                delayBetweenCallsMs: delayMs
            });
            setBatchResult(result);
            // Refresh status after run
            await fetchEnrichmentStatus();
        } catch (error) {
            setBatchError(error.response?.data?.error || error.message || 'Failed to run enrichment batch');
        } finally {
            setRunningBatch(false);
        }
    };

    const handleRunAll = async () => {
        if (!window.confirm(`This will process up to ${maxBooks} books. This may take a while. Continue?`)) {
            return;
        }

        setRunningAll(true);
        setRunAllResult(null);
        setRunAllError(null);

        try {
            const result = await runBookEnrichmentAll({
                batchSize,
                delayBetweenCallsMs: delayMs,
                maxBooks,
                pauseBetweenBatchesSeconds: pauseBetweenBatches
            });
            setRunAllResult(result);
            // Refresh status after run
            await fetchEnrichmentStatus();
        } catch (error) {
            setRunAllError(error.response?.data?.error || error.message || 'Failed to run full enrichment');
        } finally {
            setRunningAll(false);
        }
    };

    const isRunning = runningBatch || runningAll;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
                Background Jobs
            </Typography>

            {/* Book Description Enrichment Section */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <BookIcon sx={{ fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Book Description Enrichment
                    </Typography>
                </Box>

                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
                    Fetches book descriptions from Open Library for books that have an ISBN but no description.
                    This uses a two-step API lookup and respects rate limits.
                </Alert>

                {/* Status Section */}
                <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Current Status</Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={statusLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                                onClick={fetchEnrichmentStatus}
                                disabled={statusLoading || isRunning}
                            >
                                Refresh
                            </Button>
                        </Box>

                        {statusError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {statusError}
                            </Alert>
                        )}

                        {enrichmentStatus && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1, minWidth: 150 }}>
                                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                        {enrichmentStatus.booksNeedingEnrichment}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Books Need Descriptions
                                    </Typography>
                                </Box>

                                {enrichmentStatus.booksNeedingEnrichment === 0 ? (
                                    <Chip
                                        icon={<CheckCircleIcon />}
                                        label="All books enriched!"
                                        color="success"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                ) : (
                                    <Chip
                                        icon={<ScheduleIcon />}
                                        label="Enrichment available"
                                        color="warning"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* Configuration Section */}
                <Accordion defaultExpanded sx={{ mb: 3 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Configuration</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography gutterBottom>
                                    Batch Size: <strong>{batchSize}</strong> books per batch
                                </Typography>
                                <Slider
                                    value={batchSize}
                                    onChange={(e, value) => setBatchSize(value)}
                                    min={10}
                                    max={200}
                                    step={10}
                                    marks={[
                                        { value: 10, label: '10' },
                                        { value: 50, label: '50' },
                                        { value: 100, label: '100' },
                                        { value: 200, label: '200' },
                                    ]}
                                    disabled={isRunning}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography gutterBottom>
                                    API Delay: <strong>{delayMs}ms</strong> between calls
                                </Typography>
                                <Slider
                                    value={delayMs}
                                    onChange={(e, value) => setDelayMs(value)}
                                    min={500}
                                    max={3000}
                                    step={100}
                                    marks={[
                                        { value: 500, label: '0.5s' },
                                        { value: 1000, label: '1s' },
                                        { value: 2000, label: '2s' },
                                        { value: 3000, label: '3s' },
                                    ]}
                                    disabled={isRunning}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography gutterBottom>
                                    Max Books (Run All): <strong>{maxBooks}</strong>
                                </Typography>
                                <Slider
                                    value={maxBooks}
                                    onChange={(e, value) => setMaxBooks(value)}
                                    min={100}
                                    max={2000}
                                    step={100}
                                    marks={[
                                        { value: 100, label: '100' },
                                        { value: 500, label: '500' },
                                        { value: 1000, label: '1000' },
                                        { value: 2000, label: '2000' },
                                    ]}
                                    disabled={isRunning}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography gutterBottom>
                                    Pause Between Batches: <strong>{pauseBetweenBatches}s</strong>
                                </Typography>
                                <Slider
                                    value={pauseBetweenBatches}
                                    onChange={(e, value) => setPauseBetweenBatches(value)}
                                    min={10}
                                    max={120}
                                    step={10}
                                    marks={[
                                        { value: 10, label: '10s' },
                                        { value: 30, label: '30s' },
                                        { value: 60, label: '60s' },
                                        { value: 120, label: '120s' },
                                    ]}
                                    disabled={isRunning}
                                />
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* Action Buttons */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Run Single Batch
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Process {batchSize} books and return immediately.
                                    Good for quick, incremental enrichment.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    startIcon={runningBatch ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                                    onClick={handleRunBatch}
                                    disabled={isRunning || enrichmentStatus?.booksNeedingEnrichment === 0}
                                >
                                    {runningBatch ? 'Running...' : `Run Batch (${batchSize} books)`}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Run All (Bulk)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Process up to {maxBooks} books in multiple batches.
                                    Use for initial population after large imports.
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    startIcon={runningAll ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                                    onClick={handleRunAll}
                                    disabled={isRunning || enrichmentStatus?.booksNeedingEnrichment === 0}
                                >
                                    {runningAll ? 'Running (this may take a while)...' : `Run All (up to ${maxBooks} books)`}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Batch Results */}
                {batchError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <strong>Batch Run Failed:</strong> {batchError}
                    </Alert>
                )}

                {batchResult && (
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: 'success.dark' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Batch Run Complete
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            {batchResult.totalProcessed}
                                        </Typography>
                                        <Typography variant="caption">Processed</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                            {batchResult.enrichedCount}
                                        </Typography>
                                        <Typography variant="caption">Enriched</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                            {batchResult.failedCount}
                                        </Typography>
                                        <Typography variant="caption">Failed</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                            {batchResult.skippedCount}
                                        </Typography>
                                        <Typography variant="caption">Skipped</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {batchResult.errors && batchResult.errors.length > 0 && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Errors ({batchResult.errors.length}):
                                    </Typography>
                                    {batchResult.errors.slice(0, 5).map((err, idx) => (
                                        <Typography key={idx} variant="caption" display="block">
                                            {err}
                                        </Typography>
                                    ))}
                                    {batchResult.errors.length > 5 && (
                                        <Typography variant="caption">
                                            ...and {batchResult.errors.length - 5} more
                                        </Typography>
                                    )}
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Run All Results */}
                {runAllError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <strong>Full Run Failed:</strong> {runAllError}
                    </Alert>
                )}

                {runAllResult && (
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: 'success.dark' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Full Run Complete
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={2}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                            {runAllResult.totalProcessed}
                                        </Typography>
                                        <Typography variant="caption">Processed</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={2}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                            {runAllResult.totalEnriched}
                                        </Typography>
                                        <Typography variant="caption">Enriched</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={2}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                            {runAllResult.totalFailed}
                                        </Typography>
                                        <Typography variant="caption">Failed</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6} sm={2}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                                            {runAllResult.batchesRun}
                                        </Typography>
                                        <Typography variant="caption">Batches</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                            {runAllResult.remainingBooks}
                                        </Typography>
                                        <Typography variant="caption">Still Remaining</Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {runAllResult.errors && runAllResult.errors.length > 0 && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Errors ({runAllResult.errors.length}):
                                    </Typography>
                                    {runAllResult.errors.slice(0, 5).map((err, idx) => (
                                        <Typography key={idx} variant="caption" display="block">
                                            {err}
                                        </Typography>
                                    ))}
                                    {runAllResult.errors.length > 5 && (
                                        <Typography variant="caption">
                                            ...and {runAllResult.errors.length - 5} more
                                        </Typography>
                                    )}
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Scheduled Jobs Info */}
                <Alert severity="info" icon={<ScheduleIcon />}>
                    <Typography variant="body2">
                        <strong>Scheduled Execution:</strong> For automated enrichment, set up a cron job on your
                        server to call the <code>/api/bookenrichment/run-all</code> endpoint on a schedule.
                        See the documentation for setup instructions.
                    </Typography>
                </Alert>
            </Paper>

            {/* Placeholder for future jobs */}
            <Paper elevation={3} sx={{ p: 3, opacity: 0.6 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    More Jobs Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Additional background jobs will be added here as they are implemented.
                </Typography>
            </Paper>
        </Container>
    );
};

export default BackgroundJobsPage;
