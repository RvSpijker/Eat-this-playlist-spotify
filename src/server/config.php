<?php
$host = 'localhost';
$dbname = 'eatthisplaylist';
$username = 'eatthisplaylist';
$password = '!hl4Di2vKDW!uq';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
    exit();
}
?>