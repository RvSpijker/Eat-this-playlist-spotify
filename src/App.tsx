import { useEffect, useState } from 'react'
import './App.css'
import { AUTH_ENDPOINT, RESPONSE_TYPE, SPOTIFY_CLIENT_ID, SCOPES, REDIRECT_URI } from './config/spotify'
import PlaylistView from './components/PlaylistView'
import SnakeGame from './components/SnakeGame'

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

    if (token) {
      fetchCurrentTrack()
      const interval = setInterval(fetchCurrentTrack, 5000)
      return () => clearInterval(interval)
    }
  }, [token])

  const loginUrl = `${AUTH_ENDPOINT}?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join('%20')}`

  return (
    <div className="App">
      <h1>Spotify Now Playing</h1>
      {!token ? (
        <a href={loginUrl} className="login-button">Login with Spotify</a>
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
                    <p>{currentTrack.item.name} - {currentTrack.item.artists[0].name}</p>
                  </div>
                  <PlaylistView token={token} onPlaylistChange={setCurrentPlaylist} currentPlaylist={currentPlaylist} />
                </div>
                <div className="right-content">
                  <SnakeGame albumCoverUrl={currentTrack.item.album.images[0].url} playlist={currentPlaylist} token={token} />
                </div>
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
