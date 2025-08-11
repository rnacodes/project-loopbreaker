import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home,
  Movie,
  QueueMusic,
  Add,
  Upload,
  Download,
  Search,
  Science
} from '@mui/icons-material';

const ResponsiveNavigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const navigationItems = [
    { text: 'Home', path: '/', icon: <Home /> },
    { text: 'All Media', path: '/all-media', icon: <Movie /> },
    { text: 'Mixlists', path: '/mixlists', icon: <QueueMusic /> },
    { text: 'Add Media', path: '/add-media', icon: <Add /> },
    { text: 'Import Media', path: '/import-media', icon: <Download /> },
    { text: 'Upload Media', path: '/upload-media', icon: <Upload /> },
    { text: 'Search by Topic/Genre', path: '/search-by-topic-genre', icon: <Search /> },
    { text: 'Demo', path: '/demo', icon: <Science /> }
  ];

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Project Loopbreaker
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 'medium'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/" sx={{ textTransform: 'none', fontSize: '1.25rem' }}>
              Project Loopbreaker
            </Button>
          </Typography>
          
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  sx={{ 
                    textTransform: 'none',
                    minWidth: 'auto',
                    px: 2
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default ResponsiveNavigation;
