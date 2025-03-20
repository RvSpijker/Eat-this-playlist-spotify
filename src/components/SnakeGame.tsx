import { useEffect, useRef, useState } from 'react'
import { getAverageColor } from '../utils/colorUtils'

interface SnakeSegment {
  x: number
  y: number
  albumCover: string
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
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
          duration_ms: number
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
  trackLenght: number
}

export default function SnakeGame({ albumCoverUrl, token, playlist }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameBoardRef = useRef<HTMLDivElement>(null)
  const [snake, setSnake] = useState<SnakeSegment[]>([{ x: 10, y: 10, albumCover: albumCoverUrl, direction: 'RIGHT' }])
  const [food, setFood] = useState<FoodPosition>({ x: 5, y: 5, trackLenght: 0 })
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT')
  const [, setDirectionQueue] = useState<Array<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>>([])
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [currentFoodImage, setCurrentFoodImage] = useState(albumCoverUrl)
  const [backgroundColor, setBackgroundColor] = useState('rgb(40, 40, 40)')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null)

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

  const handleSubmitScore = async () => {
    if (token) {
      try {
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        const username = data.display_name || data.id

        await fetch('https://rvspijker.nl/server/leaderboard.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username,
            score,
          }),
        })
        setSubmitStatus('success')
      } catch (error) {
        console.error('Failed to submit score:', error)
        setSubmitStatus('error')
      }
    }
  }

  // Handle keyboard controls with input queue
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      let newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null
      
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          newDirection = 'UP'
          break
        case 'arrowdown':
        case 's':
          newDirection = 'DOWN'
          break
        case 'arrowleft':
        case 'a':
          newDirection = 'LEFT'
          break
        case 'arrowright':
        case 'd':
          newDirection = 'RIGHT'
          break
      }

      if (newDirection) {
        // Prevent opposite directions in the queue
        const isOpposite = (dir1: string, dir2: string) => {
          return (dir1 === 'UP' && dir2 === 'DOWN') ||
                 (dir1 === 'DOWN' && dir2 === 'UP') ||
                 (dir1 === 'LEFT' && dir2 === 'RIGHT') ||
                 (dir1 === 'RIGHT' && dir2 === 'LEFT')
        }

        setDirectionQueue(prevQueue => {
          // If the new direction is opposite to the current direction, ignore it
          if (isOpposite(newDirection!, direction)) {
            return prevQueue
          }
          
          // If the queue is empty or the new direction is different from the last queued direction
          if (prevQueue.length === 0 || prevQueue[prevQueue.length - 1] !== newDirection) {
            // Limit queue size to 2 to prevent long queues
            return [...prevQueue.slice(-1), newDirection!]
          }
          return prevQueue
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction])

  // Handle touch controls for mobile
  useEffect(() => {
    if (!gameBoardRef.current || gameOver) return
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY
      })
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return
      
      // Prevent scrolling when swiping
      e.preventDefault()
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return
      
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      
      // Determine swipe direction based on which delta is larger
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 30) {
          // Right swipe
          addDirectionToQueue('RIGHT')
        } else if (deltaX < -30) {
          // Left swipe
          addDirectionToQueue('LEFT')
        }
      } else {
        // Vertical swipe
        if (deltaY > 30) {
          // Down swipe
          addDirectionToQueue('DOWN')
        } else if (deltaY < -30) {
          // Up swipe
          addDirectionToQueue('UP')
        }
      }
      
      setTouchStart(null)
    }
    
    const addDirectionToQueue = (newDirection: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
      // Prevent opposite directions in the queue
      const isOpposite = (dir1: string, dir2: string) => {
        return (dir1 === 'UP' && dir2 === 'DOWN') ||
               (dir1 === 'DOWN' && dir2 === 'UP') ||
               (dir1 === 'LEFT' && dir2 === 'RIGHT') ||
               (dir1 === 'RIGHT' && dir2 === 'LEFT')
      }

      setDirectionQueue(prevQueue => {
        // If the new direction is opposite to the current direction, ignore it
        if (isOpposite(newDirection, direction)) {
          return prevQueue
        }
        
        // If the queue is empty or the new direction is different from the last queued direction
        if (prevQueue.length === 0 || prevQueue[prevQueue.length - 1] !== newDirection) {
          // Limit queue size to 2 to prevent long queues
          return [...prevQueue.slice(-1), newDirection]
        }
        return prevQueue
      })
    }
    
    const gameBoard = gameBoardRef.current
    gameBoard.addEventListener('touchstart', handleTouchStart)
    gameBoard.addEventListener('touchmove', handleTouchMove, { passive: false })
    gameBoard.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      gameBoard.removeEventListener('touchstart', handleTouchStart)
      gameBoard.removeEventListener('touchmove', handleTouchMove)
      gameBoard.removeEventListener('touchend', handleTouchEnd)
    }
  }, [direction, touchStart, gameOver])

  // Game loop with input queue processing
  useEffect(() => {
    if (gameOver) return

    const moveSnake = () => {
      setSnake(prevSnake => {
        const newSnake = [...prevSnake]
        const head = { ...newSnake[0] }

        // Process the direction queue
        setDirectionQueue(prevQueue => {
          if (prevQueue.length > 0) {
            const nextDirection = prevQueue[0]
            // Only change direction if it's not opposite to current direction
            if (!((nextDirection === 'UP' && direction === 'DOWN') ||
                  (nextDirection === 'DOWN' && direction === 'UP') ||
                  (nextDirection === 'LEFT' && direction === 'RIGHT') ||
                  (nextDirection === 'RIGHT' && direction === 'LEFT'))) {
              setDirection(nextDirection)
            }
            return prevQueue.slice(1)
          }
          return prevQueue
        })

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
          setSubmitStatus('idle')
          return prevSnake
        }

        // Check self collision
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true)
          setSubmitStatus('idle')
          return prevSnake
        }

        // Move each segment to follow the one in front of it, preserving album covers
        for (let i = newSnake.length - 1; i > 0; i--) {
          newSnake[i] = { 
            x: newSnake[i - 1].x,
            y: newSnake[i - 1].y,
            albumCover: newSnake[i].albumCover,
            direction: newSnake[i - 1].direction
          }
        }
        
        // Update head position and keep its album cover
        head.albumCover = newSnake[0].albumCover
        head.direction = direction
        newSnake[0] = head

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 1)
          // Get color from eaten album cover and update background
          getAverageColor(currentFoodImage).then(color => {
            setBackgroundColor(color)
          })

          // Add new segment at the end with the head's album cover
          newSnake.push({ 
            x: newSnake[newSnake.length - 1].x,
            y: newSnake[newSnake.length - 1].y,
            albumCover: head.albumCover,
            direction: newSnake[newSnake.length - 1].direction
          })
          // Update head with food's album cover
          head.albumCover = currentFoodImage
          const newFood = {
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20),
            trackLenght: 0
          }
          setFood(newFood)
          
          // Set random track's album cover as food image
          if (playlist?.tracks.items.length) {
            const randomTrackIndex = Math.floor(Math.random() * playlist.tracks.items.length)
            const randomTrack = playlist.tracks.items[randomTrackIndex].track
            setCurrentFoodImage(randomTrack.album.images[0].url)

            setFood(prev => ({ ...prev, trackUri: randomTrack.uri, trackLenght: randomTrack.duration_ms }))
          }
          
          // Play the collected track
          if (token && food.trackUri) {
            const randomTrackStart = Math.floor(Math.random() * (food.trackLenght - 30000))
            fetch('https://api.spotify.com/v1/me/player/play', {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                uris: [food.trackUri],
                position_ms: randomTrackStart
              })
            }).catch(console.error)
          }
        }

        return newSnake
      })
    }

    const gameLoop = setInterval(moveSnake, 100)
    return () => clearInterval(gameLoop)
  }, [direction, food, gameOver])

  // Calculate rotation for snake head
  const getRotation = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    switch (dir) {
      case 'UP': return '270deg'
      case 'DOWN': return '90deg'
      case 'LEFT': return '180deg'
      case 'RIGHT': return '0deg'
    }
  }

  return (
    <div className="snake-game">
      <div 
        ref={gameBoardRef}
        className="game-board"
        style={{
          width: '400px',
          height: '400px',
          border: '2px solid #1DB954',
          position: 'relative',
          backgroundColor,
          transition: 'background-color 0.5s ease'
        }}
      >
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`snake-segment ${index === 0 ? 'snake-head' : ''}`}
            style={{
              width: '18px',
              height: '18px',
              position: 'absolute',
              left: `${segment.x * 20}px`,
              top: `${segment.y * 20}px`,
              backgroundImage: `url(${segment.albumCover})`,
              backgroundSize: 'cover',
              transform: `rotate(${getRotation(segment.direction)})`,
              transition: 'all 0.2s ease'
            }}
          />
        ))}
        <div
          className="food"
          style={{
            width: '20px',
            height: '20px',
            position: 'absolute',
            left: `${food.x * 20}px`,
            top: `${food.y * 20}px`,
            backgroundImage: `url(${currentFoodImage})`,
            backgroundSize: 'cover',
            transition: 'all 0.1s ease'
          }}
        />
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-content">
              <h2 className="game-over-text">Game Over!</h2>
              <button
                className="play-again-button"
                onClick={() => {
                  setSnake([{ x: 10, y: 10, albumCover: albumCoverUrl, direction: 'RIGHT' }])
                  setDirection('RIGHT')
                  setScore(0)
                  setGameOver(false)
                  setBackgroundColor('rgb(40, 40, 40)')
                  setSubmitStatus('idle')
                }}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="game-info">
        <p>Score: {score}</p>
        {gameOver && token && submitStatus === 'idle' && (
          <button className="submit-score-button" onClick={handleSubmitScore}>
            Submit Score
          </button>
        )}
        {gameOver && submitStatus === 'success' && (
          <p className="submit-message success">Score submitted successfully!</p>
        )}
        {gameOver && submitStatus === 'error' && (
          <p className="submit-message error">Failed to submit score. Please try again.</p>
        )}
      </div>
      <style>{`
        .snake-segment {
          border-radius: 2px;
        }
        .snake-head {
          border-radius: 4px;
          z-index: 2;
        }
        .food {
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .game-over-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }
        .game-over-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .game-over-text {
          color: white;
          font-size: 48px;
          font-weight: bold;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          animation: fadeIn 0.5s ease;
        }
        .play-again-button {
          padding: 15px 30px;
          font-size: 18px;
          background: #1db954;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s ease;
          animation: fadeIn 0.5s ease 0.2s backwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .play-again-button:hover {
          background: #1ed760;
          transform: scale(1.05);
        }
        .game-info {
          margin-top: 20px;
          text-align: center;
        }
        .submit-score-button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #1db954;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s ease;
        }
        .submit-score-button:hover {
          background: #1ed760;
          transform: scale(1.05);
        }
        .submit-message {
          margin-top: 10px;
          font-weight: bold;
          animation: fadeIn 0.5s ease;
        }
        .submit-message.success {
          color: #1db954;
        }
        .submit-message.error {
          color: #ff4444;
        }
      `}</style>
    </div>
  )
}