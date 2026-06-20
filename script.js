function LoadStatcounter () {
  var sc_project=13299407; 
  var sc_invisible=0; 
  var sc_security="d0abe929"; 
  var scJsHost = "https://";
  document.write("<sc"+"ript type='text/javascript' src='" +
                 scJsHost+
                 "statcounter.com/counter/counter.js'></"+"script>");
}

// =======================
// SUPER SIMPLE VERSION
// =======================

let allGames = []; // ✅ Altijd array
let searchQuery = '';

// =======================
// LOAD GAMES (Altijd werkt!)
// =======================
async function loadGames() {
  try {
    const response = await fetch('games.json');
    allGames = await response.json();
    
    // ✅ ZORG DAT HET EEN ARRAY IS!
    if (!Array.isArray(allGames)) {
      allGames = [];
    }
    
    return allGames;
  } catch (error) {
    console.error('Error loading games:', error);
    allGames = []; // ✅ Altijd array
    return [];
  }
}

// =======================
// FAVORITES
// =======================
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('playyyy-favorites') || '[]');
  } catch {
    return [];
  }
}

function isFavorite(name) {
  if (!name) return false;
  return getFavorites().includes(name);
}

function toggleFavorite(name) {
  if (!name) return;
  
  const favorites = getFavorites();
  const index = favorites.indexOf(name);
  
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(name);
  }
  
  localStorage.setItem('playyyy-favorites', JSON.stringify(favorites));
  
  // Update UI
  if (document.getElementById('grid')) renderHome();
  updateGameFavoriteButton();
}

// =======================
// THUMBNAILS
// =======================
function normalizeName(name) {
  if (!name) return '';
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getThumbnailCandidates(name) {
  const base = normalizeName(name);
  return [
    `images/thumbnails/${base}.jpg`,
    `images/thumbnails/${base}.jpeg`,
    `images/thumbnails/${base}.png`,
  ];
}

function applyThumbnailFallback(img, candidates, index = 0) {
  if (!img) return;
  if (index >= candidates.length) {
    img.src = 'images/thumbnails/placeholder.jpg';
    return;
  }
  img.onerror = () => applyThumbnailFallback(img, candidates, index + 1);
  img.src = candidates[index];
}

// =======================
// CREATE GAME CARD
// =======================
function createGameCard(game) {
  if (!game || !game.name) {
    return document.createElement('div');
  }

  const card = document.createElement('div');
  card.className = 'card glass';

  const link = document.createElement('a');
  link.href = `play.html?game=${encodeURIComponent(game.name)}`;

  const thumbnail = document.createElement('img');
  thumbnail.alt = game.name;
  thumbnail.loading = 'lazy';

  const candidates = getThumbnailCandidates(game.name);
  applyThumbnailFallback(thumbnail, candidates);

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'card-title-container';

  const titleLink = document.createElement('a');
  titleLink.href = `play.html?game=${encodeURIComponent(game.name)}`;
  titleLink.textContent = game.name;
  titleLink.className = 'card-title-link';

  titleContainer.appendChild(titleLink);

  if (game.tag) {
    const tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = game.tag;
    titleContainer.appendChild(tag);
  }

  const favoriteBtn = document.createElement('button');
  favoriteBtn.type = 'button';
  favoriteBtn.className = `favorite-btn ${isFavorite(game.name) ? 'active' : ''}`;
  favoriteBtn.textContent = isFavorite(game.name) ? '★' : '☆';
  favoriteBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(game.name);
  };

  footer.appendChild(titleContainer);
  footer.appendChild(favoriteBtn);

  link.appendChild(thumbnail);
  card.appendChild(link);
  card.appendChild(footer);

  return card;
}

// =======================
// RENDER GAMES
// =======================
function renderGameGrid(container, games) {
  if (!container) return;

  container.innerHTML = '';

  if (!games || games.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No games found.';
    container.appendChild(empty);
    return;
  }

  games.forEach(game => {
    if (game) {
      container.appendChild(createGameCard(game));
    }
  });
}

// =======================
// RENDER HOME
// =======================
async function renderHome() {
  const grid = document.getElementById('grid');
  const favoritesGrid = document.getElementById('favorites-grid');

  if (!grid && !favoritesGrid) return;

  // ✅ ZORG DAT GAMES GELADEN ZIJN
  if (allGames.length === 0) {
    await loadGames();
  }

  // ✅ Filter games
  const query = (searchQuery || '').toLowerCase().trim();
  const filteredGames = query
    ? allGames.filter(g => g && g.name && g.name.toLowerCase().includes(query))
    : allGames;

  const favoriteGames = filteredGames.filter(g => g && isFavorite(g.name));
  const otherGames = filteredGames.filter(g => g && !isFavorite(g.name));

  renderGameGrid(favoritesGrid, favoriteGames);
  renderGameGrid(grid, otherGames);
}

