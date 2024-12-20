const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const YouTubeService = require('./services/youtube');
const SpotifyService = require('./services/spotify');

// Load environment variables
dotenv.config();
console.log('[Server] Environment variables loaded');

const app = express();

// Initialize services
console.log('[Server] Initializing services');
const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY);
const spotifyService = new SpotifyService(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET,
  process.env.SPOTIFY_REDIRECT_URI
);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
console.log('[Server] Middleware configured');

// Get Spotify login URL
app.get('/login', (req, res) => {
  console.log('[Server] Login request received');
  const authUrl = spotifyService.getAuthUrl();
  console.log('[Server] Generated auth URL:', authUrl);
  res.json({ url: authUrl });
});

// Handle Spotify callback
app.get('/callback', async (req, res) => {
  console.log('[Server] Callback request received');
  try {
    const { code } = req.query;
    console.log('[Server] Processing callback with code');
    const userData = await spotifyService.handleCallback(code);
    
    console.log('[Server] Authentication successful, redirecting to frontend');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/callback?` + 
      `accessToken=${userData.accessToken}&` +
      `refreshToken=${userData.refreshToken}&` +
      `userId=${userData.userId}&` +
      `displayName=${encodeURIComponent(userData.displayName)}`;
    
    console.log('[Server] Redirect URL generated:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('[Server] Callback error:', error);
    res.redirect('http://localhost:3000/error');
  }
});

// Endpoint to convert playlists
app.post('/convert', async (req, res) => {
  console.log('[Server] Received conversion request');
  try {
    const { url, name, accessToken } = req.body;
    console.log('[Server] Processing URL:', url);
    console.log('[Server] Playlist name:', name);
    
    if (!accessToken) {
      console.log('[Server] No access token provided');
      return res.status(401).json({ error: 'Please login with Spotify first' });
    }

    if (!name) {
      console.log('[Server] No playlist name provided');
      return res.status(400).json({ error: 'Please provide a name for your playlist' });
    }

    // Determine if it's a YouTube or Spotify URL
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isSpotify = url.includes('spotify.com');
    console.log('[Server] URL type:', isYouTube ? 'YouTube' : isSpotify ? 'Spotify' : 'Unknown');

    if (!isYouTube && !isSpotify) {
      console.log('[Server] Invalid URL format');
      return res.status(400).json({ 
        error: 'Invalid playlist URL. Please provide a valid YouTube or Spotify playlist URL.' 
      });
    }

    let songs;
    let conversionResult;

    if (isYouTube) {
      console.log('[Server] Starting YouTube to Spotify conversion');
      const playlistId = youtubeService.extractPlaylistId(url);
      console.log('[Server] Fetching YouTube playlist items');
      songs = await youtubeService.getPlaylistItems(playlistId);
      
      console.log('[Server] Creating Spotify playlist');
      conversionResult = await spotifyService.createPlaylist(
        accessToken,
        name,
        songs
      );
      console.log('[Server] Conversion completed successfully');
    } else {
      console.log('[Server] Spotify to YouTube conversion not implemented');
      return res.status(400).json({ 
        error: 'Spotify to YouTube conversion is not implemented yet' 
      });
    }

    const response = {
      platform: isYouTube ? 'spotify' : 'youtube',
      playlistUrl: conversionResult.url,
      summary: conversionResult.summary,
      tracks: conversionResult.results
    };
    
    console.log('[Server] Sending successful response with conversion details');
    res.json(response);
  } catch (error) {
    console.error('[Server] Conversion error:', error);
    console.error('[Server] Error details:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message || 'An error occurred while converting the playlist.' 
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[Server] Server running on port ${PORT}`);
  console.log('[Server] Environment:', process.env.NODE_ENV || 'development');
});
