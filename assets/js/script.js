function loadStatcounter() {
  if (window.sc_project) return;

  window.sc_project = 13299407;
  window.sc_invisible = 1;
  window.sc_security = 'd0abe929';

  const script = document.createElement('script');
  script.src = 'https://www.statcounter.com/counter/counter.js';
  script.async = true;
  script.onerror = () => console.error('Could not load StatCounter tracking script.');
  document.head.appendChild(script);
}

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const installButton = document.getElementById('install-app-btn');
  if (installButton) installButton.hidden = true;
});
// =======================
// SUPER SIMPLE VERSION
// =======================

let allGames = []; // ✅ Altijd array
let searchQuery = '';
let selectedCategory = 'all';

const CATEGORY_GAME_NAMES = {
  Action: ['1v1.LOL', '10 Minutes Till Dawn', 'Age of War', "Baldi's Basics", 'Battle Beavers', 'Choose Your Weapon', 'Electric Man 2', 'FNAF', 'Gun Mayhem', 'Happy Wheels', 'Knife Hit', 'Raft Wars', 'Skibidi', 'Stick War', 'Superhot', 'The Binding of Isaac', 'Zombocalypse', 'Zombotron'],
  Racing: ['Aquapark Slides', 'Crazy Tunnel 3D', 'Drift Hunters', 'Drive Mad', 'escape road', 'HexGL', 'Monster Tracks', 'Moto X3M', 'PolyTrack', 'Slope', 'Subway Surfers', 'Tanuki Sunset', 'Tunnel Rush'],
  Puzzle: ['2048', 'Astray', 'Bad Ice Cream', 'Bad Piggies', 'Bloxors', 'Chess', 'Color Switch', 'Cut the Rope', 'Factory Balls', 'Hextris', 'Infinite Craft', 'Minesweeper', 'Portal', 'Tetris', 'The Impossible Quiz', 'There Is No Game', 'This is the Only Level', 'Unfair Mario', 'Watermelon Game', 'We Become What We Behold', 'Wordle', "World's Hardest Game"],
  Idle: ['BitLife', 'Clicker Heroes', 'Cookie Clicker', 'Corporation Inc', "Papa's Freezeria", 'Sort the Court', 'Stack', 'Tiny Fishing', 'Townscaper'],
  '.io': ['Hole.io', 'Paper.io 2', 'Territorial.io', 'Yohoho.io'],
  Platformer: ['Achievement Unlocked', 'Appel', 'Cactus McCoy', 'Celeste', 'Dadish', 'Dino Bros', 'Doodle Jump', 'Fancy Pants Adventure', 'Fireboy and Watergirl', 'Flappy Bird', 'Geometry Dash', 'Gobble', 'Helix Jump', 'Learn to Fly', 'Level Devil', 'OVO', 'Red Ball 4', 'Roper', 'Run', 'Run 2', 'Run 3', 'Shift', 'Space Waves', 'Stickman Hook', 'Vex'],
  Sports: ['1 on 1 Soccer', 'Basket Bros', 'Champion Island', 'Crossy Road', 'Retro Bowl'],
  Strategy: ['Bloons TD', 'Pandemic 2', 'Stick War', 'Totally Accurate Battle Simulator'],
  Adventure: ['Among Us', 'Duck Life', 'Fruit Ninja', 'Jetpack Joyride']
};

function getGameCategory(game) {
  if (game.category) return game.category;
  return Object.entries(CATEGORY_GAME_NAMES).find(([, names]) => names.includes(game.name))?.[0] || 'Other';
}

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
  if (name === 'Appel') {
    return [
      'games/appel/assets/5ca72b0c06b2764b850d4a40848e9fb1.png',
      `assets/images/thumbnails/${base}.jpg`,
      `assets/images/thumbnails/${base}.jpeg`,
      `assets/images/thumbnails/${base}.png`,
    ];
  }
  return [
    `assets/images/thumbnails/${base}.jpg`,
    `assets/images/thumbnails/${base}.jpeg`,
    `assets/images/thumbnails/${base}.png`,
  ];
}

