const { google } = require('googleapis');
const youtube = google.youtube('v3');

class YouTubeService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    console.log('YouTube Service initialized');
  }

  async getPlaylistItems(playlistId) {
    try {
      console.log(`[YouTube] Fetching playlist items for ID: ${playlistId}`);
      const playlistItems = [];
      let nextPageToken = '';
      let totalItems = 0;

      do {
        console.log(`[YouTube] Fetching page${nextPageToken ? ` with token: ${nextPageToken}` : ''}`);
        const response = await youtube.playlistItems.list({
          key: this.apiKey,
          part: 'snippet',
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });

        const items = response.data.items;
        totalItems += items.length;
        console.log(`[YouTube] Retrieved ${items.length} items from current page`);
        
        items.forEach((item, index) => {
          console.log(`[YouTube] Item ${index + 1}:
            Title: ${item.snippet.title}
            Channel: ${item.snippet.videoOwnerChannelTitle || 'Unknown Artist'}
            Video ID: ${item.snippet.resourceId.videoId}`);
        });

        playlistItems.push(...items);
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      console.log(`[YouTube] Successfully fetched all ${totalItems} items from playlist`);

      const formattedItems = playlistItems.map(item => ({
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle || 'Unknown Artist',
        duration: null,
        originalId: item.snippet.resourceId.videoId
      }));

      console.log('[YouTube] Formatted playlist items:', JSON.stringify(formattedItems, null, 2));
      return formattedItems;
    } catch (error) {
      console.error('[YouTube] Error fetching playlist:', error);
      console.error('[YouTube] Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      throw new Error('Failed to fetch YouTube playlist');
    }
  }

  extractPlaylistId(url) {
    console.log('[YouTube] Extracting playlist ID from URL:', url);
    const regex = /[?&]list=([^&]+)/;
    const match = url.match(regex);
    if (!match) {
      console.error('[YouTube] Invalid playlist URL format');
      throw new Error('Invalid YouTube playlist URL');
    }
    console.log('[YouTube] Extracted playlist ID:', match[1]);
    return match[1];
  }
}

module.exports = YouTubeService;
