export const SPOTIFY_CLIENT_ID = "89b3ecad942e43fb8d6e9a492eefc8d9";
export const REDIRECT_URI = window.location.origin.includes('localhost') ? "http://localhost:5173/callback" : "https://rvspijker.nl/eatthisplaylist";
export const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-playback-position",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-modify-playback-state",
  "streaming"
];

export const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
export const RESPONSE_TYPE = "token";