function applyThumbnailFallback(img, candidates, index = 0) {
  if (!img) return;
  if (index >= candidates.length) {
    img.src = 'assets/images/thumbnails/placeholder.jpg';
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
  card.tabIndex = 0;
  card.setAttribute('aria-label', game.name);

  const link = document.createElement('a');
  link.href = `play.html?game=${encodeURIComponent(game.name)}`;

  const thumbnail = document.createElement('img');
  thumbnail.alt = game.name;
  thumbnail.loading = 'lazy';
  thumbnail.decoding = 'async';

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

  const reportLink = document.createElement('a');
  reportLink.href = reportIssueUrl(game.name);
  reportLink.target = '_blank';
  reportLink.rel = 'noopener noreferrer';
  reportLink.className = 'report-link';
  reportLink.textContent = 'Report';
  reportLink.setAttribute('aria-label', `Report ${game.name} as broken`);

  footer.appendChild(titleContainer);
  footer.appendChild(reportLink);
  footer.appendChild(favoriteBtn);

  link.appendChild(thumbnail);
  card.appendChild(link);
  card.appendChild(footer);

  return card;
}

// =======================
// RENDER GAMES
// =======================
function renderGameGrid(container, games, emptyMessage, emptySuggestion) {
  if (!container) return;

  container.innerHTML = '';

  if (!games || games.length === 0) {
    if (!emptyMessage) return;
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage;
    if (emptySuggestion) {
      const suggestion = document.createElement('span');
      suggestion.textContent = emptySuggestion;
      empty.appendChild(suggestion);
    }
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
  const recentGrid = document.getElementById('recent-grid');
  const recentSection = document.getElementById('recent-section');
  const favoritesSection = document.querySelector('.favorites-section');

  if (!grid && !favoritesGrid) return;

  // ✅ ZORG DAT GAMES GELADEN ZIJN
  if (allGames.length === 0) {
    await loadGames();
  }

  // ✅ Filter games
  const query = (searchQuery || '').toLowerCase().trim();
  const matchingGames = query
    ? allGames.filter(g => g && g.name && g.name.toLowerCase().includes(query))
    : allGames;
  const filteredGames = selectedCategory === 'all'
    ? matchingGames
    : matchingGames.filter(game => getGameCategory(game) === selectedCategory);

  const favoriteGames = filteredGames.filter(g => g && isFavorite(g.name));
  const otherGames = filteredGames.filter(g => g && !isFavorite(g.name));
  const hasActiveFilters = Boolean(query) || selectedCategory !== 'all';

  if (favoritesSection) favoritesSection.hidden = filteredGames.length === 0 || (hasActiveFilters && favoriteGames.length === 0);
  renderGameGrid(favoritesGrid, favoriteGames, 'No favorites yet.', 'Tap a star on any game to save it here.');
  renderGameGrid(
    grid,
    otherGames,
    filteredGames.length === 0 ? 'No games match these filters.' : 'All matching games are in your favorites.',
    filteredGames.length === 0 ? 'Try another search or choose a different category.' : ''
  );

  const recentGames = getRecentlyPlayed()
    .map(name => allGames.find(game => game && game.name === name))
    .filter(game => game && (!query || game.name.toLowerCase().includes(query)))
    .filter(game => selectedCategory === 'all' || getGameCategory(game) === selectedCategory);
  if (recentSection) recentSection.hidden = recentGames.length === 0;
  renderGameGrid(recentGrid, recentGames);
}

function getRecentlyPlayed() {
  try {
    const recent = JSON.parse(localStorage.getItem('playyyy-recent') || '[]');
    return Array.isArray(recent) ? recent.filter(name => typeof name === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

function addRecentlyPlayed(name) {
  const recent = getRecentlyPlayed().filter(gameName => gameName !== name);
  recent.unshift(name);
  try {
    localStorage.setItem('playyyy-recent', JSON.stringify(recent.slice(0, 8)));
  } catch (error) {
    console.warn('Could not save recently played games:', error);
  }
}

function reportIssueUrl(gameName) {
  const params = new URLSearchParams({
    title: `Broken game: ${gameName}`,
    body: `The game "${gameName}" appears to be broken.\n\nPage: ${window.location.origin}/play.html?game=${encodeURIComponent(gameName)}\n\nWhat happened?`,
  });
  return `https://github.com/louis141414/playyyy/issues/new?${params}`;
}

function applyTheme(theme) {
  const selectedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = selectedTheme;
  try {
    localStorage.setItem('playyyy-theme', selectedTheme);
  } catch (error) {
    console.warn('Could not save theme preference:', error);
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = selectedTheme === 'dark' ? 'Light mode' : 'Dark mode';
    themeToggle.setAttribute('aria-label', `Switch to ${selectedTheme === 'dark' ? 'light' : 'dark'} mode`);
  }
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
  document.title = `${game.name} | Playyyy`;
  addRecentlyPlayed(game.name);
  loadStatcounter();

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
        <a class="report-link report-link-large" href="${reportIssueUrl(game.name)}" target="_blank" rel="noopener noreferrer">Report broken game</a>
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
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .catch(error => console.error('Could not register the offline app shell:', error));
  }

  const installButton = document.getElementById('install-app-btn');
  const installStatus = document.getElementById('install-status');
  if (installButton) {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      installButton.hidden = true;
    }

    installButton.addEventListener('click', async () => {
      if (!deferredInstallPrompt) {
        if (installStatus) {
          installStatus.textContent = 'Use your browser menu to install Playyyy or add it to your Home Screen.';
        }
        return;
      }

      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (installStatus) {
        installStatus.textContent = outcome === 'accepted'
          ? 'Playyyy is ready to install.'
          : 'Install dismissed.';
      }
    });
  }

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

  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('playyyy-theme') === 'light' ? 'light' : 'dark';
  } catch {
    savedTheme = 'dark';
  }
  applyTheme(savedTheme);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // ✅ LAAD GAMES EN RENDER DIRECT
  await loadGames();
  
  if (document.getElementById('grid')) {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const randomButton = document.getElementById('random-game-btn');

    if (categoryFilter) {
      [...new Set(allGames.map(getGameCategory))].sort((a, b) => a.localeCompare(b)).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
      });
      categoryFilter.addEventListener('change', event => {
        selectedCategory = event.target.value;
        renderHome();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderHome();
      });
    }
    if (randomButton) {
      randomButton.addEventListener('click', () => {
        const query = searchQuery.trim().toLowerCase();
        const eligibleGames = allGames.filter(game => game && game.name)
          .filter(game => !query || game.name.toLowerCase().includes(query))
          .filter(game => selectedCategory === 'all' || getGameCategory(game) === selectedCategory);
        if (eligibleGames.length) {
          const game = eligibleGames[Math.floor(Math.random() * eligibleGames.length)];
          window.location.href = `play.html?game=${encodeURIComponent(game.name)}`;
        }
      });
    }

    document.addEventListener('keydown', event => {
      const target = event.target;
      const isEditable = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

      if (event.key === '/' && !isEditable && !event.ctrlKey && !event.metaKey && searchInput) {
        event.preventDefault();
        searchInput.focus();
        return;
      }

      if (event.key === 'Escape' && searchInput && searchInput.value) {
        searchInput.value = '';
        searchQuery = '';
        renderHome();
        return;
      }

      if (event.key === 'Enter' && target instanceof HTMLElement && target.classList.contains('card')) {
        event.preventDefault();
        target.querySelector('a:not(.report-link)')?.click();
        return;
      }

      if (isEditable || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
      const cards = [...document.querySelectorAll('#recent-grid .card, #favorites-grid .card, #grid .card')]
        .filter(card => card.getClientRects().length > 0);
      if (!cards.length) return;

      const focusedCard = document.activeElement.closest?.('.card');
      const currentIndex = cards.indexOf(focusedCard);
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = currentIndex < 0 ? 0 : Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
      event.preventDefault();
      cards[nextIndex].focus();
    });

    renderHome();
  } else if (document.getElementById('game-iframe')) {
    renderGame();
  }
});
