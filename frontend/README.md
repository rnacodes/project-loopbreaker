# ProjectLoopbreaker Frontend

React + Vite application for ProjectLoopbreaker media library management.

## Environment Configuration

### Development
The app defaults to `http://localhost:5033/api` when running locally.

### Production
Set the `VITE_API_URL` environment variable in your hosting platform (Render, Vercel, Netlify, etc.):

```
VITE_API_URL=https://www.api.mymediaverseuniverse.com/api
```

**IMPORTANT:** The URL MUST include the `/api` suffix, as all backend endpoints are under the `/api` route.

### Building for Production

```bash
# Set the environment variable before building
VITE_API_URL=https://www.api.mymediaverseuniverse.com/api npm run build
```

## API Endpoints

All backend endpoints follow the pattern: `{BASE_URL}/api/{controller}/{action}`

Examples:
- `GET /api/media` - Get all media items
- `GET /api/mixlist` - Get all mixlists
- `GET /api/podcast/series` - Get podcast series
- `POST /api/auth/login` - User login

## Development

```bash
npm install
npm run dev
```

## Testing

```bash
npm test
```

See [TESTING.md](TESTING.md) for complete testing documentation.

## Documentation

For deployment guides and troubleshooting, see:
- [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Detailed deployment guide
- [docs/DEPLOYMENT-CHECKLIST.md](../docs/DEPLOYMENT-CHECKLIST.md) - Quick deployment checklist
- [docs/README.md](../docs/README.md) - Complete documentation index

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
