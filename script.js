// script.js
const JSON_URL = "https://raw.githubusercontent.com/louishermanpaelinck/bookmarklet-apps/refs/heads/main/Iframer/code.json";

async function loadGames() {
  try {
    const res = await fetch(JSON_URL);
    const games = await res.json();
    return games;
  } catch (e) {
    console.error("Failed to load games", e);
    return [];
  }
}

// Home Page - Grid
async function renderHome() {
  const games = await loadGames();
  const grid = document.getElementById('grid');
  if (!grid) return;

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'card glass';
    const gameName = game.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    card.innerHTML = `
      <a href="play.html?game=${encodeURIComponent(game.name)}">
        <img src="thumbnails/${gameName}.png" 
             onerror="this.src='https://via.placeholder.com/180x160/1a1a1a/00ff9d?text=${game.name}'" 
             alt="${game.name}">
        <h3>${game.name}</h3>
      </a>
    `;
    grid.appendChild(card);
  });
}

// Game Page - Load iframe + description
async function renderGame() {
  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');
  
  if (!gameName) {
    document.getElementById('game-title').textContent = "No game selected";
    return;
  }

  const games = await loadGames();
  const game = games.find(g => g.name === gameName);

  if (!game) {
    document.getElementById('game-title').textContent = "Game not found";
    return;
  }

  document.getElementById('game-title').textContent = game.name;
  document.getElementById('game-iframe').src = game.url;
  
  // You can add custom descriptions here if needed
  document.getElementById('description').innerHTML = `
    Playing <strong>${game.name}</strong><br><br>
    Enjoy this classic browser game!<br>
    <small>Full screen recommended (F11)</small>
  `;
}

// Auto run correct function
if (document.getElementById('grid')) {
  renderHome();
} else if (document.getElementById('game-iframe')) {
  renderGame();
}