// =======================
// RENDER GAME PAGE
// =======================
async function renderGame() {
  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');
  const decodedName = gameName ? decodeURIComponent(gameName) : null;

  const titleEl = document.getElementById('game-title');
  if (titleEl) {
    titleEl.textContent = decodedName || 'No game selected';
  }

  if (!decodedName) return;

  // Set favicon
  const safeName = normalizeName(decodedName);
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = `./games/${safeName}/favicon.png`;

  // ✅ ZORG DAT GAMES GELADEN ZIJN
  if (allGames.length === 0) {
    await loadGames();
  }

  const game = allGames.find(g => g && g.name === decodedName);
  if (!game) {
    if (titleEl) titleEl.textContent = 'Game not found';
    return;
  }

  if (titleEl) titleEl.textContent = game.name;

  const iframe = document.getElementById('game-iframe');
  if (iframe) {
    iframe.src = game.url;
  }

  const description = document.getElementById('description');
  if (description) {
    description.innerHTML = `
      <div class="game-meta">
        <div>
          Enjoy playing <strong>${game.name}</strong>!<br>
          <small>Full screen recommended (F11)</small>
        </div>
        <button id="game-favorite-btn" class="favorite-btn favorite-btn-large ${isFavorite(game.name) ? 'active' : ''}" type="button">
          ${isFavorite(game.name) ? '★ Favorite' : '☆ Add to favorites'}
        </button>
      </div>
    `;

    const favBtn = document.getElementById('game-favorite-btn');
    if (favBtn) {
      favBtn.onclick = () => {
        toggleFavorite(game.name);
        favBtn.textContent = isFavorite(game.name) ? '★ Favorite' : '☆ Add to favorites';
        favBtn.className = `favorite-btn favorite-btn-large ${isFavorite(game.name) ? 'active' : ''}`;
      };
    }
  }
}

function updateGameFavoriteButton() {
  const gameBtn = document.getElementById('game-favorite-btn');
  if (!gameBtn) return;

  const params = new URLSearchParams(window.location.search);
  const gameName = params.get('game');
  if (!gameName) return;

  const decodedName = decodeURIComponent(gameName);
  gameBtn.textContent = isFavorite(decodedName) ? '★ Favorite' : '☆ Add to favorites';
  gameBtn.className = `favorite-btn favorite-btn-large ${isFavorite(decodedName) ? 'active' : ''}`;
}

// =======================
// COOKIES (voor intro)
// =======================
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
}

function getCookie(name) {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function finishIntro() {
  const intro = document.getElementById('intro');
  if (intro) {
    intro.classList.add('fadeout');
    setTimeout(() => {
      intro.style.display = 'none';
      setCookie('playyyy_intro', '1', 30);
    }, 800);
  }
}

// =======================
// INIT
// =======================
document.addEventListener('DOMContentLoaded', async () => {
  const hasSeenIntro = getCookie('playyyy_intro') === '1';

  // Intro animatie
  if (!hasSeenIntro) {
    let progress = 0;
    const duration = 1500;
    const start = performance.now();

    function animate() {
      const t = Math.min(1, (performance.now() - start) / duration);
      progress = Math.floor(t * 100);

      const fill = document.getElementById('fill');
      const status = document.getElementById('status');

      if (fill) fill.style.width = progress + '%';
      if (status) {
        if (progress < 30) status.textContent = 'Loading games...';
        else if (progress < 90) status.textContent = 'Almost ready...';
        else status.textContent = 'Ready!';
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        finishIntro();
      }
    }
    requestAnimationFrame(animate);
  } else {
    const loader = document.getElementById('loader');
    const status = document.getElementById('status');
    if (loader) loader.style.display = 'none';
    if (status) status.style.display = 'none';
    setTimeout(finishIntro, 500);
  }

  // ✅ LAAD GAMES EN RENDER DIRECT
  await loadGames();
  
  if (document.getElementById('grid')) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderHome();
      });
    }
    renderHome();
  } else if (document.getElementById('game-iframe')) {
    renderGame();
  }
});
