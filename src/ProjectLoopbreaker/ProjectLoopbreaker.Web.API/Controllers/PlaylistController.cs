// File: ProjectLoopbreaker.Web.API/Controllers/PlaylistController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlaylistController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;

        public PlaylistController(MediaLibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/playlist
        [HttpGet]
        public async Task<IActionResult> GetAllPlaylists()
        {
            var playlists = await _context.Playlists.ToListAsync();
            return Ok(playlists);
        }

        // GET: api/playlist/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlaylist(int id)
        {
            var playlist = await _context.Playlists
                .Include(p => p.MediaItems)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (playlist == null)
            {
                return NotFound();
            }

            return Ok(playlist);
        }

        // POST: api/playlist
        [HttpPost]
        public async Task<IActionResult> CreatePlaylist([FromBody] Playlist playlist)
        {
            if (playlist == null)
            {
                return BadRequest("Playlist data is null.");
            }

            _context.Playlists.Add(playlist);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPlaylist), new { id = playlist.Id }, playlist);
        }

        // POST: api/playlist/{playlistId}/items/{mediaItemId}
        [HttpPost("{playlistId}/items/{mediaItemId}")]
        public async Task<IActionResult> AddMediaItemToPlaylist(int playlistId, Guid mediaItemId)
        {
            var playlist = await _context.Playlists
                .Include(p => p.MediaItems)
                .FirstOrDefaultAsync(p => p.Id == playlistId);

            if (playlist == null)
            {
                return NotFound($"Playlist with ID {playlistId} not found.");
            }

            var mediaItem = await _context.MediaItems
                .Include(m => m.Playlists)
                .FirstOrDefaultAsync(m => m.Id == mediaItemId);

            if (mediaItem == null)
            {
                return NotFound($"Media item with ID {mediaItemId} not found.");
            }

            // Check if the media item is already in the playlist
            if (playlist.MediaItems.Any(m => m.Id == mediaItemId))
            {
                return BadRequest($"Media item with ID {mediaItemId} is already in the playlist.");
            }

            // Add media item to playlist
            playlist.MediaItems.Add(mediaItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Media item added to playlist '{playlist.Name}'" });
        }

        // DELETE: api/playlist/{playlistId}/items/{mediaItemId}
        [HttpDelete("{playlistId}/items/{mediaItemId}")]
        public async Task<IActionResult> RemoveMediaItemFromPlaylist(int playlistId, Guid mediaItemId)
        {
            var playlist = await _context.Playlists
                .Include(p => p.MediaItems)
                .FirstOrDefaultAsync(p => p.Id == playlistId);

            if (playlist == null)
            {
                return NotFound($"Playlist with ID {playlistId} not found.");
            }

            var mediaItem = playlist.MediaItems.FirstOrDefault(m => m.Id == mediaItemId);
            if (mediaItem == null)
            {
                return NotFound($"Media item with ID {mediaItemId} not found in the playlist.");
            }

            // Remove the media item from the playlist
            playlist.MediaItems.Remove(mediaItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Media item removed from playlist '{playlist.Name}'" });
        }
    }
}
