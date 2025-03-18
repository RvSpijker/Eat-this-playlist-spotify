import { useEffect, useRef, useState } from 'react'

interface SnakeSegment {
  x: number
  y: number
  albumCover: string
}

interface SnakeGameProps {
  albumCoverUrl: string
  token?: string
  playlist?: {
    id: string
    name: string
    images: Array<{ url: string }>
    tracks: {
      items: Array<{
        track: {
          id: string
          uri: string
          album: {
            images: Array<{ url: string }>
          }
        }
      }>
    }
  } | null
}

interface Position {
  x: number
  y: number
}

interface FoodPosition extends Position {
  trackUri?: string
}

export default function SnakeGame({ albumCoverUrl, token, playlist }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<SnakeSegment[]>([{ x: 10, y: 10, albumCover: albumCoverUrl }])
  const [food, setFood] = useState<FoodPosition>({ x: 5, y: 5 })
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [currentFoodImage, setCurrentFoodImage] = useState(albumCoverUrl)

  // Load album cover image
  useEffect(() => {
    const img = new Image()
    img.src = albumCoverUrl
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, food.x * 20, food.y * 20, 20, 20)
        }
      }
    }
  }, [albumCoverUrl, food])

  // Game loop
  useEffect(() => {
    if (gameOver) return

    const moveSnake = () => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake]
        const head = { ...newSnake[0] }

        switch (direction) {
          case 'UP':
            head.y -= 1
            break
          case 'DOWN':
            head.y += 1
            break
          case 'LEFT':
            head.x -= 1
            break
          case 'RIGHT':
            head.x += 1
            break
        }

        // Check wall collision
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
          setGameOver(true)
          return prevSnake
        }

        // Check self collision
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true)
          return prevSnake
        }

        // Move each segment to follow the one in front of it, preserving album covers
        for (let i = newSnake.length - 1; i > 0; i--) {
          newSnake[i] = { 
            x: newSnake[i - 1].x,
            y: newSnake[i - 1].y,
            albumCover: newSnake[i].albumCover
          }
        }
        
        // Update head position and keep its album cover
        head.albumCover = newSnake[0].albumCover
        newSnake[0] = head

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 1)
          // Add new segment at the end with the head's album cover
          newSnake.push({ 
            x: newSnake[newSnake.length - 1].x,
            y: newSnake[newSnake.length - 1].y,
            albumCover: head.albumCover
          })
          // Update head with food's album cover
          head.albumCover = currentFoodImage
          const newFood = {
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20)
          }
          setFood(newFood)
          
          // Set random track's album cover as food image
          if (playlist?.tracks.items.length) {
            const randomTrackIndex = Math.floor(Math.random() * playlist.tracks.items.length)
            const randomTrack = playlist.tracks.items[randomTrackIndex].track
            setCurrentFoodImage(randomTrack.album.images[0].url)

            setFood(prev => ({ ...prev, trackUri: randomTrack.uri }))
          }
          
          // Play the collected track
          if (token && food.trackUri) {
            fetch('https://api.spotify.com/v1/me/player/play', {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                uris: [food.trackUri]
              })
            }).catch(console.error)
          }
        }

        return newSnake
      })
    }

    const gameLoop = setInterval(moveSnake, 200)
    return () => clearInterval(gameLoop)
  }, [direction, food, gameOver])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (direction !== 'DOWN') setDirection('UP')
          break
        case 'arrowdown':
        case 's':
          if (direction !== 'UP') setDirection('DOWN')
          break
        case 'arrowleft':
        case 'a':
          if (direction !== 'RIGHT') setDirection('LEFT')
          break
        case 'arrowright':
        case 'd':
          if (direction !== 'LEFT') setDirection('RIGHT')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction])

  // Draw game
  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#282828'
    ctx.fillRect(0, 0, 400, 400)

    // Draw snake segments with their respective album covers
    snake.forEach(({ x, y, albumCover }) => {
      const img = new Image()
      img.src = albumCover
      ctx.drawImage(img, x * 20, y * 20, 18, 18)
    })

    // Draw food (album cover)
    const img = new Image()
    img.src = currentFoodImage
    ctx.drawImage(img, food.x * 20, food.y * 20, 20, 20)
  }, [snake, food, albumCoverUrl])

  return (
    <div className="snake-game">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{ border: '2px solid #1DB954' }}
      />
      <div className="game-info">
        <p>Score: {score}</p>
        {gameOver && (
          <button
            onClick={() => {
              setSnake([{ x: 10, y: 10, albumCover: albumCoverUrl }])
              setDirection('RIGHT')
              setScore(0)
              setGameOver(false)
            }}
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  )
}