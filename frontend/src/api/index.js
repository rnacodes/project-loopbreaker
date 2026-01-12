// Central API module - re-exports all API services
// This allows importing from '@/api' or '../api' for backward compatibility

// Core client and token management
export { apiClient, setAccessToken, getAccessToken, API_URL } from './apiClient';

// Authentication
export { login, validateToken, logout, cleanupRefreshTokens } from './authService';

// Media
export {
    addMedia,
    getMediaById,
    getAllMedia,
    searchMedia,
    getMediaByType,
    updateMedia,
    deleteMedia,
    bulkDeleteMedia,
    getMediaByTopic,
    getMediaByGenre,
    updateMediaTopicsGenres
} from './mediaService';

// Mixlists
export {
    getAllMixlists,
    searchMixlists,
    createMixlist,
    addMediaToMixlist,
    getMixlistById,
    updateMixlist,
    deleteMixlist,
    removeMediaFromMixlist,
    seedMixlists
} from './mixlistService';

// Podcasts
export {
    searchPodcasts,
    getPodcastFromApi,
    importPodcastFromApi,
    getAllPodcastSeries,
    getPodcastSeriesById,
    searchPodcastSeries,
    createPodcastSeries,
    deletePodcastSeries,
    subscribeToPodcastSeries,
    unsubscribeFromPodcastSeries,
    getSubscribedPodcastSeries,
    syncPodcastSeriesEpisodes,
    importPodcastSeriesFromApi,
    importPodcastSeriesByName,
    importPodcastEpisodeFromApi,
    getEpisodesBySeriesId,
    getPodcastEpisodeById,
    getAllPodcastEpisodes,
    createPodcastEpisode,
    deletePodcastEpisode
} from './podcastService';

// Topics and Genres
export {
    getAllTopics,
    searchTopics,
    createTopic,
    deleteTopic,
    updateTopic,
    importTopicsFromJson,
    importTopicsFromCsv,
    getAllGenres,
    searchGenres,
    createGenre,
    deleteGenre,
    updateGenre,
    importGenresFromJson,
    importGenresFromCsv
} from './topicGenreService';

// Books
export {
    getAllBooks,
    getBookById,
    getBooksByAuthor,
    getBookSeries,
    createBook,
    updateBook,
    deleteBook,
    searchBooksFromOpenLibrary,
    importBookFromOpenLibrary
} from './bookService';

// Uploads
export {
    uploadCsv,
    uploadThumbnail,
    uploadThumbnailFromUrl,
    uploadGoodreadsCsv
} from './uploadService';

// TMDB
export {
    searchMovies,
    searchTvShows,
    searchMulti,
    getMovieDetails,
    getTvShowDetails,
    getPopularMovies,
    getPopularTvShows,
    getMovieGenres,
    getTvGenres,
    getTmdbImageUrl
} from './tmdbService';

// Movies
export {
    getAllMovies,
    getMovieById,
    getMoviesByDirector,
    getMoviesByYear,
    createMovie,
    updateMovie,
    deleteMovie,
    importMovieFromTmdb,
    searchMoviesFromTmdb
} from './movieService';

// TV Shows
export {
    getAllTvShows,
    getTvShowById,
    getTvShowsByCreator,
    getTvShowsByYear,
    createTvShow,
    updateTvShow,
    deleteTvShow,
    importTvShowFromTmdb,
    searchTvShowsFromTmdb
} from './tvShowService';

// Videos
export {
    getAllVideos,
    getVideoById,
    getVideosByChannel,
    getVideoSeries,
    createVideo,
    updateVideo,
    deleteVideo,
    getPlaylistsForVideo
} from './videoService';

// YouTube
export {
    searchYouTube,
    getYouTubeVideoDetails,
    getYouTubeVideos,
    getYouTubePlaylistDetails,
    getYouTubePlaylistItems,
    getAllYouTubePlaylistItems,
    getYouTubeChannelDetails,
    getYouTubeChannelByUsername,
    getYouTubeChannelUploads,
    importYouTubeVideo,
    importYouTubePlaylist,
    importYouTubeChannel,
    getAllYouTubeChannels,
    getYouTubeChannelById,
    getYouTubeChannelByExternalId,
    getYouTubeChannelVideos,
    createYouTubeChannel,
    updateYouTubeChannel,
    deleteYouTubeChannel,
    importYouTubeChannelEntity,
    syncYouTubeChannelMetadata,
    checkYouTubeChannelExists,
    importFromYouTubeUrl,
    getAllYouTubePlaylists,
    getYouTubePlaylistById,
    getYouTubePlaylistByExternalId,
    getYouTubePlaylistVideos,
    importYouTubePlaylistEntity,
    syncYouTubePlaylist,
    addVideoToYouTubePlaylist,
    removeVideoFromYouTubePlaylist,
    deleteYouTubePlaylist
} from './youtubeService';

// Articles
export {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    findDuplicateArticles,
    deduplicateArticles,
    fetchArticleContent,
    bulkFetchArticleContents,
    syncDocumentsFromReader
} from './articleService';

// Documents
export {
    getAllDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByType,
    getDocumentsByCorrespondent,
    getArchivedDocuments,
    searchDocuments,
    getDocumentsByDateRange,
    syncDocumentsFromPaperless,
    syncSingleDocumentFromPaperless,
    getPaperlessStatus
} from './documentService';

// Highlights
export {
    syncHighlightsFromReadwise,
    getAllHighlights,
    getHighlightsByArticle,
    getHighlightsByBook,
    getHighlightsByTag,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    linkHighlightsToMedia,
    exportHighlightToReadwise
} from './highlightService';

// Readwise (unified sync)
export {
    validateReadwiseConnection,
    syncAll as syncReadwiseAll,
    fetchArticleContent as fetchReadwiseContent
} from './readwiseService';

// Websites
export {
    scrapeWebsitePreview,
    importWebsite,
    getAllWebsites,
    getWebsiteById,
    getWebsitesByDomain,
    getWebsitesWithRss,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    getWebsiteRssFeedItems
} from './websiteService';

// Development/Cleanup
export {
    cleanupYouTubeData,
    cleanupPodcasts,
    cleanupBooks,
    cleanupMovies,
    cleanupTvShows,
    cleanupArticles,
    cleanupHighlights,
    cleanupMixlists,
    cleanupAllTopics,
    cleanupAllGenres,
    cleanupOrphanedTopics,
    cleanupOrphanedGenres,
    cleanupAllMedia
} from './devService';

// Typesense Search
export {
    typesenseReindex,
    typesenseHealth,
    typesenseResetMediaItems,
    typesenseResetMixlists,
    typesenseSearch,
    typesenseAdvancedSearch,
    typesenseSearchMixlists,
    typesenseAdvancedSearchMixlists,
    reindexMixlists
} from './typesenseService';

// Background Jobs
export {
    getBookEnrichmentStatus,
    runBookEnrichment,
    runBookEnrichmentAll
} from './backgroundJobsService';

// Notes (Obsidian)
export {
    getAllNotes,
    getNoteById,
    getNoteBySlug,
    createNote,
    updateNote,
    deleteNote,
    linkNoteToMedia,
    unlinkNoteFromMedia,
    getMediaForNote,
    getNotesForMedia,
    syncVault,
    syncAllVaults,
    getSyncStatus,
    searchNotes,
    searchNotesByVault,
    multiSearch,
    reindexNotes,
    resetNotesCollection
} from './noteService';

// Script Execution
export {
    checkScriptRunnerHealth,
    getScriptJobs,
    getScriptJob,
    runNormalizeNotes,
    runNormalizeVault,
    cancelScriptJob
} from './scriptExecutionService';
