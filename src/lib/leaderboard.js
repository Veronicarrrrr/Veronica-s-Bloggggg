// Save a score for a game
export function saveScore(gameId, score) {
  const key = "gameLeaderboard";
  const data = JSON.parse(localStorage.getItem(key) || "{}");
  if (!data[gameId]) data[gameId] = [];
  data[gameId].push({
    score,
    date: new Date().toLocaleDateString("zh-CN"),
  });
  // Keep only top 10
  data[gameId].sort((a, b) => b.score - a.score);
  data[gameId] = data[gameId].slice(0, 10);
  localStorage.setItem(key, JSON.stringify(data));
}

// Get top scores for a game
export function getScores(gameId) {
  const data = JSON.parse(localStorage.getItem("gameLeaderboard") || "{}");
  return (data[gameId] || []).sort((a, b) => b.score - a.score).slice(0, 10);
}
