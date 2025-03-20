<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

function getLeaderboard() {
    global $pdo;
    try {
        $stmt = $pdo->query('SELECT * FROM scores ORDER BY score DESC LIMIT 8');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
        return ['error' => $e->getMessage()];
    }
}

function addScore($username, $score) {
    global $pdo;
    try {
        $stmt = $pdo->prepare('INSERT INTO scores (username, score) VALUES (?, ?)');
        $stmt->execute([$username, $score]);
        return ['success' => true, 'message' => 'Score added successfully'];
    } catch(PDOException $e) {
        return ['error' => $e->getMessage()];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(getLeaderboard());
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (isset($data['username']) && isset($data['score'])) {
        echo json_encode(addScore($data['username'], $data['score']));
    } else {
        echo json_encode(['error' => 'Missing username or score']);
    }
}
?>