import { useEffect, useState } from 'react'
import './App.css'
import { AUTH_ENDPOINT, RESPONSE_TYPE, SPOTIFY_CLIENT_ID, SCOPES, REDIRECT_URI } from './config/spotify'
import PlaylistView from './components/PlaylistView'
import SnakeGame from './components/SnakeGame'
import Leaderboard from './components/Leaderboard'

interface Playlist {
  id: string
  name: string
  images: Array<{ url: string }>
  tracks: {
    items: Array<{ track: any }>
  }
}

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentTrack = async () => {
    if (!token) return

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.status === 204) {
        setError('No track currently playing')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch current track')
      }

      const data = await response.json()
      setCurrentTrack(data)
      setError(null)
    } catch (err) {
      setError('Error fetching current track')
      console.error(err)
    }
  }

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))?.split('=')[1]
      if (token) {
        setToken(token)
        window.location.hash = ''
      }
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchCurrentTrack()
      const interval = setInterval(fetchCurrentTrack, 5000)
      return () => clearInterval(interval)
    }
  }, [token])

  const loginUrl = `${AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join('%20')}`

  return (
    <div className="App">
      {!token ? (
        <div className="login-section">
          <a href={loginUrl} className="login-button">Login with Spotify</a>
          <p className="login-info">
            Note: Email must be whitelisted to use this version. 
            Try our <a href="https://rvspijker.nl/eatthisplaylistyt/" className="youtube-link">YouTube version</a> with no whitelist required!
          </p>
        </div>
      ) : (
        <div className="now-playing">
          {error ? (
            <p className="error">{error}</p>
          ) : currentTrack ? (
            <>
              <div className="content-wrapper" style={{ display: 'flex', gap: '20px' }}>
                <div className="left-content">
                  <div className="track-info">
                    <img 
                      src={currentTrack.item.album.images[0].url} 
                      alt={currentTrack.item.album.name}
                      className="album-cover"
                    />
                    <p style={{ color: 'white' }}>{currentTrack.item.name} - {currentTrack.item.artists[0].name}</p>
                  </div>
                  <PlaylistView token={token} onPlaylistChange={setCurrentPlaylist} currentPlaylist={currentPlaylist} />
                </div>
                <div className="right-content" style={{ display: 'flex', gap: '20px' }}>
                  <SnakeGame 
                    albumCoverUrl={currentTrack.item.album.images[0].url} 
                    playlist={currentPlaylist} 
                    token={token}
                    onFoodCollect={() => {
                      setTimeout(() => {
                        fetchCurrentTrack()
                      }, 500)
                    }}
                  />
                </div>
                  <Leaderboard />
              </div>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App
