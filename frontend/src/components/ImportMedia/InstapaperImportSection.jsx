import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button, Box, Typography,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Article, ExpandMore, OpenInNew } from '@mui/icons-material';

function InstapaperImportSection({ expanded, onAccordionChange }) {
    const navigate = useNavigate();

    return (
        <Accordion
            expanded={expanded === 'instapaper'}
            onChange={onAccordionChange('instapaper')}
            sx={{ mb: 2 }}
        >
            <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="instapaper-content"
                id="instapaper-header"
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Article />
                    <Typography variant="h6">
                        Articles from Instapaper
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Powered by
                        </Typography>
                        <Button
                            variant="text"
                            size="small"
                            href="https://www.instapaper.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNew fontSize="small" />}
                            sx={{
                                minWidth: 'auto',
                                textTransform: 'none',
                                color: '#ffffff',
                                '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            Instapaper
                        </Button>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ padding: 2 }}>
                    <Typography variant="body1" paragraph>
                        Import articles from your Instapaper account. Connect your account to:
                    </Typography>
                    <Box component="ul" sx={{ mb: 2, pl: 3 }}>
                        <li>
                            <Typography variant="body2">
                                Import articles from Unread, Starred, or Archive folders
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2">
                                Preserve reading progress and metadata
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2">
                                Automatically detect and skip duplicates
                            </Typography>
                        </li>
                        <li>
                            <Typography variant="body2">
                                Sync existing articles with latest progress
                            </Typography>
                        </li>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Article />}
                        onClick={() => navigate('/instapaper/auth')}
                        sx={{ mt: 2 }}
                    >
                        Connect to Instapaper
                    </Button>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
}

export default InstapaperImportSection;
