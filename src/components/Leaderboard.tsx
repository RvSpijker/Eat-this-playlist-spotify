import { useState, useEffect } from 'react';
import styles from './Leaderboard.module.css';

interface Score {
  username: string;
  score: number;
}

export default function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('https://rvspijker.nl/server/leaderboard.php');
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setScores(data);
      }
    } catch (err) {
      setError('Failed to fetch leaderboard');
    }
  };

  return (
    <div className={styles.leaderboard}>
      <h3>Leaderboard</h3>
      {error && <p className={styles.error}>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{score.username}</td>
              <td>{score.score}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* <form onSubmit={handleSubmit}>
        <h3>Add Score</h3>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Score"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
          />
        </div>
        <button type="submit">Submit Score</button>
      </form> */}
    </div>
  );
}