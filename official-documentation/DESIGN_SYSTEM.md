# TODO: Update design system based on latest page updates

# TODO: Include rating icon system

# Design System & Shared Components

This document outlines the design system and shared components for Project Loopbreaker's frontend.

## 🎨 Design System

### Colors

The design system uses a dark theme with the following color palette:

#### Primary Colors
- **Primary**: `#695a8c` (ultra-violet) - Main brand color
- **Secondary**: `#fcfafa` (seasalt) - Accent color

#### Background Colors
- **Default**: `#1B1B1B` - Main background
- **Paper**: `#474350` (davys-gray) - Card backgrounds
- **Elevated**: `#2a2a2a` - Form inputs and elevated elements

#### Text Colors
- **Primary**: `#fcfafa` - Main text
- **Secondary**: `#695a8c` - Secondary text
- **Disabled**: `#666666` - Disabled text
- **Hint**: `#999999` - Hint text

#### Status Colors
- **Success**: `#4caf50` - Completed/consumed items
- **Warning**: `#ff9800` - In progress items
- **Error**: `#f44336` - Did not finish items
- **Info**: `#2196f3` - Not consumed items

#### Media Type Colors
Each media type has its own distinct color:
- **Podcast**: `#e91e63` (pink)
- **Book**: `#9c27b0` (purple)
- **Movie**: `#3f51b5` (indigo)
- **TV**: `#2196f3` (blue)
- **Article**: `#4caf50` (green)
- **Music**: `#ff9800` (orange)
- **Game**: `#795548` (brown)
- **Video**: `#f44336` (red)
- **Website**: `#607d8b` (blue-grey)
- **Document**: `#9e9e9e` (grey)

### Typography

The design system uses Roboto as the primary font family with the following hierarchy:

- **H1**: 3rem, 700 weight, centered
- **H2**: 2.5rem, 600 weight
- **H3**: 2rem, 600 weight
- **H4**: 1.5rem, 600 weight, with bottom border
- **H5**: 1.25rem, 500 weight
- **H6**: 1.125rem, 500 weight
- **Body1**: 1.1rem, normal weight
- **Body2**: 1rem, normal weight
- **Caption**: 0.875rem, hint color

### Spacing

Consistent spacing scale:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

### Border Radius

- **sm**: 4px
- **md**: 8px
- **lg**: 16px
- **xl**: 24px
- **round**: 50%

### Shadows

- **sm**: `0 2px 4px rgba(0, 0, 0, 0.1)`
- **md**: `0 4px 12px rgba(0, 0, 0, 0.15)`
- **lg**: `0 8px 25px rgba(252, 250, 250, 0.2)`
- **xl**: `0 16px 40px rgba(0, 0, 0, 0.25)`

### Transitions

- **fast**: 0.15s ease-in-out
- **normal**: 0.3s ease-in-out
- **slow**: 0.5s ease-in-out

## 🧩 Shared Components

### MediaCard

A reusable card component for displaying media items.

```jsx
import { MediaCard } from './components/shared';

<MediaCard
  media={mediaItem}
  variant="default" // 'default', 'compact', 'featured'
  showActions={true}
  onClick={handleMediaClick}
/>
```

**Props:**
- `media`: Media item object with title, mediaType, status, etc.
- `variant`: Card size variant
- `showActions`: Whether to show action buttons
- `onClick`: Click handler function

### SearchBar

An enhanced search component with suggestions and autocomplete.

```jsx
import { SearchBar } from './components/shared';

<SearchBar
  onSearch={handleSearch}
  suggestions={suggestions}
  recentSearches={recentSearches}
  trendingSearches={trendingSearches}
  placeholder="Search your media library..."
/>
```

**Props:**
- `onSearch`: Search handler function
- `suggestions`: Array of search suggestions
- `recentSearches`: Array of recent searches
- `trendingSearches`: Array of trending searches
- `placeholder`: Search placeholder text

### LoadingSpinner

A flexible loading component with multiple variants.

```jsx
import { LoadingSpinner } from './components/shared';

<LoadingSpinner
  variant="spinner" // 'spinner', 'skeleton', 'dots', 'pulse'
  size="medium" // 'small', 'medium', 'large'
  message="Loading..."
  fullScreen={false}
/>
```

**Props:**
- `variant`: Loading animation type
- `size`: Spinner size
- `message`: Loading message
- `fullScreen`: Whether to cover full screen

### MediaCarousel

A carousel component using Swiper.js and Framer Motion.

```jsx
import { MediaCarousel } from './components/shared';

<MediaCarousel
  mediaItems={mediaItems}
  title="Featured Media"
  subtitle="Swipe through our featured content"
  variant="coverflow" // 'coverflow', 'cards', 'simple'
  autoplay={true}
  onMediaClick={handleMediaClick}
/>
```

**Props:**
- `mediaItems`: Array of media items
- `title`: Carousel title
- `subtitle`: Carousel subtitle
- `variant`: Carousel animation type
- `autoplay`: Whether to autoplay
- `onMediaClick`: Media item click handler

## 🚀 Usage

### Importing Components

```jsx
// Import individual components
import { MediaCard, SearchBar, LoadingSpinner, MediaCarousel } from './components/shared';

// Import design system utilities
import { COLORS, SPACING, getMediaTypeColor, commonStyles } from './components/shared';
```

### Using Design System Utilities

```jsx
// Get media type color
const color = getMediaTypeColor('podcast'); // Returns '#e91e63'

// Get status color
const statusColor = getStatusColor('consumed'); // Returns '#4caf50'

// Use common styles
<Box sx={commonStyles.container}>
  <Card sx={commonStyles.card}>
    {/* Card content */}
  </Card>
</Box>
```

### Theme Integration

The design system is integrated with Material-UI's theme provider:

```jsx
import { theme } from './components/shared/DesignSystem';

<ThemeProvider theme={theme}>
  {/* Your app components */}
</ThemeProvider>
```

## 🎯 Best Practices

1. **Consistent Styling**: Always use the design system colors, spacing, and typography
2. **Component Reuse**: Use shared components instead of creating new ones
3. **Responsive Design**: Components are built to be responsive by default
4. **Accessibility**: All components include proper ARIA labels and keyboard navigation
5. **Performance**: Components are optimized for performance with proper memoization

## 🔧 Customization

To customize the design system:

1. Modify the constants in `DesignSystem.jsx`
2. Update the theme object for Material-UI integration
3. Extend components with additional props as needed
4. Add new utility functions for common patterns

## 📱 Responsive Design

All components are built with responsive design in mind:

- **Mobile**: Optimized for touch interactions
- **Tablet**: Balanced layout with appropriate spacing
- **Desktop**: Full feature set with hover effects

## 🎨 Demo

Visit `/demo` in the application to see all components in action with interactive examples.
