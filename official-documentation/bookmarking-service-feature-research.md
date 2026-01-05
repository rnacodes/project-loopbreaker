# Bookmarking Service Research - Feature Suggestions

Based on research of Raindrop.io, Pocket, Pinboard, and LinkAce.

## High-Value, Low-Complexity Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Duplicate Detection** | Alert when adding a URL already in library | Cleaner library, prevents clutter |
| **Broken Link Monitoring** | Periodic check for 404/dead links | Maintains link integrity |
| **Highlights/Annotations** | Save text highlights from articles | Better recall of key passages |
| **Full-Text Search** | Search content of saved pages, not just titles | Find things you forgot the title of |
| **Multiple View Modes** | Grid, List, Masonry layouts | User preference flexibility |

## Medium-Complexity Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Wayback Machine Integration** | Auto-save/link to archive.org versions | Access content even if original disappears |
| **Import from Services** | Import bookmarks from Chrome, Raindrop, Pocket | Easy migration for new users |
| **Public/Private Collections** | Share curated collections publicly | Community/social features |
| **RSS for Collections** | Generate RSS feeds from mixlists | External consumption of curated content |
| **Browser Extension** | Quick-save from any page | Lower friction for adding items |

## Recommendations (Best ROI)

1. **Duplicate detection** - Simple check on URL, high user value
2. **Broken link checker** - Already have infrastructure with LastCheckedDate
3. **Wayback Machine links** - Already have WaybackUrl field, just need integration
4. **Multiple view modes for search results** - Grid view for visual content, list for reading

## Service-Specific Insights

### Raindrop.io
- Visual bookmarking with rich media cards and thumbnails
- Collections with thousands of predefined icons
- Full-text search across saved content and PDFs
- Highlights/annotations for web pages
- Batch processing for bulk operations
- Multiple view modes (Grid, Headlines, Masonry, List)
- Auto-save favorites from Twitter, YouTube, etc.

### Pocket
- Focused on content consumption, not just saving
- Offline reading capability
- Clean reading experience
- Integration with Evernote and Notion
- Note: Mozilla shut down Pocket on July 8, 2025

### Pinboard
- Minimalist, text-based interface
- Strong tagging system
- Automatic archiving of bookmarked pages
- Full API access for developers
- Dead link detection (Pro account)
- $11/year standard, $25/year pro

### LinkAce (Self-Hosted)
- Light and dark themes
- Private/public link sharing
- RSS feeds for link collections
- Automatic broken link checking
- Wayback Machine integration
- Full-text search
- GPL-3.0 license, Docker deployment

## Sources

- [Raindrop.io](https://www.raindrop.io)
- [Slant: Pocket vs Raindrop.io](https://www.slant.co/versus/555/14024/~pocket_vs_raindrop-io)
- [LinkAce](https://www.linkace.org/)
- [GitHub: LinkAce](https://github.com/Kovah/LinkAce)
- [Top 10 Raindrop Alternatives](https://www.remio.ai/post/top-10-raindrop-alternatives-for-bookmark-management-in-2025)
