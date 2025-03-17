import { useEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface SnakeGameProps {
  albumCoverUrl: string
}

export default function SnakeGame({ albumCoverUrl }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 5, y: 5 })
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)

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

        newSnake.unshift(head)

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 1)
          setFood({
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20)
          })
        } else {
          newSnake.pop()
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
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP')
          break
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN')
          break
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT')
          break
        case 'ArrowRight':
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

    // Draw snake
    ctx.fillStyle = '#1DB954'
    snake.forEach(({ x, y }) => {
      ctx.fillRect(x * 20, y * 20, 18, 18)
    })

    // Draw food (album cover)
    const img = new Image()
    img.src = albumCoverUrl
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
              setSnake([{ x: 10, y: 10 }])
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