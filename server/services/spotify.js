const SpotifyWebApi = require('spotify-web-api-node');

class SpotifyService {
  constructor(clientId, clientSecret, redirectUri) {
    console.log('[Spotify] Initializing Spotify service');
    this.spotifyApi = new SpotifyWebApi({
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: redirectUri
    });
    console.log('[Spotify] Service initialized with redirect URI:', redirectUri);
  }

  getAuthUrl() {
    console.log('[Spotify] Generating authorization URL');
    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email'
    ];
    console.log('[Spotify] Requesting scopes:', scopes.join(', '));
    return this.spotifyApi.createAuthorizeURL(scopes);
  }

  async handleCallback(code) {
    try {
      console.log('[Spotify] Handling OAuth callback');
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      const { access_token, refresh_token } = data.body;
      console.log('[Spotify] Successfully obtained tokens');
      
      this.spotifyApi.setAccessToken(access_token);
      this.spotifyApi.setRefreshToken(refresh_token);
      
      console.log('[Spotify] Fetching user profile');
      const me = await this.spotifyApi.getMe();
      console.log('[Spotify] User profile retrieved:', {
        id: me.body.id,
        display_name: me.body.display_name,
        email: me.body.email
      });

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        userId: me.body.id,
        displayName: me.body.display_name,
        email: me.body.email
      };
    } catch (error) {
      console.error('[Spotify] Authentication error:', error);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async refreshAccessToken(refreshToken) {
    console.log('[Spotify] Attempting to refresh access token');
    this.spotifyApi.setRefreshToken(refreshToken);
    try {
      const data = await this.spotifyApi.refreshAccessToken();
      console.log('[Spotify] Successfully refreshed access token');
      this.spotifyApi.setAccessToken(data.body['access_token']);
      return data.body['access_token'];
    } catch (error) {
      console.error('[Spotify] Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async searchAndMatchTrack(track) {
    console.log(`[Spotify] Searching for track: "${track.title}" by "${track.artist}"`);

    const cleanTitle = track.title
      .replace(/(Official\s*)?(Music\s*)?Video/i, '')
      .replace(/\(.*?remix.*?\)/gi, '') // Remove explicit remix references
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/ft\.|feat\./i, '')
      .trim();

    const searchQueries = [
      { query: `artist:${track.artist} track:${cleanTitle}`, type: 'strict' },
      { query: `${cleanTitle} ${track.artist}`, type: 'title-artist' },
      { query: `${cleanTitle}`, type: 'title-only' }
    ];

    for (const { query, type } of searchQueries) {
      try {
        console.log(`[Spotify] Trying ${type} search with query: "${query}"`);
        const searchResult = await this.spotifyApi.searchTracks(query, {
          limit: 50,
          market: 'US'
        });

        if (searchResult.body.tracks.items.length > 0) {
          const matches = searchResult.body.tracks.items
            .filter(spotifyTrack => !/remix/i.test(spotifyTrack.name)) // Exclude remixes
            .map(spotifyTrack => ({
              track: spotifyTrack,
              score: this.calculateMatchScore(track, spotifyTrack)
            }))
            .filter(match => match.score > 0.5) // Only consider good matches
            .sort((a, b) => b.score - a.score); // Sort by match score

          if (matches.length > 0) {
            const bestMatch = matches[0];
            console.log(`[Spotify] Found match with score ${bestMatch.score.toFixed(2)}:`, {
              youtubeTitle: track.title,
              youtubeArtist: track.artist,
              spotifyTitle: bestMatch.track.name,
              spotifyArtist: bestMatch.track.artists[0].name,
              matchType: type
            });

            return {
              uri: bestMatch.track.uri,
              name: bestMatch.track.name,
              artist: bestMatch.track.artists[0].name,
              score: bestMatch.score,
              duration: bestMatch.track.duration_ms,
              previewUrl: bestMatch.track.preview_url
            };
          }
        }
      } catch (error) {
        console.error(`[Spotify] Search error for query "${query}":`, error);
      }
    }

    console.log(`[Spotify] No match found for: "${track.title}" by "${track.artist}"`);
    return null;
  }

  calculateMatchScore(youtubeTrack, spotifyTrack) {
    const normalizeString = str => str.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const youtubeTitle = normalizeString(youtubeTrack.title);
    const youtubeArtist = normalizeString(youtubeTrack.artist);
    const spotifyTitle = normalizeString(spotifyTrack.name);
    const spotifyArtist = spotifyTrack.artists.map(a => normalizeString(a.name));

    let score = 0;

    // Title similarity using direct comparison
    const titleSimilarity = youtubeTitle.includes(spotifyTitle) || spotifyTitle.includes(youtubeTitle) ? 1 : 0;
    score += titleSimilarity * 0.7; // Adjust weight for stricter matching

    // Artist similarity using direct comparison
    const artistSimilarity = spotifyArtist.some(artist => youtubeArtist.includes(artist));
    score += artistSimilarity ? 0.3 : 0; // Adjust weight for artist

    return score;
  }

  async createPlaylist(accessToken, name, tracks) {
    try {
      console.log('[Spotify] Starting playlist creation process');
      console.log('[Spotify] Setting access token and fetching user profile');
      this.spotifyApi.setAccessToken(accessToken);
      
      const me = await this.spotifyApi.getMe();
      const userId = me.body.id;
      console.log('[Spotify] User ID:', userId);

      console.log('[Spotify] Creating new playlist');
      const playlist = await this.spotifyApi.createPlaylist(userId, {
        name: name,
        description: 'Created by Playlist Converter',
        public: false,
      });
      console.log('[Spotify] Created playlist:', {
        name: playlist.body.name,
        id: playlist.body.id,
        url: playlist.body.external_urls.spotify
      });

      console.log('[Spotify] Starting track search and add process');
      console.log(`[Spotify] Processing ${tracks.length} tracks`);
      
      const trackUris = [];
      const trackResults = [];

      for (const [index, track] of tracks.entries()) {
        console.log(`[Spotify] Processing track ${index + 1}/${tracks.length}`);
        
        try {
          const matchResult = await this.searchAndMatchTrack(track);

          if (matchResult) {
            trackUris.push(matchResult.uri);
            trackResults.push({
              youtube: {
                title: track.title,
                artist: track.artist,
                id: track.originalId
              },
              spotify: {
                title: matchResult.name,
                artist: matchResult.artist,
                uri: matchResult.uri,
                matchScore: matchResult.score,
                duration: matchResult.duration
              },
              matched: true
            });
          } else {
            trackResults.push({
              youtube: {
                title: track.title,
                artist: track.artist,
                id: track.originalId
              },
              matched: false
            });
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[Spotify] Error processing track "${track.title}":`, error);
          trackResults.push({
            youtube: {
              title: track.title,
              artist: track.artist,
              id: track.originalId
            },
            error: error.message,
            matched: false
          });
        }
      }

      const matchingSummary = {
        total: tracks.length,
        matched: trackUris.length,
        unmatched: tracks.length - trackUris.length,
        averageMatchScore: trackResults
          .filter(r => r.matched)
          .reduce((acc, r) => acc + r.spotify.matchScore, 0) / trackUris.length
      };

      console.log('[Spotify] Track matching summary:', matchingSummary);

      if (trackUris.length > 0) {
        console.log(`[Spotify] Adding ${trackUris.length} tracks to playlist`);
        for (let i = 0; i < trackUris.length; i += 50) {
          const batch = trackUris.slice(i, i + 50);
          console.log(`[Spotify] Adding batch ${Math.floor(i/50) + 1}/${Math.ceil(trackUris.length/50)}`);
          await this.spotifyApi.addTracksToPlaylist(playlist.body.id, batch);
        }
        console.log('[Spotify] Successfully added all tracks to playlist');
      }

      console.log('[Spotify] Full conversion results:', {
        playlistUrl: playlist.body.external_urls.spotify,
        matchingSummary,
        trackResults: trackResults
      });

      return {
        url: playlist.body.external_urls.spotify,
        results: trackResults,
        summary: matchingSummary
      };
    } catch (error) {
      console.error('[Spotify] Error in playlist creation:', error);
      throw new Error(`Failed to create Spotify playlist: ${error.message}`);
    }
  }
}

module.exports = SpotifyService;