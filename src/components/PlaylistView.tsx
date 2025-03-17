import { useEffect, useState } from 'react'

interface Track {
  id: string
  name: string
  artists: Array<{ name: string }>
  duration_ms: number
  uri: string
}

interface Playlist {
  id: string
  name: string
  images: Array<{ url: string }>
  tracks: {
    items: Array<{ track: Track }>
  }
}

interface PlaylistViewProps {
  token: string
}

export default function PlaylistView({ token }: PlaylistViewProps) {
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrentPlaylist = async () => {
      try {
        // First get the currently playing context
        const playerResponse = await fetch('https://api.spotify.com/v1/me/player', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!playerResponse.ok) {
          throw new Error('Failed to fetch player state')
        }

        const playerData = await playerResponse.json()
        
        if (!playerData.context || playerData.context.type !== 'playlist') {
          setError('No playlist currently playing')
          return
        }

        const playlistId = playerData.context.uri.split(':').pop()
        
        // Then fetch the playlist details
        const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!playlistResponse.ok) {
          throw new Error('Failed to fetch playlist')
        }

        const playlistData = await playlistResponse.json()
        setCurrentPlaylist(playlistData)
        setError(null)
      } catch (err) {
        setError('Error fetching playlist information')
        console.error(err)
      }
    }

    if (token) {
      fetchCurrentPlaylist()
      const interval = setInterval(fetchCurrentPlaylist, 10000)
      return () => clearInterval(interval)
    }
  }, [token])

  if (error) {
    return <p className="error">{error}</p>
  }

  if (!currentPlaylist) {
    return <p>Loading playlist...</p>
  }

  return (
    <div className="playlist-view">
      <div className="playlist-header">
        {currentPlaylist.images[0] && (
          <img
            src={currentPlaylist.images[0].url}
            alt={currentPlaylist.name}
            className="playlist-cover"
          />
        )}
        <h2>{currentPlaylist.name}</h2>
      </div>
      <div className="track-list">
        {currentPlaylist.tracks.items.map(({ track }) => (
          <div key={track.id} className="track-item">
            <span className="track-name">{track.name}</span>
            <span className="track-artist">{track.artists[0].name}</span>
            <span className="track-duration">
              {Math.floor(track.duration_ms / 60000)}:
              {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}