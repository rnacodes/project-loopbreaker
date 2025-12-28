import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Card, CardContent, 
    Chip, Divider, IconButton, CircularProgress, Alert,
    Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, ListItemButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
    ArrowBack, Edit, OpenInNew, Sync, Delete,
    PlaylistAdd, ExpandMore, Visibility, Add, CheckCircle
} from '@mui/icons-material';
import axios from 'axios';
import MediaInfoCard from './MediaInfoCard';
import MediaDetailAccordion from './MediaDetailAccordion';
import MixlistCarousel from './MixlistCarousel';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    getPodcastSeriesById,
    getEpisodesBySeriesId,
    syncPodcastSeriesEpisodes,
    deletePodcastSeries,
    getAllMixlists,
    addMediaToMixlist,
    importPodcastEpisodeFromApi
} from '../services/apiService';
import { 
    formatMediaType, 
    formatStatus, 
    getMediaTypeColor, 
    getStatusColor, 
    getRatingIcon, 
    getRatingText 
} from '../utils/formatters';

function PodcastSeriesProfile() {
    // --- State Management ---
    const [series, setSeries] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [availableMixlists, setAvailableMixlists] = useState([]);
    const [currentMixlists, setCurrentMixlists] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
    const [viewAllEpisodesDialog, setViewAllEpisodesDialog] = useState(false);
    const [allEpisodesFromApi, setAllEpisodesFromApi] = useState([]);
    const [displayedEpisodes, setDisplayedEpisodes] = useState([]);
    const [loadingAllEpisodes, setLoadingAllEpisodes] = useState(false);
    const [importedEpisodes, setImportedEpisodes] = useState(new Map()); 
    const [importingEpisode, setImportingEpisode] = useState(null);
    const [importSuccessDialog, setImportSuccessDialog] = useState(false);
    const [lastImportedEpisode, setLastImportedEpisode] = useState(null);
    const [mixlistSearchQuery, setMixlistSearchQuery] = useState('');
    const [addToMixlistDialog, setAddToMixlistDialog] = useState(false);

    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // --- Effects ---
    useEffect(() => {
        fetchSeriesData();
        fetchMixlists();
    }, [id]);

    useEffect(() => {
        const fetchMixlists = async () => {
            if (!series) return;

            // Fetch current mixlists
            const mixlistIds = series.mixlistIds || [];
            if (mixlistIds.length > 0) {
                const allMixlistsResponse = await getAllMixlists();
                const allMixlists = allMixlistsResponse.data || [];
                const seriesMixlists = mixlistIds.map(mixlistId => 
                    allMixlists.find(m => m.id === mixlistId)
                ).filter(m => m !== undefined);
                setCurrentMixlists(seriesMixlists);
            } else {
                setCurrentMixlists([]);
            }
        };

        fetchMixlists();
    }, [series]);

    // --- Data Fetching ---
    const fetchSeriesData = async () => {
        try {
            setLoading(true);
            const [seriesResponse, episodesResponse] = await Promise.all([
                getPodcastSeriesById(id),
                getEpisodesBySeriesId(id)
            ]);

            setSeries(seriesResponse.data);
            
            const sortedEpisodes = (episodesResponse.data || []).sort((a, b) => {
                if (a.episodeNumber && b.episodeNumber) return b.episodeNumber - a.episodeNumber;
                if (a.releaseDate && b.releaseDate) return new Date(b.releaseDate) - new Date(a.releaseDate);
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            });
            
            setEpisodes(sortedEpisodes);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching podcast series:', error);
            setSnackbar({ open: true, message: 'Failed to load podcast series', severity: 'error' });
            setLoading(false);
        }
    };

    const fetchMixlists = async () => {
        try {
            const response = await getAllMixlists();
            setAvailableMixlists(response.data || []);
        } catch (error) {
            console.error('Error fetching mixlists:', error);
        }
    };

    // --- Logic Handlers ---
    const handleSync = async () => {
        try {
            setSyncing(true);
            const response = await syncPodcastSeriesEpisodes(id);
            setSnackbar({ 
                open: true, 
                message: `Synced! ${response.data.newEpisodesCount || 0} new episodes found.`, 
                severity: 'success' 
            });
            await fetchSeriesData();
            setSyncing(false);
        } catch (error) {
            console.error('Error syncing episodes:', error);
            setSnackbar({ open: true, message: 'Failed to sync episodes', severity: 'error' });
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePodcastSeries(id);
            setSnackbar({ open: true, message: 'Podcast series deleted', severity: 'success' });
            setTimeout(() => navigate('/all-media?mediaType=Podcast'), 1500);
        } catch (error) {
            console.error('Error deleting series:', error);
            setSnackbar({ open: true, message: 'Failed to delete podcast series', severity: 'error' });
        }
        setDeleteConfirmDialog(false);
    };

    const handleViewAllEpisodes = async () => {
        if (!series?.externalId) {
            setSnackbar({ open: true, message: 'No external ID available for this series', severity: 'error' });
            return;
        }

        try {
            setLoadingAllEpisodes(true);
            setViewAllEpisodesDialog(true);
            
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5033/api';
            const response = await axios.get(`${API_URL}/ListenNotes/podcasts/${series.externalId}`);
            
            const allEpisodes = response.data.episodes || [];
            setAllEpisodesFromApi(allEpisodes);
            setDisplayedEpisodes(allEpisodes.slice(0, 10));
            
            await checkImportedEpisodes();
            setLoadingAllEpisodes(false);
        } catch (error) {
            console.error('Error fetching all episodes:', error);
            setSnackbar({ open: true, message: 'Failed to fetch episodes from ListenNotes', severity: 'error' });
            setLoadingAllEpisodes(false);
            setViewAllEpisodesDialog(false);
        }
    };

    const checkImportedEpisodes = async () => {
        try {
            const dbEpisodesResponse = await getEpisodesBySeriesId(id);
            const dbEpisodes = dbEpisodesResponse.data || [];
            const importedMap = new Map();
            dbEpisodes.forEach(ep => {
                if (ep.externalId) importedMap.set(ep.externalId, ep.id);
            });
            setImportedEpisodes(importedMap);
        } catch (error) {
            console.error('Error checking imported episodes:', error);
        }
    };

    const handleImportEpisode = async (episode) => {
        if (!episode.id) return;
        try {
            setImportingEpisode(episode.id);
            const importedEp = await importPodcastEpisodeFromApi(episode.id, id);
            
            const newImportedMap = new Map(importedEpisodes);
            newImportedMap.set(episode.id, importedEp.id);
            setImportedEpisodes(newImportedMap);
            
            setLastImportedEpisode({ title: episode.title, id: importedEp.id });
            setImportingEpisode(null);
            setImportSuccessDialog(true);
            setSnackbar({ open: true, message: `Successfully imported "${episode.title}"!`, severity: 'success' });
            await fetchSeriesData();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to import episode', severity: 'error' });
            setImportingEpisode(null);
        }
    };

    const handleAddToMixlist = async (mixlistId) => {
        try {
            await addMediaToMixlist(mixlistId, id);
            setSnackbar({ open: true, message: 'Added to mixlist!', severity: 'success' });
            setAddToMixlistDialog(false);
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to add to mixlist', severity: 'error' });
        }
    };

    // --- Helpers ---
    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    };


    const getListenNotesUrl = () => {
        return series?.externalId ? `https://www.listennotes.com/podcasts/${series.externalId}/` : series?.link || null;
    };

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
    if (!series) return <Box p={3}><Alert severity="error">Podcast series not found</Alert></Box>;

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            py: { xs: 2, sm: 4 },
            px: { xs: 1, sm: 2 }
        }}>
            <Box sx={{ 
                width: '100%',
                maxWidth: '900px',
                backgroundColor: 'background.paper',
                borderRadius: { xs: '8px', sm: '16px' },
                p: { xs: 2, sm: 3, md: 4 },
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={() => navigate('/all-media?mediaType=Podcast')} sx={{ mr: 2 }}><ArrowBack /></IconButton>
                    <Typography 
                        variant="h4" 
                        onClick={() => navigate('/search?mediaType=Podcast')}
                        sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        Podcast Series
                    </Typography>
                    <IconButton onClick={() => navigate(`/edit-media/${id}`)} sx={{ ml: 'auto' }}><Edit /></IconButton>
                </Box>

                {/* Series Info */}
                <Card sx={{ overflow: 'hidden', borderRadius: 2 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                        <MediaInfoCard
                            mediaItem={series}
                            formatMediaType={formatMediaType}
                            formatStatus={formatStatus}
                            getMediaTypeColor={getMediaTypeColor}
                            getStatusColor={getStatusColor}
                            getRatingIcon={getRatingIcon}
                            getRatingText={getRatingText}
                        />

                        <MediaDetailAccordion mediaItem={series} navigate={navigate} />

                        <MixlistCarousel 
                            mediaItem={series}
                            currentMixlists={currentMixlists}
                            availableMixlists={availableMixlists}
                            setCurrentMixlists={setCurrentMixlists}
                            setAvailableMixlists={setAvailableMixlists}
                            setSnackbar={setSnackbar}
                            isMobile={isMobile}
                        />
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <Box display="flex" gap={1} flexWrap="wrap" my={3}>
                    {getListenNotesUrl() && (
                        <Button variant="outlined" size="small" startIcon={<OpenInNew />} href={getListenNotesUrl()} target="_blank">View on ListenNotes</Button>
                    )}
                    <Button variant="outlined" size="small" startIcon={<Sync />} onClick={handleSync} disabled={syncing}>
                        {syncing ? <CircularProgress size={20} /> : 'Sync Episodes'}
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<Visibility />} onClick={handleViewAllEpisodes}>View All Episodes</Button>
                    <Button variant="contained" size="small" startIcon={<PlaylistAdd />} onClick={() => setAddToMixlistDialog(true)}>Add to Mixlist</Button>
                    <Button variant="outlined" size="small" startIcon={<Delete />} onClick={() => setDeleteConfirmDialog(true)} color="error">Delete</Button>
                </Box>

                {/* Local Episodes List */}
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}><Typography variant="h6">Episodes ({episodes.length})</Typography></AccordionSummary>
                    <AccordionDetails>
                        <List>
                            {episodes.map((ep) => (
                                <ListItemButton key={ep.id} onClick={() => navigate(`/podcast-episode/${ep.id}`)} sx={{ mb: 1, borderRadius: 1 }}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle1">{ep.title}</Typography>
                                            <Chip label={formatStatus(ep.status)} size="small" sx={{ bgcolor: getStatusColor(ep.status), color: 'white' }} />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Released: {ep.releaseDate ? new Date(ep.releaseDate).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </Box>
                                </ListItemButton>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            </Box>

            {/* --- Dialogs --- */}
            
            {/* View All Episodes (API) */}
            <Dialog open={viewAllEpisodesDialog} onClose={() => setViewAllEpisodesDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>All Episodes from ListenNotes</DialogTitle>
                <DialogContent>
                    {loadingAllEpisodes ? <CircularProgress /> : (
                        <TableContainer component={Paper}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>Import</TableCell>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayedEpisodes.map((ep) => (
                                        <TableRow key={ep.id}>
                                            <TableCell>{displayedEpisodes.indexOf(ep) + 1}</TableCell>
                                            <TableCell>
                                                {importedEpisodes.has(ep.id) ? <CheckCircle color="success" /> : (
                                                    <IconButton onClick={() => handleImportEpisode(ep)} disabled={importingEpisode === ep.id}><Add /></IconButton>
                                                )}
                                            </TableCell>
                                            <TableCell>{ep.title}</TableCell>
                                            <TableCell>{formatDuration(ep.audio_length_sec)}</TableCell>
                                            <TableCell>
                                                {importedEpisodes.has(ep.id) ? (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/media/${importedEpisodes.get(ep.id)}`)}
                                                        color="primary"
                                                        title="View imported episode profile"
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                ) : (
                                                    ep.link && (
                                                        <IconButton
                                                            size="small"
                                                            href={ep.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Open episode in ListenNotes"
                                                        >
                                                            <OpenInNew fontSize="small" />
                                                        </IconButton>
                                                    )
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {displayedEpisodes.length < allEpisodesFromApi.length && (
                                <Button onClick={() => setDisplayedEpisodes(prev => allEpisodesFromApi.slice(0, prev.length + 10))}>Load More ({displayedEpisodes.length} of {allEpisodesFromApi.length})</Button>
                            )}
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setViewAllEpisodesDialog(false)}>Close</Button></DialogActions>
            </Dialog>

            {/* Add to Mixlist Dialog */}
            <Dialog open={addToMixlistDialog} onClose={() => setAddToMixlistDialog(false)}>
                <DialogTitle>Add to Mixlist</DialogTitle>
                <DialogContent>
                    <List>
                        {availableMixlists.map(m => (
                            <ListItem button key={m.id} onClick={() => handleAddToMixlist(m.id)}><ListItemText primary={m.name} /></ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions><Button onClick={() => setAddToMixlistDialog(false)}>Cancel</Button></DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent><Typography>Are you sure you want to delete "{series.title}"?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}

export default PodcastSeriesProfile;