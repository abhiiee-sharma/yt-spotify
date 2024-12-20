import React, { useState, useEffect } from 'react';
import './App.css';
import config from './config';

function App() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
    
    // Check for callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('accessToken')) {
      const userData = {
        accessToken: params.get('accessToken'),
        refreshToken: params.get('refreshToken'),
        userId: params.get('userId'),
        displayName: params.get('displayName'),
      };
      setUser(userData);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isDarkMode]);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/login`);
      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      setError('Failed to initiate Spotify login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login with Spotify first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!playlistUrl.trim() || !playlistName.trim()) {
        throw new Error('Please enter a playlist URL and name');
      }

      const response = await fetch(`${config.apiUrl}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: playlistUrl,
          name: playlistName,
          accessToken: user.accessToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert playlist');
      }

      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="App-header">
        <div className="logo-container">
          <div className="brand">
            <span className="brand-text">Playlist</span>
            <span className="brand-text">Converter</span>
          </div>
          <span className="version">v1.0</span>
        </div>
        <div className="theme-toggle">
          <button onClick={toggleTheme} className="icon-button">
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          {!user ? (
            <button onClick={handleLogin} className="login-button">
              Login with Spotify
            </button>
          ) : (
            <span className="user-name">Welcome, {user.displayName}</span>
          )}
        </div>
      </header>
      <main>
        {!user && (
          <div className="validation-message-container">
            <div className="validation-message">
              ⚠️   Please login with your Spotify account to start converting playlists. We have implemented secure login in process and it is required for playlist creation.
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="converter-form">
          <div className="input-group">
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="Enter Spotify playlist URL"
              className="playlist-input"
              disabled={!user}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="playlist-input"
              disabled={!user}
              required
            />
          </div>
          <div className="input-group">
            <button
              type="submit"
              className="convert-button"
              disabled={!user || isLoading || !playlistName.trim() || !playlistUrl.trim()}
            >
              {isLoading ? 'Converting...' : 'Convert'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
          {result && (
            <div className="result-container">
              <p>Successfully converted {result.summary.matched} out of {result.summary.total} songs</p>
              <a href={result.playlistUrl} 
                 className="result-link" 
                 target="_blank" 
                 rel="noopener noreferrer">
                Open in {result.platform === 'spotify' ? 'Spotify' : 'YouTube'}
              </a>

              <div className="songs-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>YouTube Title</th>
                      <th>YouTube Artist</th>
                      <th>Status</th>
                      <th>Spotify Title</th>
                      <th>Spotify Artist</th>
                      <th>Match Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.tracks.map((track, index) => (
                      <tr key={index} className={track.matched ? 'matched' : 'unmatched'}>
                        <td>{index + 1}</td>
                        <td>{track.youtube.title}</td>
                        <td>{track.youtube.artist}</td>
                        <td>
                          <span className={`status-badge ${track.matched ? 'success' : 'error'}`}>
                            {track.matched ? 'Found' : 'Not Found'}
                          </span>
                        </td>
                        <td>{track.matched ? track.spotify.title : '-'}</td>
                        <td>{track.matched ? track.spotify.artist : '-'}</td>
                        <td>
                          {track.matched ? 
                            <span className="match-score">
                              {(track.spotify.matchScore * 100).toFixed(1)}%
                            </span>
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>
      </main>
      <footer className="footer">
        <p>Made with ❤️ by Abhishek Sharma</p>
      </footer>
    </div>
  );
}

export default App;
