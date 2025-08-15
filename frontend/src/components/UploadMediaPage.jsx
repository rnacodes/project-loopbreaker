import React, { useState } from 'react';
import {
    Container, Box, Typography, Button, Paper, Alert, AlertTitle,
    CircularProgress, List, ListItem, ListItemText, Divider,
    Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { CloudUpload, FileUpload, CheckCircle, Error, ExpandMore } from '@mui/icons-material';
import { uploadCsv } from '../services/apiService';

function UploadMediaPage() {
    const [file, setFile] = useState(null);
    const [mediaType, setMediaType] = useState('Book');
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
                setError('');
                setUploadResult(null);
            } else {
                setError('Please select a CSV file');
                setFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError('');
        setUploadResult(null);

        try {
            const response = await uploadCsv(file, mediaType);
            console.log('Upload response:', response.data); // Debug log
            setUploadResult(response.data);
        } catch (err) {
            console.error('Upload error:', err);
            if (err.response?.data?.error) {
                setError(err.response.data.error + (err.response.data.details ? ': ' + err.response.data.details : ''));
            } else {
                setError('Failed to upload file. Please try again.');
            }
        } finally {
            setUploading(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setMediaType('Book');
        setUploadResult(null);
        setError('');
        // Reset the file input
        const fileInput = document.getElementById('csv-file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Upload Media
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
                Upload a CSV file to import multiple media items at once. Please select the media type you're uploading.
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Select CSV File
                    </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Media Type</InputLabel>
                        <Select
                            value={mediaType}
                            label="Media Type"
                            onChange={(e) => setMediaType(e.target.value)}
                        >
                            <MenuItem value="Book">Book</MenuItem>
                            <MenuItem value="Podcast">Podcast</MenuItem>
                        </Select>
                    </FormControl>

                    <input
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="csv-file-input">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<FileUpload />}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            Choose CSV File
                        </Button>
                    </label>

                    {file && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <AlertTitle>File Selected</AlertTitle>
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </Alert>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                    >
                        {uploading ? 'Uploading...' : 'Upload CSV'}
                    </Button>
                    
                    <Button
                        variant="outlined"
                        onClick={resetUpload}
                        disabled={uploading}
                    >
                        Reset
                    </Button>
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <AlertTitle>Upload Error</AlertTitle>
                    {error}
                </Alert>
            )}

            {uploadResult && (
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {uploadResult.ErrorCount === 0 ? (
                            <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        ) : (
                            <Error sx={{ color: 'warning.main', mr: 1 }} />
                        )}
                        <Typography variant="h6">
                            Upload Complete
                        </Typography>
                    </Box>

                    <Alert 
                        severity={uploadResult.ErrorCount === 0 ? 'success' : 'warning'} 
                        sx={{ mb: 2 }}
                    >
                        <AlertTitle>Results</AlertTitle>
                        {uploadResult.Message}
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main">
                                    {uploadResult.SuccessCount || 0}
                                </Typography>
                                <Typography variant="body2">
                                    Successful
                                </Typography>
                            </CardContent>
                        </Card>
                        
                        <Card sx={{ flex: 1 }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="error.main">
                                    {uploadResult.ErrorCount || 0}
                                </Typography>
                                <Typography variant="body2">
                                    Errors
                                </Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Debug info */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Debug: SuccessCount={uploadResult.SuccessCount}, ErrorCount={uploadResult.ErrorCount}, 
                            ImportedItems={uploadResult.ImportedItems ? uploadResult.ImportedItems.length : 0}
                        </Typography>
                    </Box>

                    {/* Display imported items with thumbnails */}
                    {uploadResult.ImportedItems && uploadResult.ImportedItems.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Imported Items ({uploadResult.ImportedItems.length})
                            </Typography>
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                                gap: 2,
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {uploadResult.ImportedItems.map((item, index) => (
                                    <Card 
                                        key={index} 
                                        sx={{ 
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.05)' }
                                        }}
                                        onClick={() => {
                                            // Navigate to the item's profile page
                                            const route = item.MediaType === 'Book' ? `/media/${item.Id}` : `/media/${item.Id}`;
                                            window.location.href = route;
                                        }}
                                    >
                                        <CardContent sx={{ p: 1, textAlign: 'center' }}>
                                            {item.Thumbnail ? (
                                                <img 
                                                    src={item.Thumbnail} 
                                                    alt={item.Title}
                                                    style={{ 
                                                        width: '80px', 
                                                        height: '80px', 
                                                        objectFit: 'cover',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            ) : (
                                                <Box 
                                                    sx={{ 
                                                        width: '80px', 
                                                        height: '80px', 
                                                        bgcolor: 'grey.200',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Typography variant="caption" color="text.secondary">
                                                        No Image
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    display: 'block', 
                                                    mt: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {item.Title}
                                            </Typography>
                                            {item.Author && (
                                                <Typography 
                                                    variant="caption" 
                                                    color="text.secondary"
                                                    sx={{ 
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {item.Author}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {uploadResult.Errors && uploadResult.Errors.length > 0 && (
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6">
                                    Error Details ({uploadResult.Errors.length})
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {uploadResult.Errors.map((error, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={error}
                                                    primaryTypographyProps={{ 
                                                        variant: 'body2',
                                                        color: 'error.main'
                                                    }}
                                                />
                                            </ListItem>
                                            {index < uploadResult.Errors.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </Paper>
            )}

            {/* CSV Format Instructions */}
            <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    CSV Format Instructions
                </Typography>
                
                <Typography variant="body2" paragraph>
                    Your CSV file should include a header row with column names. Make sure to select the correct media type above before uploading.
                </Typography>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">Book CSV Format</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" paragraph>
                            <strong>Required columns:</strong> Title, Author
                        </Typography>
                        <Typography variant="body2" paragraph>
                            <strong>Optional columns:</strong> Description, Link, Notes, RelatedNotes, Thumbnail, 
                            Genre, ISBN, ASIN, Format (Digital/Physical), PartOfSeries (true/false), 
                            Status (Uncharted/ActivelyExploring/Completed/Abandoned), Rating (SuperLike/Like/Neutral/Dislike), 
                            OwnershipStatus (Own/Rented/Streamed), DateCompleted, Topics (comma-separated), Genres (comma-separated)
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">Podcast CSV Format</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" paragraph>
                            <strong>Required columns:</strong> Title
                        </Typography>
                        <Typography variant="body2" paragraph>
                            <strong>Optional columns:</strong> Description, Link, Notes, RelatedNotes, Thumbnail, 
                            Genre, Publisher, AudioLink, ExternalId, PodcastType (Series/Episode), 
                            DurationInSeconds, ReleaseDate, Status, Rating, OwnershipStatus, DateCompleted, 
                            Topics (comma-separated), Genres (comma-separated)
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Tips:</strong>
                        <br />• Ensure your CSV file is properly formatted with commas as separators
                        <br />• Use quotes around text that contains commas
                        <br />• For boolean fields, use "true" or "false"
                        <br />• For date fields, use formats like "2024-01-15" or "01/15/2024"
                        <br />• Multiple topics/genres can be separated by commas within the cell
                    </Typography>
                </Alert>

                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        href="/sample-book-import.csv"
                        download="sample-book-import.csv"
                    >
                        Download Book Sample CSV
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        href="/sample-podcast-import.csv"
                        download="sample-podcast-import.csv"
                    >
                        Download Podcast Sample CSV
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default UploadMediaPage;
