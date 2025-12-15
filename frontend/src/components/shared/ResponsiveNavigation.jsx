//TODO: Change color of icones from dark purple to white
//TODO: Remove username from displaying when logged in - can just show "Logged In"
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  useMediaQuery,
  Chip
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
  Science,
  Apps,
  CleaningServices,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const ResponsiveNavigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setMobileOpen(false);
  };

  const navigationItems = [
    { text: 'Home', path: '/', icon: <Home /> },
    { text: 'All Media', path: '/all-media', icon: <Movie /> },
    { text: 'Mixlists', path: '/mixlists', icon: <QueueMusic /> },
    { text: 'Sources', path: '/sources', icon: <Apps /> },
    { text: 'Add Media', path: '/add-media', icon: <Add /> },
    { text: 'Import Media', path: '/import-media', icon: <Download /> },
    { text: 'Upload Media', path: '/upload-media', icon: <Upload /> },
    { text: 'Search by Topic/Genre', path: '/search-by-topic-genre', icon: <Search /> },
    { text: 'Cleanup', path: '/cleanup', icon: <CleaningServices /> },
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
      
      {/* User Info / Auth Section */}
      {isAuthenticated && user && (
        <Box sx={{ p: 2, backgroundColor: 'action.hover' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {user.username}
            </Typography>
          </Box>
        </Box>
      )}
      
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
        
        {/* Login/Logout Button in Mobile Menu */}
        {isAuthenticated ? (
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              borderTop: 1,
              borderColor: 'divider',
              mt: 1
            }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout"
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 'medium',
                  color: 'error.main'
                }
              }}
            />
          </ListItem>
        ) : (
          <ListItem
            button
            onClick={handleLogin}
            sx={{
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              borderTop: 1,
              borderColor: 'divider',
              mt: 1
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Login"
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 'medium'
                }
              }}
            />
          </ListItem>
        )}
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
              
              {/* Desktop Auth Section */}
              {isAuthenticated && user ? (
                <>
                  <Chip
                    icon={<PersonIcon />}
                    label={user.username}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                  <Button
                    color="inherit"
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    sx={{ 
                      textTransform: 'none',
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.contrastText'
                      }
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  color="inherit"
                  onClick={handleLogin}
                  startIcon={<LoginIcon />}
                  sx={{ 
                    textTransform: 'none',
                    ml: 2
                  }}
                >
                  Login
                </Button>
              )}
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
